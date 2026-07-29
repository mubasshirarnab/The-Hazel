'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        toast.error(res.error || 'Authentication failed. Please try again.');
      } else {
        toast.success('Successfully authenticated! Opening Console...');
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      toast.error('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Email Field */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[#1F3A2E] uppercase tracking-wider block">Email Address</label>
        <Input
          type="email"
          icon={<Mail className="h-4 w-4 shrink-0" />}
          placeholder="admin@hazel.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      {/* Password Field */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[#1F3A2E] uppercase tracking-wider block">Password</label>
        <Input
          type="password"
          icon={<Lock className="h-4 w-4 shrink-0" />}
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        loading={loading}
        variant="primary"
        size="lg"
        className="w-full mt-2"
      >
        <span>Access ERP Console</span>
        <ArrowRight className="h-4 w-4 text-white ml-1" />
      </Button>
    </form>
  );
}
