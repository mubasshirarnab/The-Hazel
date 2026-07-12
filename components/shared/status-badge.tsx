import React from 'react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  type: 'order' | 'payment' | 'delivery' | 'purchase' | 'shipment';
  className?: string;
}

export default function StatusBadge({ status, type, className = '' }: StatusBadgeProps) {
  const normStatus = status.toLowerCase().replace(/_/g, ' ');

  // Color mapping based on standard states
  let badgeStyles = 'bg-zinc-800 text-zinc-300 border-zinc-700';

  if (
    normStatus === 'paid' ||
    normStatus === 'delivered' ||
    normStatus === 'received' ||
    normStatus === 'completed' ||
    normStatus === 'arrived'
  ) {
    badgeStyles = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  } else if (
    normStatus === 'pending' ||
    normStatus === 'draft' ||
    normStatus === 'unpaid' ||
    normStatus === 'placed'
  ) {
    badgeStyles = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  } else if (
    normStatus === 'partial' ||
    normStatus === 'partially received' ||
    normStatus === 'in transit' ||
    normStatus === 'confirmed' ||
    normStatus === 'packed' ||
    normStatus === 'ready for delivery'
  ) {
    badgeStyles = 'bg-sky-500/10 text-sky-400 border-sky-500/20';
  } else if (
    normStatus === 'cancelled' ||
    normStatus === 'failed' ||
    normStatus === 'refunded'
  ) {
    badgeStyles = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  }

  // Capitalize first letter of each word
  const label = normStatus
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border leading-none',
        badgeStyles,
        className
      )}
    >
      {label}
    </span>
  );
}
