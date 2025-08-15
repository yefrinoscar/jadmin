"use client";

import { Sidebar } from "@/components/dashboard/sidebar";
import { RouteLoadingIndicator } from "@/components/route-loading-indicator";
import { Suspense } from "react";

export default function ClientsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50/50">
      {/* Desktop Sidebar */}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* Route Loading Indicator */}
      {/* <Suspense fallback={null}>
        <RouteLoadingIndicator />
      </Suspense> */}
    </div>
  );
}
