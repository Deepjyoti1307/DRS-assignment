import React from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background gradient-mesh">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 min-h-screen relative overflow-y-auto">
        {/* Subtle top decoration */}
        <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-lime/5 to-transparent pointer-events-none" />
        
        <div className="relative z-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
