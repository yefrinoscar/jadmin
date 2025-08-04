"use client";

import { Sidebar } from "@/components/dashboard/sidebar";
import { RouteLoadingIndicator } from "@/components/route-loading-indicator";
import { Suspense } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 border-r bg-background">
        <Sidebar />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 md:p-6">
        {children}
      </main>

      {/* Route Loading Indicator */}
      <Suspense fallback={null}>
        <RouteLoadingIndicator />
      </Suspense>
    </div>
  );
}