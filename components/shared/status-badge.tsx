import React from 'react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  type?: 'order' | 'payment' | 'delivery' | 'purchase' | 'shipment';
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const normStatus = status ? status.toLowerCase().replace(/_/g, ' ') : '';

  // Theme-aware, readable badge styles for both Light and Dark mode
  let badgeStyles = 'bg-slate-100 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700';

  if (
    normStatus === 'paid' ||
    normStatus === 'delivered' ||
    normStatus === 'received' ||
    normStatus === 'completed' ||
    normStatus === 'arrived'
  ) {
    badgeStyles = 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-semibold';
  } else if (
    normStatus === 'pending' ||
    normStatus === 'draft' ||
    normStatus === 'unpaid' ||
    normStatus === 'placed'
  ) {
    badgeStyles = 'bg-amber-500/10 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30 font-semibold';
  } else if (
    normStatus === 'partial' ||
    normStatus === 'partially received' ||
    normStatus === 'in transit' ||
    normStatus === 'confirmed' ||
    normStatus === 'packed' ||
    normStatus === 'ready for delivery'
  ) {
    badgeStyles = 'bg-sky-500/10 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30 font-semibold';
  } else if (
    normStatus === 'cancelled' ||
    normStatus === 'failed' ||
    normStatus === 'refunded'
  ) {
    badgeStyles = 'bg-rose-500/10 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 font-semibold';
  } else if (normStatus === 'returned') {
    badgeStyles = 'bg-purple-500/10 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 font-semibold';
  }

  // Capitalize first letter of each word
  const label = normStatus
    ? normStatus
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : 'Unknown';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border tracking-wide leading-tight shadow-2xs',
        badgeStyles,
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  );
}
