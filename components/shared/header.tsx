'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { User, Bell } from 'lucide-react';

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="h-16 border-b border-zinc-800/80 bg-zinc-950 px-8 flex items-center justify-between shrink-0">
      {/* Greetings */}
      <div>
        <span className="text-xs text-zinc-500 font-semibold tracking-wider uppercase">Welcome Back</span>
        <h2 className="text-sm font-semibold text-zinc-300">
          Hello, {session?.user?.name || 'User'}
        </h2>
      </div>

      {/* Quick Meta Options */}
      <div className="flex items-center gap-4">
        {/* User Code badge */}
        {session?.user?.userCode && (
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-rose-400">
            {session?.user?.userCode}
          </span>
        )}

        {/* Notifications Icon (Decorative for UI balance) */}
        <button className="p-2 rounded-lg border border-zinc-800/80 bg-zinc-900/30 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer">
          <Bell className="h-4 w-4" />
        </button>

        {/* Vertical divider */}
        <div className="h-6 w-px bg-zinc-800" />

        {/* User avatar badge */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <User className="h-4 w-4 text-rose-400" />
          </div>
          <span className="text-xs font-medium text-zinc-300 capitalize hidden sm:inline">
            {session?.user?.role || 'viewer'}
          </span>
        </div>
      </div>
    </header>
  );
}
