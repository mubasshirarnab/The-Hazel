import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import LoginForm from './login-form';

export default async function LoginPage() {
  // If user is already authenticated, redirect them directly to dashboard
  const session = await getServerSession(authOptions);
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-zinc-950 relative overflow-hidden">
      {/* Premium background glowing circles */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Login Card Wrapper */}
      <div className="w-full max-w-md p-8 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md shadow-2xl relative z-10 glass-card mx-4">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex px-3 py-1 rounded bg-rose-500/10 border border-rose-500/20 text-xs font-serif tracking-widest text-rose-400 font-semibold mb-3 uppercase">
            Hazel Handbags
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">
            ERP Management Console
          </h1>
          <p className="text-sm text-zinc-400 mt-1.5">
            Log in to manage shipments, orders, and expenses.
          </p>
        </div>

        {/* Client Login Form */}
        <LoginForm />

        {/* Footer Audit Trail Notice */}
        <div className="text-center mt-8 text-[11px] text-zinc-500 leading-normal">
          Authorized personnel only. All access, operations, and transactions are logged under active user auditing.
        </div>
      </div>
    </div>
  );
}
