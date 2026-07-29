import React from 'react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  type?: 'order' | 'payment' | 'delivery' | 'purchase' | 'shipment';
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const normStatus = status ? status.toLowerCase().replace(/_/g, ' ') : '';

  let badgeStyles = 'bg-[#F7F6F3] text-[#1A1A1A] border-[#E9E7E2]';

  if (
    normStatus === 'paid' ||
    normStatus === 'delivered' ||
    normStatus === 'received' ||
    normStatus === 'completed' ||
    normStatus === 'arrived'
  ) {
    badgeStyles = 'bg-[#22C55E]/10 text-[#15803D] border-[#22C55E]/30 font-semibold';
  } else if (
    normStatus === 'pending' ||
    normStatus === 'draft' ||
    normStatus === 'unpaid' ||
    normStatus === 'placed'
  ) {
    badgeStyles = 'bg-[#B08D57]/10 text-[#6A4E3B] border-[#B08D57]/30 font-semibold';
  } else if (
    normStatus === 'partial' ||
    normStatus === 'partially received' ||
    normStatus === 'in transit' ||
    normStatus === 'confirmed' ||
    normStatus === 'packed' ||
    normStatus === 'ready for delivery'
  ) {
    badgeStyles = 'bg-[#1F3A2E]/10 text-[#1F3A2E] border-[#1F3A2E]/25 font-semibold';
  } else if (
    normStatus === 'cancelled' ||
    normStatus === 'failed' ||
    normStatus === 'refunded'
  ) {
    badgeStyles = 'bg-[#DC2626]/10 text-[#B91C1C] border-[#DC2626]/30 font-semibold';
  } else if (normStatus === 'returned') {
    badgeStyles = 'bg-[#6A4E3B]/10 text-[#6A4E3B] border-[#6A4E3B]/30 font-semibold';
  }

  const label = normStatus
    ? normStatus
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : 'Unknown';

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] border tracking-wide leading-snug transition-colors',
        badgeStyles,
        className
      )}
    >
      {label}
    </span>
  );
}
