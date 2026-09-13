import React from 'react';
import Sidebar from '@/components/shared/sidebar';
import Header from '@/components/shared/header';
import { SidebarProvider } from '@/components/shared/sidebar-context';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-[#FAFAF8]">
        {/* Sidebar Navigation */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* Topbar Header */}
          <Header />

          {/* Dynamic Page Container */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scrollbar-thin bg-[#FAFAF8] text-[#1A1A1A]">
            <div className="mx-auto max-w-7xl w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

