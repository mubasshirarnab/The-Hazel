import React from 'react';
import Sidebar from '@/components/shared/sidebar';
import Header from '@/components/shared/header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar Header */}
        <Header />

        {/* Dynamic Page Container */}
        <main className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-zinc-800/80 bg-zinc-950 text-zinc-100">
          <div className="mx-auto max-w-7xl w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
