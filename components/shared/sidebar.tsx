'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  ShoppingBag,
  Box,
  Users,
  ShoppingCart,
  FileText,
  Truck,
  Percent,
  Landmark,
  Megaphone,
  Settings,
  LogOut,
  User,
  Crown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Products', href: '/products', icon: ShoppingBag },
  { name: 'Inventory', href: '/inventory', icon: Box },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Purchase Orders', href: '/purchase-orders', icon: FileText },
  { name: 'Shipments', href: '/shipments', icon: Truck },
  { name: 'Cost Allocation', href: '/cost-allocation', icon: Percent },
  { name: 'Finance', href: '/finance', icon: Landmark, adminOnly: true },
  { name: 'Marketing', href: '/marketing', icon: Megaphone },
  { name: 'Settings', href: '/settings', icon: Settings, adminOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role || 'viewer';

  return (
    <aside className="w-64 bg-[var(--bg-sidebar)] border-r border-[var(--border-subtle)] flex flex-col h-full shrink-0 z-20 shadow-xl relative transition-colors duration-300">
      {/* Glow highlight */}
      <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent pointer-events-none" />

      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-[var(--border-subtle)] justify-between relative z-10">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-400 via-amber-600 to-rose-600 p-0.5 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform duration-300">
            <div className="h-full w-full bg-[var(--bg-surface)] rounded-[10px] flex items-center justify-center">
              <Crown className="h-4.5 w-4.5 text-amber-500" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-extrabold tracking-widest text-gold-gradient font-serif leading-none">HAZEL</span>
            <span className="text-[9px] font-bold text-[var(--accent-gold)] tracking-widest uppercase mt-1">HAUTE COUTURE ERP</span>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1 scrollbar-thin relative z-10">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const isAllowed = !item.adminOnly || userRole === 'admin';

          if (!isAllowed) return null;

          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative',
                isActive
                  ? 'bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-transparent text-[var(--accent-gold)] border border-amber-500/30 shadow-xs font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] border border-transparent'
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-1 bg-gradient-to-b from-amber-400 to-rose-500 rounded-r-full shadow-xs" />
              )}
              <Icon
                className={cn(
                  'h-4.5 w-4.5 shrink-0 transition-transform duration-200 group-hover:scale-110',
                  isActive ? 'text-amber-500' : 'text-[var(--text-subtle)] group-hover:text-[var(--accent-gold)]'
                )}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile Card */}
      <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] relative z-10">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="h-9 w-9 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
            <User className="h-4.5 w-4.5 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[var(--text-main)] truncate leading-tight">
              {session?.user?.name || 'User'}
            </p>
            <p className="text-[10px] font-semibold text-[var(--accent-gold)] uppercase tracking-widest truncate mt-0.5">
              {session?.user?.role || 'Viewer'}
            </p>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="mt-3.5 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 border border-[var(--border-subtle)] hover:border-rose-500/30 transition-all duration-200 cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
