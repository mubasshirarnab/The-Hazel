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
  icon: React.ComponentType<{ className?: string }>;
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
    <aside className="w-64 bg-white border-r border-[#E9E7E2] flex flex-col h-full shrink-0 z-20 shadow-soft-1 relative select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-[#E9E7E2] justify-between relative z-10">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="h-9 w-9 rounded-[12px] bg-[#1F3A2E] flex items-center justify-center shadow-soft-1 group-hover:bg-[#162A21] transition-colors">
            <Crown className="h-4.5 w-4.5 text-[#B08D57]" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-widest text-[#1F3A2E] font-serif leading-none">HAZEL</span>
            <span className="text-[9px] font-bold text-[#B08D57] tracking-widest uppercase mt-1">HAUTE COUTURE ERP</span>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3.5 py-6 space-y-1 relative z-10">
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
                'flex items-center gap-3 px-3.5 py-2.5 rounded-[12px] text-xs font-medium transition-all duration-200 group relative',
                isActive
                  ? 'bg-[#1F3A2E] text-white font-semibold shadow-soft-1'
                  : 'text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F7F6F3]'
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-1 bg-[#B08D57] rounded-r-full" />
              )}
              <Icon
                className={cn(
                  'h-4.5 w-4.5 shrink-0 transition-transform duration-200 group-hover:scale-105',
                  isActive ? 'text-[#B08D57]' : 'text-[#9E9E9E] group-hover:text-[#1F3A2E]'
                )}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-[#E9E7E2] bg-[#FAFAF8]">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="h-9 w-9 rounded-full bg-[#1F3A2E]/10 border border-[#1F3A2E]/20 flex items-center justify-center shrink-0">
            <User className="h-4.5 w-4.5 text-[#1F3A2E]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[#1A1A1A] truncate leading-tight">
              {session?.user?.name || 'User'}
            </p>
            <p className="text-[10px] font-semibold text-[#B08D57] uppercase tracking-widest truncate mt-0.5">
              {session?.user?.role || 'Viewer'}
            </p>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-[10px] text-xs font-semibold text-[#6B6B6B] hover:text-[#DC2626] hover:bg-[#DC2626]/10 border border-[#E9E7E2] hover:border-[#DC2626]/30 transition-all duration-200 cursor-pointer shadow-soft-1"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
