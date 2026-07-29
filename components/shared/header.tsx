'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { User, Bell, Sparkles, Sun, Moon } from 'lucide-react';
import { useTheme } from './theme-provider';

export default function Header() {
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-16 border-b border-[var(--border-subtle)] bg-[var(--bg-header)] backdrop-blur-xl px-6 md:px-8 flex items-center justify-between shrink-0 sticky top-0 z-10 transition-colors duration-300">
      {/* Greetings */}
      <div className="flex flex-col">
        <span className="text-[10px] text-[var(--accent-gold)] font-bold tracking-widest uppercase flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Haute Couture Command System
        </span>
        <h2 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2 mt-0.5">
          <span>Welcome back, {session?.user?.name || 'User'}</span>
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
        </h2>
      </div>

      {/* Quick Meta Options */}
      <div className="flex items-center gap-3">
        {/* User Code badge */}
        {session?.user?.userCode && (
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300 shadow-xs">
            {session?.user?.userCode}
          </span>
        )}

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          className="p-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--accent-gold)] transition-all duration-200 cursor-pointer shadow-xs active:scale-95 flex items-center gap-2"
        >
          {theme === 'light' ? (
            <>
              <Moon className="h-4 w-4 text-amber-600 transition-transform duration-300 rotate-0 hover:-rotate-12" />
              <span className="text-xs font-semibold hidden md:inline text-[var(--text-main)]">Dark Mode</span>
            </>
          ) : (
            <>
              <Sun className="h-4 w-4 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" />
              <span className="text-xs font-semibold hidden md:inline text-[var(--text-main)]">Light Mode</span>
            </>
          )}
        </button>

        {/* Notifications Icon */}
        <button className="p-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--accent-gold)] transition-all duration-200 cursor-pointer shadow-xs active:scale-95 relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-[var(--bg-surface)]" />
        </button>

        {/* Vertical divider */}
        <div className="h-5 w-px bg-[var(--border-subtle)] hidden sm:block" />

        {/* User avatar badge */}
        <div className="flex items-center gap-2.5 bg-[var(--bg-surface)] px-3 py-1.5 rounded-xl border border-[var(--border-subtle)]">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold shadow-xs">
            <User className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-bold text-[var(--accent-gold)] uppercase tracking-wider hidden sm:inline">
            {session?.user?.role || 'viewer'}
          </span>
        </div>
      </div>
    </header>
  );
}
