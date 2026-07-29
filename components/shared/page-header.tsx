import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export default function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-[#E9E7E2] mb-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#1F3A2E] font-serif">{title}</h1>
        {description && <p className="text-xs text-[#6B6B6B] mt-1 font-medium leading-relaxed">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-3 mt-4 sm:mt-0">{children}</div>}
    </div>
  );
}
