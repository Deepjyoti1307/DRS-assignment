import React from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import Footer from "@/components/landing/Footer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background gradient-mesh">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen relative overflow-y-auto flex flex-col">
        {/* Subtle top decoration */}
        <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-lime/5 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex-1 p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>

        <div className="mt-auto relative z-10 w-full px-8">
          <Footer />
        </div>
      </main>
    </div>
  );
}
