"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth, useUser } from "@clerk/nextjs";
import {
  Calendar,
  MapPin,
  Users,
  ExternalLink,
  Pencil,
  Copy,
  PlusCircle,
  TrendingUp,
  RefreshCw,
  Share2,
  Check,
  Search,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { fetchEvents, duplicateEvent } from "@/lib/api";
import type { Event, EventStatus } from "@/lib/types";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EventCardSkeleton, StatCardSkeleton } from "@/components/dashboard/Skeletons";
import { cn } from "@/lib/utils";

// ─── Animation Variants ───────────────────────────────────────────────

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.23, 1, 0.32, 1]
    }
  }
};

// ─── Chart helpers ────────────────────────────────────────────────────

/** Build a 30-day registration-trend array from event created_at dates */
function buildTrendData(events: Event[]) {
  const days: Record<string, number> = {};
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    days[key] = 0;
  }
  events.forEach((e) => {
    const key = new Date(e.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    if (key in days) days[key]++;
  });
  return Object.entries(days).map(([date, count]) => ({ date, count }));
}

function buildDistributionData(events: Event[]) {
  const published = events.filter((e) => e.status === "published").length;
  const draft = events.filter((e) => e.status === "draft").length;
  const cancelled = events.filter((e) => e.status === "cancelled").length;
  return [
    { name: "Published", value: published || 0, color: "#c1d949" },
    { name: "Draft", value: draft || 0, color: "#6b7280" },
    { name: "Cancelled", value: cancelled || 0, color: "#ef4444" },
  ];
}

// ─── Custom Tooltip ───────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload?.length) {
    return (
      <div className="glass-panel rounded-xl px-3 py-2 text-xs border-white/10">
        <p className="text-muted-foreground mb-0.5">{label}</p>
        <p className="text-lime font-bold">{payload[0].value} events</p>
      </div>
    );
  }
  return null;
}

// ─── Donut label ──────────────────────────────────────────────────────

function DonutLabel({ cx, cy, total }: { cx: number; cy: number; total: number }) {
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
      <tspan x={cx} dy="-0.4em" className="fill-white" fontSize={28} fontWeight={700}>
        {total}
      </tspan>
      <tspan x={cx} dy="1.6em" fill="#9ca3af" fontSize={11}>
        TOTAL
      </tspan>
    </text>
  );
}

// ─── Capacity bar ─────────────────────────────────────────────────────

function CapacityBar({ registered, capacity }: { registered: number; capacity: number }) {
  const pct = Math.min((registered / capacity) * 100, 100);
  const color = pct >= 100 ? "bg-rose-500" : pct >= 80 ? "bg-amber-400" : "bg-lime";
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-black uppercase tracking-widest text-white/30">
          Capacity
        </span>
        <span className="text-xs font-bold text-white">
          {registered} <span className="text-white/30">/</span> {capacity}
        </span>
      </div>
      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(193,217,73,0.3)]", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Event Card ───────────────────────────────────────────────────────

