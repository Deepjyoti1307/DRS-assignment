"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Settings, 
  Zap,
  PlusCircle,
  History
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserButton } from "@clerk/nextjs";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
  { icon: Calendar, label: "My Events", href: "/dashboard/events" },
  { icon: Users, label: "Attendees", href: "/dashboard/attendees" },
  { icon: Zap, label: "Integrations", href: "/dashboard/integrations" },
  { icon: History, label: "Audit Trail", href: "/dashboard/audit" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 sidebar-glass flex flex-col z-50">
      <div className="p-8">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-lime rounded-lg flex items-center justify-center border-glow group-hover:scale-110 transition-transform">
            <span className="text-olive-dark font-black text-xl">E</span>
          </div>
          <span className="font-heading font-bold text-xl tracking-tight">Eventic</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-lime/10 text-lime border-glow border border-lime/20" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5",
                isActive ? "text-lime" : "group-hover:text-lime transition-colors"
              )} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-white/5">
        <Link 
          href="/dashboard/events/new"
          className="flex items-center justify-center gap-2 w-full py-4 bg-lime text-[#1a1e0a] rounded-xl font-bold hover:bg-lime/90 transition-colors mb-4 border-glow"
        >
          <PlusCircle className="w-5 h-5" />
          Create Event
        </Link>
        
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl glass-panel">
          <UserButton afterSignOutUrl="/" />
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-semibold truncate text-white">Organizer</span>
            <span className="text-xs text-muted-foreground truncate">Dashboard</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
