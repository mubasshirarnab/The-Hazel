'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { User, Bell } from 'lucide-react';

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="h-14 px-6 flex items-center justify-between shrink-0">
      {/* Greetings */}
      <div>
        <span className="text-[10px] font-semibold tracking-widest uppercase text-[var(--hz-ink-muted)]">Welcome Back</span>
        <h2 className="text-xs font-semibold text-[var(--hz-ink)] mt-0.5">
          Hello, {session?.user?.name || 'User'}
        </h2>
      </div>

      {/* Quick Meta Options */}
      <div className="flex items-center gap-4">
        {/* User Code badge */}
        {session?.user?.userCode && (
          <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-sm bg-[var(--hz-alabaster)] border border-[var(--hz-line)] text-[var(--hz-forest)]">
            {session?.user?.userCode}
          </span>
        )}

        {/* Notifications Icon (Decorative for UI balance) */}
        <button className="p-2 rounded-sm border border-[var(--hz-line)] bg-[var(--hz-alabaster)] hover:bg-[var(--hz-ivory)] text-[var(--hz-ink-muted)] hover:text-[var(--hz-ink)] transition-colors cursor-pointer">
          <Bell className="h-3.5 w-3.5" />
        </button>

        {/* Vertical divider */}
        <div className="h-5 w-px bg-[var(--hz-line)]" />

        {/* User avatar badge */}
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-[var(--hz-forest)]/10 border border-[var(--hz-forest)]/20 flex items-center justify-center">
            <User className="h-3.5 w-3.5 text-[var(--hz-forest)]" />
          </div>
          <span className="text-[10px] font-medium text-[var(--hz-ink)] capitalize hidden sm:inline">
            {session?.user?.role || 'viewer'}
          </span>
        </div>
      </div>
    </header>
  );
}
