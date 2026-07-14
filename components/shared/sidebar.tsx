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
    <aside className="flex flex-col h-full">
      {/* Brand Header */}
      <div className="h-14 flex items-center px-6 border-b border-[var(--hz-line)]">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="text-xl font-display font-semibold tracking-wide text-[var(--hz-forest)]">HAZEL</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--hz-ink-muted)] border border-[var(--hz-line)] px-2 py-0.5 rounded-sm">ERP</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
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
                'flex items-center gap-3 px-3 py-2.5 rounded text-xs font-medium transition-all duration-120',
                isActive
                  ? 'bg-[var(--hz-forest)] text-white shadow-sm'
                  : 'text-[var(--hz-ink-soft)] hover:text-[var(--hz-ink)] hover:bg-[var(--hz-ivory)]'
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-[var(--hz-ink-muted)]')} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile Card */}
      <div className="p-4 border-t border-[var(--hz-line)] bg-[var(--hz-alabaster)]">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="h-8 w-8 rounded-full bg-[var(--hz-forest)]/10 border border-[var(--hz-forest)]/20 flex items-center justify-center shrink-0">
            <User className="h-4 w-4 text-[var(--hz-forest)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[var(--hz-ink)] truncate leading-tight">
              {session?.user?.name || 'User'}
            </p>
            <p className="text-[10px] text-[var(--hz-ink-muted)] capitalize truncate mt-0.5">
              {session?.user?.role || 'Viewer'}
            </p>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-[10px] font-semibold text-[var(--hz-ink-muted)] hover:text-[var(--hz-danger-fg)] hover:bg-[var(--hz-danger-bg)] border border-[var(--hz-line)] hover:border-[var(--hz-danger-fg)] transition-all duration-120 cursor-pointer"
        >
          <LogOut className="h-3 w-3" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
