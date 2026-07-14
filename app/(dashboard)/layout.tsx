import React from 'react';
import Sidebar from '@/components/shared/sidebar';
import Header from '@/components/shared/header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="hz-shell">
      {/* Sidebar Navigation */}
      <aside className="hz-shell__sidebar">
        <Sidebar />
      </aside>

      {/* Main Content Area */}
      <div className="hz-shell__main">
        {/* Topbar Header */}
        <header className="hz-topbar">
          <Header />
        </header>

        {/* Dynamic Page Container */}
        <main className="hz-content">
          {children}
        </main>
      </div>
    </div>
  );
}
