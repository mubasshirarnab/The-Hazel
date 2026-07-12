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
  BarChart3,
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
    <aside className="w-64 bg-zinc-950 border-r border-zinc-800/80 flex flex-col h-full shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-zinc-800/80">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-wider text-rose-500 font-serif">HAZEL</span>
          <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 font-semibold uppercase">ERP</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 scrollbar-thin scrollbar-thumb-zinc-800">
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
                'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 border border-transparent'
              )}
            >
              <Icon className={cn('h-4.5 w-4.5 shrink-0', isActive ? 'text-rose-400' : 'text-zinc-400 group-hover:text-zinc-200')} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile Card */}
      <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/10">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="h-9 w-9 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
            <User className="h-4.5 w-4.5 text-rose-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-zinc-200 truncate leading-tight">
              {session?.user?.name || 'User'}
            </p>
            <p className="text-xs text-zinc-500 capitalize truncate mt-0.5">
              {session?.user?.role || 'Viewer'}
            </p>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-zinc-400 hover:text-rose-400 hover:bg-rose-500/5 border border-zinc-800/60 hover:border-rose-500/25 transition-all duration-150 cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
