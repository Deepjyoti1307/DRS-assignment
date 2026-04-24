"use client";

import React, { useEffect, useState } from "react";
import { fetchPublicEvent, PublicEventResponse, registerForEvent } from "@/lib/api";
import { Calendar, MapPin, CheckCircle2, AlertCircle } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Footer from "@/components/landing/Footer";

// Dynamically import the map so it only runs on the client
const MapDisplay = dynamic(() => import("@/components/MapDisplay"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-white/5 animate-pulse flex items-center justify-center border border-white/10 rounded-2xl">
      <MapPin className="w-8 h-8 text-white/20" />
    </div>
  ),
});

export default function PublicEventPage({ params }: { params: { slug: string } }) {
  const [data, setData] = useState<PublicEventResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Registration Form State
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [regStatus, setRegStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [regMsg, setRegMsg] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetchPublicEvent(params.slug);
        setData(res);
      } catch (err: any) {
        setError(err.message || "Event not found");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [params.slug]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;

    setRegStatus("loading");
    try {
      await registerForEvent(data.event.id || data.event._id || "", {
        attendee_name: formData.name,
        attendee_email: formData.email,
        attendee_phone: formData.phone,
      });
      setRegStatus("success");
      setRegMsg("You have successfully registered!");
    } catch (err: any) {
      setRegStatus("error");
      setRegMsg(err.message || "Failed to register. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1105] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-lime border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0f1105] flex flex-col items-center justify-center text-white">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold font-heading mb-2">Event Not Found</h1>
        <p className="text-white/60 mb-6">{error || "This event may have been moved or deleted."}</p>
        <Link href="/" className="px-6 py-2 bg-lime text-[#0f1105] font-bold rounded-lg hover:bg-lime/90 transition-colors">
          Return Home
        </Link>
      </div>
    );
  }

  const { event, availability } = data;
  const eventDate = new Date(event.date_time);
  
  const isRegistrationOpen = availability.state === "open";
  const requiresPhone = availability.requires_phone === true;
  const statusColors = {
    open: "text-lime bg-lime/10 border-lime/20",
    full: "text-orange-400 bg-orange-400/10 border-orange-400/20",
    closed: "text-white/40 bg-white/5 border-white/10",
    cancelled: "text-red-400 bg-red-400/10 border-red-400/20",
  };

  return (
    <div className="min-h-screen bg-[#0f1105] text-white selection:bg-lime selection:text-[#0f1105]">
      {/* ── Navbar ── */}
      <nav className="border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="font-heading font-bold text-xl flex items-center gap-2 text-lime">
            Eventic
          </Link>
          <div className="flex items-center gap-8 text-sm font-semibold">
            <Link href="#" className="text-white/70 hover:text-white transition-colors">EVENTS</Link>
            <Link href="#" className="text-white/70 hover:text-white transition-colors">ABOUT</Link>
            <div className="w-px h-4 bg-white/10 mx-2"></div>
            <Link href="/dashboard" className="px-5 py-2 bg-lime text-[#0f1105] rounded-md hover:bg-lime/90 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        
        {/* ── Top Section ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border ${statusColors[availability.state]}`}>
                {availability.state === 'open' ? '• REGISTRATION OPEN' : `• ${availability.state.toUpperCase()}`}
              </span>
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
                ID: {(event._id || event.id || "").slice(-6)}
              </span>
            </div>

            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold leading-tight text-white mb-6">
                {event.title}
              </h1>
              <p className="text-lg text-white/60 leading-relaxed max-w-xl">
                {event.description}
              </p>
            </div>
          </div>

          <div className="space-y-4 lg:pl-12">
            {/* Details Cards */}
            <div className="glass-panel rounded-2xl p-6 border border-white/5 hover:border-lime/20 transition-colors">
              <div className="flex gap-4">
                <Calendar className="w-5 h-5 text-lime shrink-0 mt-1" />
                <div>
                  <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Date & Time</h3>
                  <p className="font-semibold text-white">
                    {eventDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </p>
                  <p className="text-sm text-white/60 mt-1">
                    {eventDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} — {event.mode === 'online' ? 'Online' : 'Local Time'}
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-6 border border-white/5 hover:border-lime/20 transition-colors">
              <div className="flex gap-4">
                <MapPin className="w-5 h-5 text-lime shrink-0 mt-1" />
                <div>
                  <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Venue</h3>
                  <p className="font-semibold text-white">
                    {event.mode === 'online' ? "Virtual Event" : event.venue.split(',')[0]}
                  </p>
                  <p className="text-sm text-white/60 mt-1">
                    {event.mode === 'online' ? event.venue : event.venue.split(',').slice(1).join(',')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Middle Section ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
          
          <div className="lg:col-span-7 space-y-8">
            {/* Mock Schedule matching the design */}
            <div className="glass-panel rounded-2xl p-8 border border-white/5">
              <h2 className="text-sm font-bold text-white mb-8">Event Schedule</h2>
              <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                
                <div className="relative flex items-start justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="hidden md:flex flex-1 justify-end shrink-0 text-right pr-8">
                    <span className="font-mono text-lime font-bold">09:00</span>
                  </div>
                  <div className="flex-1 pl-8 md:pl-0 md:text-left md:ml-8">
                    <h3 className="font-semibold text-white mb-1">Opening Keynote</h3>
                    <p className="text-sm text-white/60">Introduction and welcome speech.</p>
                  </div>
                </div>

                <div className="relative flex items-start justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="hidden md:flex flex-1 justify-end shrink-0 text-right pr-8">
                    <span className="font-mono text-lime font-bold">11:30</span>
                  </div>
                  <div className="flex-1 pl-8 md:pl-0 md:text-left md:ml-8">
                    <h3 className="font-semibold text-white mb-1">Main Session</h3>
                    <p className="text-sm text-white/60">Deep dive into the core topics.</p>
                  </div>
                </div>

                <div className="relative flex items-start justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="hidden md:flex flex-1 justify-end shrink-0 text-right pr-8">
                    <span className="font-mono text-lime font-bold">14:00</span>
                  </div>
                  <div className="flex-1 pl-8 md:pl-0 md:text-left md:ml-8">
                    <h3 className="font-semibold text-white mb-1">Workshop</h3>
                    <p className="text-sm text-white/60">Hands-on practical applications.</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Event Image */}
            {event.image_url ? (
              <div className="rounded-2xl overflow-hidden border border-white/5 h-[300px] relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="rounded-2xl bg-white/5 border border-white/5 h-[300px] flex items-center justify-center">
                <span className="text-white/20 font-heading">Eventic Platform</span>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 space-y-6">
            {/* Registration Box */}
            <div className="glass-panel rounded-2xl p-8 border border-white/5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-lime to-emerald-400"></div>
              
              <div className="flex items-end justify-between mb-8">
                <div>
                  <h2 className="text-lg font-heading font-bold text-white mb-1">Register</h2>
                  <p className="text-xs text-white/60">Secure your position today.</p>
                </div>
                <div className="text-right">
                  <span className="text-lime font-bold block">{availability.remaining} / {availability.capacity}</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Spots Remaining</span>
                </div>
              </div>

              {regStatus === "success" ? (
                <div className="py-12 flex flex-col items-center text-center">
                  <CheckCircle2 className="w-16 h-16 text-lime mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Registration Complete!</h3>
                  <p className="text-sm text-white/60">{regMsg}</p>
                </div>
              ) : !isRegistrationOpen ? (
                <div className="py-12 flex flex-col items-center text-center bg-white/5 rounded-xl border border-white/10">
                  <AlertCircle className="w-12 h-12 text-white/20 mb-4" />
                  <h3 className="text-lg font-bold text-white mb-2">
                    {availability.state === 'full' ? 'Event is Full' : 'Registration Closed'}
                  </h3>
                  <p className="text-sm text-white/60">
                    Unfortunately, we are not accepting new registrations at this time.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleRegister} className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                      className="w-full bg-[#1a1e0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-lime/50 transition-all placeholder:text-white/20"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">Email Address</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                      className="w-full bg-[#1a1e0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-lime/50 transition-all placeholder:text-white/20"
                      placeholder="name@company.com"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">
                      Phone Number{requiresPhone ? " (required)" : ""}
                    </label>
                    <input
                      type="tel"
                      required={requiresPhone}
                      value={formData.phone}
                      onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                      className="w-full bg-[#1a1e0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-lime/50 transition-all placeholder:text-white/20"
                      placeholder="+1 (555) 000-0000"
                    />
                    {requiresPhone && (
                      <p className="text-[10px] text-white/40 mt-2">
                        Phone is required for organizer CRM sync.
                      </p>
                    )}
                  </div>

                  {regStatus === "error" && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                      {regMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={regStatus === "loading"}
                    className="w-full py-3.5 bg-lime text-[#0f1105] font-bold rounded-xl hover:bg-lime/90 transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
                  >
                    {regStatus === "loading" ? "Processing..." : "Complete Registration"}
                  </button>
                  
                  <p className="text-[10px] text-center text-white/40 mt-4">
                    By registering, you agree to our <a href="#" className="underline hover:text-white">Terms</a> and <a href="#" className="underline hover:text-white">Privacy Policy</a>.
                  </p>
                </form>
              )}
            </div>

            {/* Hosted By */}
            <div className="glass-panel rounded-2xl p-5 border border-white/5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <span className="text-lg font-bold text-white">
                  {/* First letter of organizer ID as placeholder */}
                  {event.organizer_id.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Hosted By</p>
                <p className="font-semibold text-white">Eventic Organizer</p>
              </div>
            </div>
          </div>

        </div>

        {/* ── Map Section ── */}
        {event.mode === 'offline' && event.location_lat && event.location_lng && (
          <div className="mt-24">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-xl font-heading font-bold text-lime mb-2">Find Us</h2>
                <p className="text-white/60 max-w-xl text-sm leading-relaxed">
                  Located at {event.venue}. Please arrive 15 minutes prior to the start time. Secure parking is available on-site for all registered attendees.
                </p>
              </div>
            </div>
            
            <div className="h-[400px] w-full rounded-2xl overflow-hidden glass-panel border border-white/5 p-2">
              <MapDisplay 
                lat={event.location_lat} 
                lng={event.location_lng} 
                venueName={event.venue} 
              />
            </div>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
