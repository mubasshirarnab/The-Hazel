'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'forest' | 'gold' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline';
  children: React.ReactNode;
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-[#F7F6F3] text-[#1A1A1A] border-[#E9E7E2]',
    forest: 'bg-[#1F3A2E]/10 text-[#1F3A2E] border-[#1F3A2E]/20 font-semibold',
    gold: 'bg-[#B08D57]/10 text-[#6A4E3B] border-[#B08D57]/30 font-semibold',
    secondary: 'bg-[#6A4E3B]/10 text-[#6A4E3B] border-[#6A4E3B]/20',
    success: 'bg-[#22C55E]/10 text-[#15803D] border-[#22C55E]/30',
    warning: 'bg-[#D97706]/10 text-[#B45309] border-[#D97706]/30',
    danger: 'bg-[#DC2626]/10 text-[#B91C1C] border-[#DC2626]/30',
    outline: 'bg-transparent text-[#6B6B6B] border-[#E9E7E2]',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border tracking-wide transition-colors',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default Badge;
