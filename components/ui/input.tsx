'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  /** Pre-rendered icon element, e.g. icon={<Mail className="h-4 w-4" />} */
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, icon, ...props }, ref) => {
    const hasIcon = Boolean(icon);
    return (
      <div className="w-full space-y-1">
        <div className="relative flex items-center">
          {hasIcon && (
            <span className="absolute left-3.5 text-[#B08D57] pointer-events-none flex items-center">
              {icon}
            </span>
          )}
          <input
            type={type}
            ref={ref}
            className={cn(
              'w-full py-2.5 text-xs bg-[#FAFAF8] focus:bg-white border border-[#E9E7E2] rounded-[12px] text-[#1A1A1A] placeholder-[#9E9E9E] focus:outline-none focus:border-[#1F3A2E] focus:ring-2 focus:ring-[#1F3A2E]/15 transition-all shadow-soft-1 font-medium disabled:opacity-50',
              hasIcon ? 'pl-10 pr-4' : 'px-3.5',
              error && 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/15',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-[11px] font-semibold text-[#DC2626] pl-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full space-y-1">
        <textarea
          ref={ref}
          className={cn(
            'w-full p-3.5 text-xs bg-[#FAFAF8] focus:bg-white border border-[#E9E7E2] rounded-[12px] text-[#1A1A1A] placeholder-[#9E9E9E] focus:outline-none focus:border-[#1F3A2E] focus:ring-2 focus:ring-[#1F3A2E]/15 transition-all shadow-soft-1 font-medium disabled:opacity-50 min-h-[90px]',
            error && 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/15',
            className
          )}
          {...props}
        />
        {error && <p className="text-[11px] font-semibold text-[#DC2626] pl-1">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <div className="w-full space-y-1">
        <select
          ref={ref}
          className={cn(
            'w-full px-3.5 py-2.5 text-xs bg-[#FAFAF8] focus:bg-white border border-[#E9E7E2] rounded-[12px] text-[#1A1A1A] focus:outline-none focus:border-[#1F3A2E] focus:ring-2 focus:ring-[#1F3A2E]/15 transition-all shadow-soft-1 font-medium disabled:opacity-50 cursor-pointer',
            error && 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/15',
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-[11px] font-semibold text-[#DC2626] pl-1">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Input;
