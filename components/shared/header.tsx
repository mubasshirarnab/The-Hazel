'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { User, Bell, Sparkles, Menu } from 'lucide-react';
import { useSidebar } from './sidebar-context';

export default function Header() {
  const { data: session } = useSession();
  const { toggleMobileSidebar } = useSidebar();

  return (
    <header className="h-16 border-b border-[#E9E7E2] glass-header px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-soft-1">
      {/* Left: Mobile Menu Toggle & Greetings */}
      <div className="flex items-center gap-3">
        {/* Hamburger Menu on Mobile / Tablet */}
        <button
          onClick={toggleMobileSidebar}
          className="lg:hidden p-2 rounded-[10px] border border-[#E9E7E2] bg-white hover:bg-[#F7F6F3] text-[#1F3A2E] hover:text-[#162A21] transition-colors shadow-soft-1 cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Greetings */}
        <div>
          <span className="text-[9px] sm:text-[10px] text-[#B08D57] font-bold tracking-widest uppercase block">
            Haute Couture Command System
          </span>
          <h2 className="text-xs sm:text-sm font-bold text-[#1A1A1A] flex items-center gap-1.5 sm:gap-2">
            <span className="truncate max-w-[140px] sm:max-w-none">
              Welcome, {session?.user?.name || 'User'}
            </span>
            <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#B08D57] shrink-0" />
          </h2>
        </div>
      </div>

      {/* Right: Quick Meta Options */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* User Code badge */}
        {session?.user?.userCode && (
          <span className="hidden sm:inline-block text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#1F3A2E]/10 border border-[#1F3A2E]/20 text-[#1F3A2E] shadow-soft-1">
            {session?.user?.userCode}
          </span>
        )}

        {/* Notifications Icon */}
        <button className="p-2 rounded-[10px] border border-[#E9E7E2] bg-white hover:bg-[#F7F6F3] text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors shadow-soft-1 cursor-pointer">
          <Bell className="h-4 w-4" />
        </button>

        {/* Vertical divider */}
        <div className="h-5 w-px bg-[#E9E7E2] hidden sm:block" />

        {/* User avatar badge */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-[#1F3A2E]/10 border border-[#1F3A2E]/20 flex items-center justify-center shadow-soft-1 shrink-0">
            <User className="h-4 w-4 text-[#1F3A2E]" />
          </div>
          <span className="text-xs font-bold text-[#1F3A2E] uppercase tracking-wider hidden md:inline">
            {session?.user?.role || 'viewer'}
          </span>
        </div>
      </div>
    </header>
  );
}

