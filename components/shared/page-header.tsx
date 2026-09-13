import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export default function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pb-4 sm:pb-6 border-b border-[#E9E7E2] mb-4 sm:mb-6">
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1F3A2E] font-serif truncate sm:whitespace-normal">{title}</h1>
        {description && <p className="text-xs text-[#6B6B6B] mt-1 font-medium leading-relaxed">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">{children}</div>}
    </div>
  );
}

