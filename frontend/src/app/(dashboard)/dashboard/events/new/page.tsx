"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  Video,
  Wrench,
  Key,
  Plus,
  Sparkles,
  History,
  BookOpen
} from "lucide-react";
import { createEvent } from "@/lib/api";
import { cn } from "@/lib/utils";

// ─── TEMPLATES ─────────────────────────────────────────────────────────

const TEMPLATES = [
  {
    id: "webinar",
    title: "Webinar",
    badge: "VIRTUAL",
    icon: Video,
    description: "Streaming-ready setup with Q&A integration and post-event analytics.",
    payload: {
      title: "New Webinar",
      description: "Join us for an engaging online webinar.",
      mode: "online" as const,
      venue: "Zoom Link TBD",
      capacity: 500,
      registration_mode: "open" as const,
      template_used: "webinar",
    },
  },
  {
    id: "workshop",
    title: "Workshop",
    badge: "HANDS-ON",
    icon: Wrench,
    description: "Focus on collaboration with breakout rooms and resource distribution.",
    payload: {
      title: "Interactive Workshop",
      description: "A hands-on session designed to build practical skills.",
      mode: "online" as const,
      venue: "Google Meet TBD",
      capacity: 50,
      registration_mode: "open" as const,
      template_used: "workshop",
    },
  },
  {
    id: "summit",
    title: "Private Summit",
    badge: "SECURE",
    icon: Key,
    description: "Invite-only structure with advanced permission gates and NDA flows.",
    payload: {
      title: "Exclusive Private Summit",
      description: "A secure, invite-only gathering for key stakeholders.",
      mode: "offline" as const,
      venue: "Headquarters",
      capacity: 100,
      registration_mode: "shortlisted" as const,
      template_used: "summit",
    },
  },
];

export default function NewEventTemplateSelection() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleCreate = async (payload: any, templateId: string) => {
    try {
      setLoadingId(templateId);
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      // Set default date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const eventPayload = {
        ...payload,
        date_time: tomorrow.toISOString(),
      };

      const event = await createEvent(token, eventPayload);
      const eventId = event._id || event.id;
      router.push(`/dashboard/events/${eventId}/edit`);
    } catch (error) {
      console.error("Failed to create event draft:", error);
      alert("Failed to initialize event. Please try again.");
      setLoadingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      {/* ── Header ── */}
      <div>
        <h1 className="text-4xl font-heading font-bold text-white mb-2">Create Event</h1>
        <p className="text-muted-foreground text-sm">
          Accelerate your planning process or start from a blank canvas.
        </p>
      </div>

      {/* ── Template Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Render standard templates */}
        {TEMPLATES.map((tpl) => (
          <div
            key={tpl.id}
            className="glass-panel rounded-2xl p-6 flex flex-col h-full hover:border-lime/30 transition-all duration-300 relative group"
          >
            <div className="w-12 h-12 bg-lime/10 rounded-xl flex items-center justify-center mb-5 border border-lime/20 group-hover:scale-105 transition-transform">
              <tpl.icon className="w-5 h-5 text-lime" />
            </div>
            
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-lime" />
              <span className="text-[10px] font-bold tracking-widest text-lime uppercase">
                {tpl.badge}
              </span>
            </div>

            <h3 className="text-xl font-heading font-bold text-white mb-2">
              {tpl.title}
            </h3>
            
            <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-6">
              {tpl.description}
            </p>

            <button
              onClick={() => handleCreate(tpl.payload, tpl.id)}
              disabled={!!loadingId}
              className="w-full py-3 bg-lime text-[#1a1e0a] font-bold rounded-xl hover:bg-lime/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loadingId === tpl.id ? (
                <span className="animate-pulse">Initializing...</span>
              ) : (
                <>Use Template <span className="ml-2">→</span></>
              )}
            </button>
          </div>
        ))}

        {/* Blank Canvas */}
        <div className="rounded-2xl p-6 flex flex-col h-full border-2 border-dashed border-white/10 hover:border-white/30 transition-all duration-300 items-center justify-center text-center bg-white/[0.01]">
          <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center mb-6 group-hover:bg-white/10 transition-colors">
            <Plus className="w-6 h-6 text-white/70" />
          </div>
          
          <h3 className="text-xl font-heading font-bold text-white mb-2">
            Blank Canvas
          </h3>
          
          <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-[200px]">
            Start from scratch for a completely bespoke experience.
          </p>

          <button
            onClick={() =>
              handleCreate(
                {
                  title: "Untitled Event",
                  description: "",
                  mode: "online",
                  venue: "",
                  capacity: 100,
                  registration_mode: "open",
                },
                "blank"
              )
            }
            disabled={!!loadingId}
            className="text-xs font-bold tracking-widest text-white/70 hover:text-white uppercase transition-colors"
          >
            {loadingId === "blank" ? "CREATING..." : "CONFIGURE MANUALLY"}
          </button>
        </div>
      </div>

      {/* ── Recent Custom Templates ── */}
      <div className="pt-8 border-t border-white/5">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-heading font-bold text-white">
            Recent Custom Templates
          </h2>
          <button className="text-lime text-sm font-semibold hover:text-lime/80 transition-colors flex items-center gap-1">
            View All →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-panel rounded-xl p-5 flex items-center gap-4 hover:bg-white/[0.05] cursor-pointer transition-colors">
            <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-white/60" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">AI Summit 2024</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Modified 2 days ago</p>
            </div>
          </div>
          
          <div className="glass-panel rounded-xl p-5 flex items-center gap-4 hover:bg-white/[0.05] cursor-pointer transition-colors">
            <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
              <History className="w-4 h-4 text-white/60" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Internal Hackathon</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Used 1 week ago</p>
            </div>
          </div>

          <div className="glass-panel rounded-xl p-5 flex items-center gap-4 hover:bg-white/[0.05] cursor-pointer transition-colors">
            <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 text-white/60" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Monthly Board Meeting</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Last used Jan 12</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
