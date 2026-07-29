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
        <label className="text-xs font-bold text-[var(--accent-gold)] uppercase tracking-wider block">Email Address</label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-[var(--accent-gold)] opacity-70" />
          <input
            type="email"
            placeholder="admin@hazel.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="w-full pl-10 pr-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-[var(--text-main)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:border-[var(--accent-gold)] focus:ring-2 focus:ring-amber-500/20 transition-all font-medium disabled:opacity-50 shadow-2xs"
            required
          />
        </div>
      </div>

      {/* Password Field */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[var(--accent-gold)] uppercase tracking-wider block">Password</label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-[var(--accent-gold)] opacity-70" />
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="w-full pl-10 pr-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-[var(--text-main)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:border-[var(--accent-gold)] focus:ring-2 focus:ring-amber-500/20 transition-all font-medium disabled:opacity-50 shadow-2xs"
            required
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-amber-500 via-amber-600 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-extrabold rounded-xl text-sm transition-all duration-300 shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
      >
        {loading ? (
          <>
            <Loader2 className="h-4.5 w-4.5 animate-spin text-white" />
            <span>Authenticating...</span>
          </>
        ) : (
          <>
            <span>Access ERP Console</span>
            <ArrowRight className="h-4 w-4 text-white" />
          </>
        )}
      </button>
    </form>
  );
}
