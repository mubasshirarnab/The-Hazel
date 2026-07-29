'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { User, Bell, Sparkles } from 'lucide-react';

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="h-16 border-b border-[#E9E7E2] glass-header px-8 flex items-center justify-between shrink-0 sticky top-0 z-10 shadow-soft-1">
      {/* Greetings */}
      <div>
        <span className="text-[10px] text-[#B08D57] font-bold tracking-widest uppercase">Haute Couture Command System</span>
        <h2 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
          <span>Welcome back, {session?.user?.name || 'User'}</span>
          <Sparkles className="h-3.5 w-3.5 text-[#B08D57]" />
        </h2>
      </div>

      {/* Quick Meta Options */}
      <div className="flex items-center gap-4">
        {/* User Code badge */}
        {session?.user?.userCode && (
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#1F3A2E]/10 border border-[#1F3A2E]/20 text-[#1F3A2E] shadow-soft-1">
            {session?.user?.userCode}
          </span>
        )}

        {/* Notifications Icon */}
        <button className="p-2 rounded-[10px] border border-[#E9E7E2] bg-white hover:bg-[#F7F6F3] text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors shadow-soft-1 cursor-pointer">
          <Bell className="h-4 w-4" />
        </button>

        {/* Vertical divider */}
        <div className="h-5 w-px bg-[#E9E7E2]" />

        {/* User avatar badge */}
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-[#1F3A2E]/10 border border-[#1F3A2E]/20 flex items-center justify-center shadow-soft-1">
            <User className="h-4 w-4 text-[#1F3A2E]" />
          </div>
          <span className="text-xs font-bold text-[#1F3A2E] uppercase tracking-wider hidden sm:inline">
            {session?.user?.role || 'viewer'}
          </span>
        </div>
      </div>
    </header>
  );
}
