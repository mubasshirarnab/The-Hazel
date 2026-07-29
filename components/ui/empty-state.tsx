'use client';

import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = PackageOpen,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-12 text-center rounded-[18px] border border-dashed border-[#E9E7E2] bg-[#FAFAF8]/50 my-4',
        className
      )}
    >
      <div className="h-12 w-12 rounded-2xl bg-[#F7F6F3] border border-[#E9E7E2] flex items-center justify-center mb-4 text-[#B08D57] shadow-soft-1">
        <Icon className="h-6 w-6" />
      </div>
      <h4 className="text-base font-bold font-serif text-[#1F3A2E]">{title}</h4>
      {description && (
        <p className="text-xs text-[#6B6B6B] max-w-sm mt-1 mb-6 font-medium leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
