import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export default function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-zinc-800/80 mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-50">{title}</h1>
        {description && <p className="text-sm text-zinc-400 mt-1">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-3 mt-4 sm:mt-0">{children}</div>}
    </div>
  );
}
