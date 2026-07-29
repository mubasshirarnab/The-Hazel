import React from 'react';
import Sidebar from '@/components/shared/sidebar';
import Header from '@/components/shared/header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-app)] text-[var(--text-main)] transition-colors duration-300">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar Header */}
        <Header />

        {/* Dynamic Page Container */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-thin bg-[var(--bg-app)] text-[var(--text-main)] transition-colors duration-300">
          <div className="mx-auto max-w-7xl w-full animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
