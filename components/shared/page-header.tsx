import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export default function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-[var(--border-subtle)] mb-6 transition-colors duration-300">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-gold-gradient font-serif">{title}</h1>
        {description && <p className="text-sm text-[var(--text-muted)] mt-1 font-medium leading-relaxed">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-3 mt-4 sm:mt-0 flex-wrap">{children}</div>}
    </div>
  );
}
