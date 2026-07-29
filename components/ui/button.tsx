'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  /**
   * Pass a pre-rendered icon element, NOT a component reference.
   * e.g. icon={<Plus className="h-4 w-4" />}
   * This keeps Button compatible with Server Components.
   */
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      icon,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none cursor-pointer rounded-[12px]';

    const variants = {
      primary:
        'bg-[#1F3A2E] text-white hover:bg-[#162A21] focus:ring-[#1F3A2E]/30 shadow-soft-1 hover:shadow-soft-2 active:bg-[#0E1B15]',
      secondary:
        'bg-white text-[#1A1A1A] border border-[#E9E7E2] hover:bg-[#F7F6F3] hover:border-[#D8D5CD] focus:ring-[#1F3A2E]/20 shadow-soft-1',
      outline:
        'bg-transparent text-[#1F3A2E] border border-[#1F3A2E]/30 hover:bg-[#1F3A2E]/5 focus:ring-[#1F3A2E]/20',
      ghost:
        'bg-transparent text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F7F6F3] focus:ring-[#1F3A2E]/10',
      danger:
        'bg-[#DC2626] text-white hover:bg-[#B91C1C] focus:ring-[#DC2626]/30 shadow-soft-1',
      gold:
        'bg-[#B08D57] text-white hover:bg-[#977747] focus:ring-[#B08D57]/30 shadow-soft-1',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5 h-8',
      md: 'text-xs font-semibold px-4 py-2.5 gap-2 h-10',
      lg: 'text-sm font-semibold px-5 py-3 gap-2.5 h-12',
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.98 }}
        disabled={disabled || loading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
        ) : icon ? (
          icon
        ) : null}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
