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
  History,
  Menu,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserButton } from "@clerk/nextjs";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
  { icon: Users, label: "Attendees", href: "/dashboard/attendees" },
  { icon: History, label: "Audit Trail", href: "/dashboard/audit" },
  { icon: Zap, label: "Integrations", href: "/dashboard/integrations" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={cn(
      "h-screen fixed left-0 top-0 sidebar-glass flex flex-col z-[100] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] border-r border-white/5",
      isCollapsed ? "w-[80px]" : "w-64"
    )}>
      {/* Header & Toggle */}
      <div className={cn(
        "p-6 flex items-center justify-between",
        isCollapsed ? "flex-col gap-6" : "flex-row"
      )}>
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-lime rounded-2xl flex items-center justify-center border-glow group-hover:scale-110 transition-all duration-500 shadow-[0_0_20px_rgba(193,217,73,0.3)]">
            <span className="text-olive-dark font-black text-xl leading-none">E</span>
          </div>
          {!isCollapsed && (
            <span className="font-heading font-black text-2xl tracking-tighter text-white transition-all duration-500">
              Eventic
            </span>
          )}
        </Link>
        
        <button 
          onClick={onToggle}
          className="p-2 rounded-xl bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all border border-white/5"
        >
          {isCollapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative",
                isActive 
                  ? "bg-lime/10 text-lime border-white/5" 
                  : "text-white/40 hover:text-white hover:bg-white/5"
              )}
            >
              {isActive && (
                <div className="absolute left-0 w-1 h-6 bg-lime rounded-r-full shadow-[4px_0_15px_rgba(193,217,73,0.5)]" />
              )}
              <item.icon className={cn(
                "w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110",
                isActive ? "text-lime" : "text-white/40 group-hover:text-white"
              )} />
              {!isCollapsed && (
                <span className="font-bold text-[13px] uppercase tracking-widest leading-none">
                  {item.label}
                </span>
              )}
              
              {/* Tooltip for collapsed mode */}
              {isCollapsed && (
                <div className="absolute left-full ml-4 px-3 py-2 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 translate-x-[-10px] group-hover:translate-x-0 shadow-2xl z-[110] whitespace-nowrap">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 mt-auto border-t border-white/5 space-y-4">
        <Link 
          href="/dashboard/events/new"
          className={cn(
            "flex items-center justify-center gap-3 w-full bg-lime text-olive-dark rounded-2xl font-black uppercase tracking-widest transition-all duration-300 border-glow shadow-[0_10px_20px_rgba(193,217,73,0.2)] hover:shadow-[0_15px_30px_rgba(193,217,73,0.4)] hover:scale-[1.02]",
            isCollapsed ? "p-3.5" : "py-4 px-2 text-[11px]"
          )}
        >
          <PlusCircle className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span>Create Event</span>}
        </Link>
        
        <div className={cn(
          "flex items-center gap-3 p-3 rounded-2xl glass-panel border border-white/10 transition-all duration-500",
          isCollapsed ? "justify-center" : "justify-start"
        )}>
          <div className="shrink-0 scale-110">
            <UserButton afterSignOutUrl="/" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-black uppercase tracking-widest truncate text-white leading-tight">Organizer</span>
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-tighter truncate">Premium Hub</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
