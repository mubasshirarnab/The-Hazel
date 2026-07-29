'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-[12px] bg-[#E9E7E2]/60',
        className
      )}
      {...props}
    />
  );
}

export default Skeleton;
