"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  PlusCircle,
  History,
  Layout,
  ArrowRight,
  Loader2,
  Calendar,
  Sparkles
} from "lucide-react";
import { motion } from "framer-motion";
import { fetchEvents, createEvent, fetchEvent } from "@/lib/api";
import { Event } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function NewEventPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    loadRecentEvents();
  }, []);

  async function loadRecentEvents() {
    try {
      const token = await getToken();
      if (!token) return;
      const data = await fetchEvents(token);
      // Sort by creation date descending and take top 4 for a better grid
      const sorted = [...data].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ).slice(0, 4);
      setRecentEvents(sorted);
    } catch (err) {
      console.error("Failed to load recent events:", err);
    } finally {
      setLoadingRecent(false);
    }
  }

  const handleDuplicate = async (eventId: string) => {
    try {
      setLoadingId(eventId);
      const token = await getToken();
      if (!token) return;
      
      const original = await fetchEvent(token, eventId);
      
      // Tomorrow at 10 AM default
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const cloned: Partial<Event> = {
        title: `${original.title} (Copy)`,
        description: original.description,
        venue: original.venue,
        date_time: tomorrow.toISOString(),
        capacity: original.capacity,
        mode: original.mode,
        registration_mode: original.registration_mode,
        status: 'draft',
      };
      
      const created = await createEvent(token, cloned as Event);
      router.push(`/dashboard/events/${created._id || created.id}/edit`);
    } catch (err: any) {
      alert(err.message || "Failed to duplicate event");
      setLoadingId(null);
    }
  };

  const handleCreateBlank = async () => {
    try {
      setLoadingId("blank");
      const token = await getToken();
      if (!token) return;

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const payload: Partial<Event> = {
        title: "Untitled Experience",
        description: "",
        venue: "",
        date_time: tomorrow.toISOString(),
        capacity: 100,
        mode: "offline",
        registration_mode: "open",
        status: "draft"
      };

      const created = await createEvent(token, payload as Event);
      router.push(`/dashboard/events/${created._id || created.id}/edit`);
    } catch (err: any) {
      alert(err.message || "Failed to create event");
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-12 pb-20 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-lime font-black uppercase tracking-[0.2em] text-[10px]">
          <Sparkles className="w-3 h-3" />
          Event Orchestrator
        </div>
        <h1 className="text-5xl font-heading font-bold text-white tracking-tight">
          Initiate New Experience
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
          Choose a blueprint from your history or start with a blank canvas to orchestrate your next masterpiece.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Blank Canvas Card */}
        <motion.div
          whileHover={{ y: -5 }}
          onClick={handleCreateBlank}
          className="lg:col-span-1 glass-panel rounded-[2.5rem] p-10 border border-white/5 flex flex-col justify-between group cursor-pointer relative overflow-hidden h-[450px]"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-lime/10 blur-[100px] -mr-32 -mt-32 group-hover:bg-lime/20 transition-all duration-700" />
          
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-10 border border-white/10 group-hover:border-lime/30 group-hover:bg-lime/10 transition-all duration-500">
              {loadingId === "blank" ? (
                <Loader2 className="w-7 h-7 text-lime animate-spin" />
              ) : (
                <PlusCircle className="w-7 h-7 text-white group-hover:text-lime transition-all" />
              )}
            </div>
            <h2 className="text-4xl font-heading font-bold text-white mb-6">Blank Canvas</h2>
            <p className="text-muted-foreground text-base leading-relaxed">
              Full creative sovereignty. Define every touchpoint of your event from the ground up with no constraints.
            </p>
          </div>
          
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-lime group-hover:tracking-[0.3em] transition-all">Start Drafting</span>
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-lime group-hover:text-olive-dark transition-all duration-500">
              <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </motion.div>

        {/* History / Templates Section */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-white/30 flex items-center gap-3">
              <div className="w-8 h-[1px] bg-white/10" />
              History & Recent Blueprints
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {loadingRecent ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-36 glass-panel rounded-3xl animate-pulse border border-white/5" />
              ))
            ) : recentEvents.length === 0 ? (
              <div className="col-span-2 py-20 glass-panel rounded-[2rem] flex flex-col items-center justify-center border border-dashed border-white/10 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/5">
                  <History className="w-7 h-7 text-white/10" />
                </div>
                <p className="text-white/60 font-bold mb-1">No event history found</p>
                <p className="text-muted-foreground text-xs max-w-[240px]">Your previous events will automatically appear here to be used as templates.</p>
              </div>
            ) : (
              recentEvents.map((event, idx) => (
                <motion.div
                  key={event._id || event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.02)" }}
                  onClick={() => handleDuplicate(event._id || event.id!)}
                  className="glass-panel rounded-[2rem] p-6 border border-white/5 flex flex-col justify-between cursor-pointer group transition-all duration-500 h-44 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-8 rounded-lg bg-lime flex items-center justify-center text-olive-dark">
                      <PlusCircle className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10 group-hover:border-lime/20 group-hover:bg-lime/5 transition-all">
                      {loadingId === (event._id || event.id) ? (
                        <Loader2 className="w-5 h-5 text-lime animate-spin" />
                      ) : (
                        <Layout className="w-5 h-5 text-white/30 group-hover:text-lime transition-all" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-bold text-white group-hover:text-lime transition-colors truncate pr-6">
                        {event.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="w-3 h-3 text-white/20" />
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest truncate">
                          {event.venue || "Global Event"}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-white/30 group-hover:text-white transition-colors">Clone as template</span>
                    <ArrowRight className="w-4 h-4 text-white/10 group-hover:text-lime group-hover:translate-x-1 transition-all" />
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Visual Footer ── */}
      <div className="pt-20 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/10">
          Digital Registration System • Next Generation
        </p>
      </div>
    </div>
  );
}
