import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import LoginForm from './login-form';
import { Crown } from 'lucide-react';

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-[#FAFAF8] relative overflow-hidden p-4 animate-fade-in">
      {/* Soft luxury ambient background lighting */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#B08D57]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-[#1F3A2E]/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Login Card Wrapper */}
      <div className="w-full max-w-md p-9 rounded-[22px] border border-[#E9E7E2] bg-white/95 backdrop-blur-2xl shadow-soft-3 relative z-10 mx-4">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#1F3A2E]/10 border border-[#1F3A2E]/20 text-[11px] font-bold tracking-widest text-[#1F3A2E] uppercase mb-4 shadow-soft-1">
            <Crown className="h-3.5 w-3.5 text-[#B08D57]" />
            <span>Hazel Haute Couture</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1F3A2E] font-serif">
            ERP Management Console
          </h1>
          <p className="text-xs font-medium text-[#6B6B6B] mt-2 leading-relaxed">
            Authorized portal for shipments, sales orders, inventory & financial operations.
          </p>
        </div>

        {/* Client Login Form */}
        <LoginForm />

        {/* Footer Audit Trail Notice */}
        <div className="text-center mt-8 text-[11px] text-[#9E9E9E] font-medium leading-normal border-t border-[#E9E7E2] pt-4">
          Restricted access. All user operations, access, and transactions are logged under audit security.
        </div>
      </div>
    </div>
  );
}
