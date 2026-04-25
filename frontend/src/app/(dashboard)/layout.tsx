"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import Footer from "@/components/landing/Footer";
import { DashboardTransition } from "@/components/dashboard/DashboardTransition";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(true); // Default collapsed (hidden on mobile)

  return (
    <div className="flex min-h-screen bg-background gradient-mesh overflow-x-hidden selection:bg-lime/20 selection:text-lime">
      {/* Mobile Menu Trigger */}
      <button
        onClick={() => setIsCollapsed(false)}
        className={cn(
          "fixed top-6 left-6 z-[80] p-3 rounded-xl glass-panel md:hidden transition-all duration-300",
          !isCollapsed && "opacity-0 pointer-events-none"
        )}
      >
        <Menu className="w-5 h-5 text-white" />
      </button>

      <Sidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />
      <main className={cn(
        "flex-1 min-h-screen relative overflow-y-auto flex flex-col transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]",
        "ml-0 md:ml-64",
        isCollapsed && "md:ml-[80px]"
      )}>
        {/* Subtle top decoration */}
        <div className="absolute top-0 left-0 right-0 h-[60vh] bg-gradient-to-b from-lime/[0.02] via-transparent to-transparent pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          className="relative z-20 flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full"
        >
          <ErrorBoundary>
            <DashboardTransition>
              {children}
            </DashboardTransition>
          </ErrorBoundary>
        </motion.div>

        <div className="mt-auto relative z-10 w-full px-8">
          <Footer />
        </div>
      </main>
    </div>
  );
}
