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
import { fetchEvents } from "@/lib/api";
import type { Event, EventStatus } from "@/lib/types";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EventCardSkeleton, StatCardSkeleton } from "@/components/dashboard/Skeletons";
import { cn } from "@/lib/utils";

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
  const color = pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-400" : "bg-lime";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{registered} registered</span>
        <span>{capacity} capacity</span>
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Event Card ───────────────────────────────────────────────────────

function EventCard({ event }: { event: Event }) {
  const date = new Date(event.date_time);
  const isPast = date < new Date();

  return (
    <div className="glass-panel rounded-2xl p-6 hover:border-white/15 transition-all duration-300 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 text-xs text-muted-foreground font-medium uppercase tracking-wider">
            <span>{event.mode === "online" ? "🌐 Online" : "📍 In-Person"}</span>
            {isPast && <span className="text-amber-400/70">· Past</span>}
          </div>
          <h3 className="font-heading font-bold text-white text-lg leading-tight truncate">
            {event.title}
          </h3>
        </div>
        <StatusBadge status={event.status} />
      </div>

      <div className="space-y-1.5 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-lime/60 shrink-0" />
          <span>
            {date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
            {" · "}
            {date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-lime/60 shrink-0" />
          <span className="truncate">{event.venue}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-lime/60 shrink-0" />
          <span>{event.registration_mode === "open" ? "Open" : "Shortlisted"} · {event.capacity} seats</span>
        </div>
      </div>

      <CapacityBar registered={0} capacity={event.capacity} />

      <div className="flex items-center gap-2 pt-1">
        <Link
          href={`/dashboard/events/${event.id}/edit`}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" /> Edit
        </Link>
        {event.status === "published" && event.slug && (
          <Link
            href={`/e/${event.slug}`}
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-lime/10 hover:bg-lime/20 text-lime transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Public Page
          </Link>
        )}
        <Link
          href={`/dashboard/events/${event.id}/attendees`}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
        >
          <Users className="w-3.5 h-3.5" /> Attendees
        </Link>
        <button
          className="ml-auto p-2 text-xs rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
          title="Duplicate event"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
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

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  const firstName = user?.firstName ?? "Organizer";

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
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
            className="p-2.5 rounded-xl glass-panel text-muted-foreground hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            href="/dashboard/events/new"
            className="flex items-center gap-2 px-5 py-3 bg-lime text-[#1a1e0a] font-bold rounded-xl hover:bg-lime/90 transition-all border-glow text-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Create Event
          </Link>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : [
              { label: "Total Events", value: totalEvents, icon: "📅", color: "text-white" },
              { label: "Published", value: published, icon: "🟢", color: "text-lime" },
              { label: "Drafts", value: drafts, icon: "✏️", color: "text-gray-400" },
              { label: "Cancelled", value: cancelled, icon: "⛔", color: "text-red-400" },
            ].map((s, i) => (
              <div key={i} className="glass-panel rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground font-medium">{s.label}</span>
                  <span className="text-lg">{s.icon}</span>
                </div>
                <p className={cn("text-4xl font-heading font-bold mb-0.5", s.color)}>{s.value}</p>
              </div>
            ))}
      </div>

      {/* ── Charts ── */}
      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="glass-panel rounded-2xl p-5 border-red-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-red-400 font-semibold text-sm">Error: {error}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Make sure the FastAPI server is running on{" "}
                <code className="text-lime bg-lime/10 px-1 rounded">localhost:8000</code>
              </p>
            </div>
          </div>
          <button
            onClick={loadEvents}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* ── Filter tabs ── */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground mr-2 font-medium">Filter:</span>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setActiveFilter(f.value)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
              activeFilter === f.value
                ? "bg-lime text-[#1a1e0a]"
                : "text-muted-foreground hover:text-white hover:bg-white/5"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Events grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <EventCardSkeleton key={i} />)}
        </div>
      ) : events.length === 0 && !error ? (
        <div className="glass-panel rounded-3xl p-16 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-lime/5 rounded-3xl flex items-center justify-center mb-6 border border-lime/10">
            <Calendar className="w-9 h-9 text-lime/40" />
          </div>
          <h3 className="text-2xl font-heading font-bold text-white mb-3">
            {activeFilter === "all" ? "No events yet" : `No ${activeFilter} events`}
          </h3>
          <p className="text-muted-foreground max-w-sm mb-8 text-sm leading-relaxed">
            {activeFilter === "all"
              ? "Your event list is empty. Create your first event and start inviting attendees."
              : `You don't have any ${activeFilter} events. Change the filter or create a new one.`}
          </p>
          <Link
            href="/dashboard/events/new"
            className="flex items-center gap-2 px-8 py-4 bg-lime text-[#1a1e0a] rounded-xl font-bold hover:bg-lime/90 transition-all border-glow"
          >
            <PlusCircle className="w-5 h-5" />
            Create Your First Event
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
