'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { Lock, Mail, Loader2, ArrowRight } from 'lucide-react';

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
        toast.success('Successfully logged in! Redirecting...');
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
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Email Address</label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
          <input
            type="email"
            placeholder="admin@hazel.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="w-full pl-11 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 text-sm focus:outline-none focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/80 transition-colors disabled:opacity-50"
            required
          />
        </div>
      </div>

      {/* Password Field */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Password</label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="w-full pl-11 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 text-sm focus:outline-none focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/80 transition-colors disabled:opacity-50"
            required
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-rose-600 hover:bg-rose-500 text-zinc-50 rounded-lg text-sm font-semibold transition-all duration-150 shadow-lg shadow-rose-600/10 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="h-4.5 w-4.5 animate-spin" />
            <span>Signing In...</span>
          </>
        ) : (
          <>
            <span>Access ERP Portal</span>
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  );
}
