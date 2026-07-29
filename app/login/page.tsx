import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import LoginForm from './login-form';
import { Crown } from 'lucide-react';

export default async function LoginPage() {
  // If user is already authenticated, redirect them directly to dashboard
  const session = await getServerSession(authOptions);
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-[var(--bg-app)] text-[var(--text-main)] relative overflow-hidden p-4 transition-colors duration-300">
      {/* Premium ambient lighting glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-amber-500/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[550px] h-[550px] bg-rose-500/10 rounded-full blur-[170px] pointer-events-none" />

      {/* Login Card Wrapper */}
      <div className="w-full max-w-md p-8 md:p-9 rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] backdrop-blur-2xl shadow-2xl relative z-10 mx-4 transition-colors duration-300">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] font-bold tracking-widest text-[var(--accent-gold)] uppercase mb-4 shadow-2xs">
            <Crown className="h-3.5 w-3.5 text-amber-500" />
            <span>Hazel Haute Couture</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gold-gradient font-serif">
            ERP Management Console
          </h1>
          <p className="text-xs font-medium text-[var(--text-muted)] mt-2 leading-relaxed">
            Authorized portal for shipments, sales orders, inventory & financial operations.
          </p>
        </div>

        {/* Client Login Form */}
        <LoginForm />

        {/* Footer Audit Trail Notice */}
        <div className="text-center mt-8 text-[11px] text-[var(--text-muted)] font-medium leading-normal border-t border-[var(--border-subtle)] pt-4">
          Restricted access. All user operations, access, and transactions are logged under audit security.
        </div>
      </div>
    </div>
  );
}
