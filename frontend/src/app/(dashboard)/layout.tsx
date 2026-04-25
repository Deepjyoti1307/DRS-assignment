"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import Footer from "@/components/landing/Footer";
import { DashboardTransition } from "@/components/dashboard/DashboardTransition";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-background gradient-mesh overflow-x-hidden">
      <Sidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />
      <main className={cn(
        "flex-1 min-h-screen relative overflow-y-auto flex flex-col transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
        isCollapsed ? "ml-[80px]" : "ml-64"
      )}>
        {/* Subtle top decoration */}
        <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-lime/5 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex-1 p-8 max-w-7xl mx-auto w-full">
          <ErrorBoundary>
            <DashboardTransition>
              {children}
            </DashboardTransition>
          </ErrorBoundary>
        </div>

        <div className="mt-auto relative z-10 w-full px-8">
          <Footer />
        </div>
      </main>
    </div>
  );
}