function EventCard({ event, onDuplicate }: { event: Event; onDuplicate: (id: string) => void }) {
  const [copied, setCopied] = useState(false);
  const date = new Date(event.date_time);
  const isPast = date < new Date();

  const handleShare = async (slug: string) => {
    const publicUrl = `${window.location.origin}/e/${slug}`;
    let finalUrl = publicUrl;

    try {
      // Attempt to shorten with TinyURL
      const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(publicUrl)}`);
      if (response.ok) {
        finalUrl = await response.text();
      }
    } catch (err) {
      console.warn("TinyURL shortening failed, using direct link:", err);
    }

    await navigator.clipboard.writeText(finalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      variants={itemVariants}
      whileHover={{ y: -5 }}
      className="group relative glass-panel rounded-[2rem] p-7 hover:border-lime/20 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] hover:shadow-[0_40px_80px_rgba(0,0,0,0.8)] overflow-hidden"
    >
      {/* Subtle background glow on hover */}
      <div className="absolute -inset-1 bg-gradient-to-br from-lime/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-3xl -z-10" />
      
      <div className="space-y-6">
        {/* Header: Mode & Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border",
              event.mode === "online" 
                ? "bg-sky-500/10 text-sky-400 border-sky-500/20" 
                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
            )}>
              {event.mode === "online" ? "Online" : "In-Person"}
            </div>
            {isPast && (
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.15em] bg-white/5 text-white/40 border border-white/10">
                Past
              </span>
            )}
          </div>
          <StatusBadge status={event.status} />
        </div>

        {/* Title */}
        <div className="min-h-[3.5rem]">
          <h3 className="text-xl font-heading font-bold text-white leading-[1.2] group-hover:text-lime transition-colors duration-300">
            {event.title}
          </h3>
        </div>

        {/* Metadata Feed */}
        <div className="space-y-3.5">
          <div className="flex items-center gap-3 text-white/60">
            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-lime/10 transition-colors">
              <Calendar className="w-4 h-4 text-lime" />
            </div>
            <div className="text-xs font-medium">
              <span className="text-white block">
                {date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-white/30">
                {date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-white/60">
            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-lime/10 transition-colors">
              <MapPin className="w-4 h-4 text-lime" />
            </div>
            <div className="text-xs font-medium truncate">
              <span className="text-white block truncate">{event.venue}</span>
              <span className="text-[10px] uppercase tracking-wider text-white/30">Location</span>
            </div>
          </div>
        </div>

        {/* Capacity Visualization */}
        <div className="pt-2">
          <CapacityBar registered={event.registrations_count || 0} capacity={event.capacity} />
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Link
            href={`/dashboard/events/${event._id || event.id}/edit`}
            className="flex items-center justify-center gap-2 py-3 text-[11px] font-bold uppercase tracking-widest rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all border border-white/5"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </Link>
          <Link
            href={`/dashboard/events/${event._id || event.id}/attendees`}
            className="flex items-center justify-center gap-2 py-3 text-[11px] font-bold uppercase tracking-widest rounded-xl bg-lime/10 hover:bg-lime/20 text-lime transition-all border border-lime/20"
          >
            <Users className="w-3.5 h-3.5" /> Guests
          </Link>
          {event.status === "published" && event.slug ? (
            <>
              <Link
                href={`/e/${event.slug}`}
                target="_blank"
                className="flex items-center justify-center gap-2 py-3 text-[11px] font-bold uppercase tracking-widest rounded-xl bg-lime text-olive-dark hover:scale-[1.02] active:scale-[0.98] transition-all border-glow"
              >
                <ExternalLink className="w-3.5 h-3.5" /> View
              </Link>
              <button
                onClick={() => handleShare(event.slug!)}
                className="flex items-center justify-center gap-2 py-3 text-[11px] font-bold uppercase tracking-widest rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all border border-white/5 relative overflow-hidden"
              >
                {copied ? (
                  <span className="flex items-center gap-2 text-lime animate-in fade-in zoom-in duration-300">
                    <Check className="w-3.5 h-3.5" /> Copied
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Share2 className="w-3.5 h-3.5" /> Share
                  </span>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={() => onDuplicate(event._id || event.id || "")}
              className="col-span-2 flex items-center justify-center gap-2 py-3 text-[11px] font-bold uppercase tracking-widest rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all border border-dashed border-white/10"
            >
              <Copy className="w-3.5 h-3.5" /> Duplicate Draft
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Filter tabs ──────────────────────────────────────────────────────

const FILTERS: { label: string; value: EventStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Published", value: "published" },
  { label: "Draft", value: "draft" },
  { label: "Cancelled", value: "cancelled" },
];

// ─── Main page ────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { getToken } = useAuth();
  const { user } = useUser();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<EventStatus | "all">("all");

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const data = await fetchEvents(token, activeFilter === "all" ? undefined : activeFilter);
      setEvents(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [getToken, activeFilter]);

  const handleDuplicate = async (eventId: string) => {
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      await duplicateEvent(token, eventId);
      // toast.success("Event duplicated as draft!");
      loadEvents();
    } catch (err) {
      console.error(err);
      alert("Failed to duplicate event: " + (err as Error).message);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // ── Derived stats ──
  const totalEvents = events.length;
  const published = events.filter((e) => e.status === "published").length;
  const drafts = events.filter((e) => e.status === "draft").length;
  const cancelled = events.filter((e) => e.status === "cancelled").length;

  const trendData = buildTrendData(events);
  const distData = buildDistributionData(events);

  const [searchQuery, setSearchQuery] = useState("");

  const filteredEvents = events.filter(e => 
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.venue && e.venue.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  const firstName = user?.firstName ?? "Organizer";

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8"
    >
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex items-start justify-between">
        <div>
          <p className="text-xs text-lime font-semibold uppercase tracking-widest mb-1">
            Overview
          </p>
          <h1 className="text-4xl font-heading font-bold text-white mb-1">
            {greeting()}, {firstName}.
          </h1>
          <p className="text-muted-foreground text-sm">
            Your ecosystem is ready. Let&apos;s orchestrate something great.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadEvents}
            className="p-3.5 rounded-2xl glass-panel text-white/40 hover:text-white hover:border-white/20 transition-all active:scale-95"
            title="Refresh"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
          <Link
            href="/dashboard/events/new"
            className="flex items-center gap-2 px-6 py-3.5 bg-lime text-olive-dark font-black uppercase tracking-[0.1em] rounded-2xl hover:bg-white hover:text-olive-dark transition-all border-glow text-[11px] shadow-[0_10px_30px_rgba(193,217,73,0.3)]"
          >
            <PlusCircle className="w-4 h-4" />
            Create Event
          </Link>
        </div>
      </motion.div>

      {/* ── Stat cards ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : [
              { label: "Total Events", value: totalEvents, icon: <Calendar className="w-4 h-4 text-white" />, color: "from-white/10 to-transparent", textColor: "text-white" },
              { label: "Published", value: published, icon: <div className="w-2 h-2 rounded-full bg-lime animate-pulse" />, color: "from-lime/10 to-transparent", textColor: "text-lime" },
              { label: "Drafts", value: drafts, icon: <Pencil className="w-4 h-4 text-white/40" />, color: "from-white/5 to-transparent", textColor: "text-white/40" },
              { label: "Cancelled", value: cancelled, icon: <div className="w-2 h-2 rounded-full bg-rose-500" />, color: "from-rose-500/10 to-transparent", textColor: "text-rose-400" },
            ].map((s, i) => (
              <div key={i} className="group relative glass-panel rounded-3xl p-6 overflow-hidden">
                <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50 -z-10", s.color)} />
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{s.label}</span>
                  <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-sm">
                    {s.icon}
                  </div>
                </div>
                <p className={cn("text-4xl font-heading font-black tracking-tight", s.textColor)}>{s.value}</p>
              </div>
            ))}
      </motion.div>

      {/* ── Charts ── */}
      {!loading && !error && (
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Registration Trends — spans 2 cols */}
          <div className="lg:col-span-2 glass-panel rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-heading font-bold text-white text-lg">Event Creation Trends</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Daily events created — last 30 days</p>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-lime font-semibold">
                <span className="w-2 h-2 rounded-full bg-lime animate-pulse" />
                LIVE DATA
              </span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                <defs>
                  <linearGradient id="limeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c1d949" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#c1d949" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#6b7280", fontSize: 10 }}
                  interval={6}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#6b7280", fontSize: 10 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#c1d949"
                  strokeWidth={2}
                  fill="url(#limeGrad)"
                  dot={false}
                  activeDot={{ r: 5, fill: "#c1d949", strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Event Distribution donut */}
          <div className="glass-panel rounded-2xl p-6 flex flex-col">
            <div className="mb-4">
              <h2 className="font-heading font-bold text-white text-lg">Event Distribution</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Breakdown by status</p>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <PieChart width={180} height={180}>
                <Pie
                  data={distData.every((d) => d.value === 0) ? [{ name: "empty", value: 1, color: "#1f2937" }] : distData}
                  cx={90}
                  cy={90}
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {(distData.every((d) => d.value === 0)
                    ? [{ color: "#1f2937" }]
                    : distData
                  ).map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                {!distData.every((d) => d.value === 0) && (
                  // @ts-ignore — recharts customized label
                  <DonutLabel cx={90} cy={90} total={totalEvents} />
                )}
              </PieChart>
            </div>
            <div className="space-y-2 mt-4">
              {distData.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="text-muted-foreground">{d.name}</span>
                  </div>
                  <span className="font-semibold text-white">
                    {totalEvents > 0 ? `${Math.round((d.value / totalEvents) * 100)}%` : "0%"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Error ── */}
      {error && (
        <motion.div variants={itemVariants} className="glass-panel rounded-2xl p-5 border-red-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-red-400 font-semibold text-sm">Connection Failed</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {error}
              </p>
              <p className="text-[10px] text-white/20 mt-1 font-mono">
                Attempted: {process.env.NEXT_PUBLIC_API_URL || "localhost:8000"}
              </p>
            </div>
          </div>
          <button
            onClick={loadEvents}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </motion.div>
      )}

      {/* ── Filter tabs ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 bg-white/5 p-1.5 rounded-2xl w-fit border border-white/5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300",
                activeFilter === f.value
                  ? "bg-lime text-olive-dark shadow-[0_0_15px_rgba(193,217,73,0.3)]"
                  : "text-white/40 hover:text-white hover:bg-white/5"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        
        {searchQuery && (
          <p className="text-[10px] font-black uppercase tracking-widest text-white/30">
            Showing results for: <span className="text-lime">{searchQuery}</span>
          </p>
        )}
      </motion.div>

      {/* ── Events grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <EventCardSkeleton key={i} />)}
        </div>
      ) : filteredEvents.length === 0 && !error ? (
        <motion.div variants={itemVariants} className="glass-panel rounded-3xl p-16 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-lime/5 rounded-3xl flex items-center justify-center mb-6 border border-lime/10">
            <Search className="w-9 h-9 text-white/10" />
          </div>
          <h3 className="text-2xl font-heading font-bold text-white mb-3">
            {searchQuery ? "No matches found" : activeFilter === "all" ? "No events yet" : `No ${activeFilter} events`}
          </h3>
          <p className="text-muted-foreground max-w-sm mb-8 text-sm leading-relaxed">
            {searchQuery 
              ? `We couldn't find any events matching "${searchQuery}". Try a different term or clear the search.`
              : activeFilter === "all"
              ? "Your event list is empty. Create your first event and start inviting attendees."
              : `You don't have any ${activeFilter} events. Change the filter or create a new one.`}
          </p>
        {searchQuery ? (
          <button
            onClick={() => setSearchQuery("")}
            className="flex items-center gap-2 px-8 py-4 bg-white/5 text-white rounded-xl font-bold hover:bg-white/10 transition-all border border-white/10"
          >
            Clear Search
          </button>
        ) : (
          <Link
            href="/dashboard/events/new"
            className="flex items-center gap-2 px-8 py-4 bg-lime text-[#1a1e0a] rounded-xl font-bold hover:bg-lime/90 transition-all border-glow"
          >
            <PlusCircle className="w-5 h-5" />
            Create Your First Event
          </Link>
        )}
        </motion.div>
      ) : (
        <motion.div 
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
        >
          {filteredEvents.map((event) => (
            <EventCard 
              key={event._id || event.id} 
              event={event} 
              onDuplicate={handleDuplicate}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
