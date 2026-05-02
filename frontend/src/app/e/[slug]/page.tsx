"use client";

import React, { useEffect, useState } from "react";
import { fetchPublicEvent, PublicEventResponse, registerForEvent, API_BASE_URL } from "@/lib/api";
import { Calendar, MapPin, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
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
  const offsetMinutes = -eventDate.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absOffset = Math.abs(offsetMinutes);
  const offsetHours = String(Math.floor(absOffset / 60)).padStart(2, "0");
  const offsetMins = String(absOffset % 60).padStart(2, "0");
  const utcOffset = `UTC${sign}${offsetHours}:${offsetMins}`;

  const isRegistrationOpen = availability.state === "open";
  const requiresPhone = availability.requires_phone === true;
  const statusColors = {
    open: "text-lime bg-lime/10 border-lime/20",
    full: "text-orange-400 bg-orange-400/10 border-orange-400/20",
    closed: "text-white/40 bg-white/5 border-white/10",
    cancelled: "text-red-400 bg-red-400/10 border-red-400/20",
  };

  const rawSchedule = (event as any).schedule || (event as any).custom_fields?.schedule || [];
  const normalizedSchedule = Array.isArray(rawSchedule)
    ? rawSchedule.filter((item) => String(item?.title || "").trim().length > 0)
    : [];
  const scheduleItems: Array<{ time?: string; title: string; description?: string }> = normalizedSchedule.length > 0
    ? normalizedSchedule
    : [
      {
        time: eventDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        title: "Event begins",
        description: "Full agenda will be shared closer to the event date.",
      },
    ];

  return (
    <div className="min-h-screen bg-[#0f1105] text-white selection:bg-lime selection:text-[#0f1105] relative overflow-hidden">
      <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-lime/10 blur-[120px]" />
      <div className="absolute top-40 -left-16 h-72 w-72 rounded-full bg-emerald-400/10 blur-[140px]" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-lime/5 blur-[160px]" />

      {event.image_url && (
        <div className="absolute top-0 left-0 w-full h-[700px] pointer-events-none z-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.image_url.startsWith("http") ? event.image_url : `${API_BASE_URL}${event.image_url}`}
            alt=""
            className="w-full h-full object-cover opacity-[0.2] blur-[110px] scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0f1105]/70 to-[#0f1105]"></div>
        </div>
      )}

      <nav className="border-b border-white/5 relative z-10">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center">
          <Link href="/" className="font-heading font-bold text-xl flex items-center gap-2 text-lime">
            Eventic
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12 md:py-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-10 mb-16">
          <div className="glass-panel rounded-3xl p-8 md:p-10 border border-white/10 bg-white/[0.04] shadow-2xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border ${statusColors[availability.state]}`}>
                {availability.state === "open" ? "REGISTRATION OPEN" : availability.state.toUpperCase()}
              </span>
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
                ID: {(event._id || event.id || "").slice(-6)}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-heading font-bold leading-tight text-white mt-6">
              {event.title}
            </h1>
            <p className="text-base md:text-lg text-white/60 leading-relaxed max-w-2xl mt-4">
              {event.description}
            </p>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-lime/30 hover:bg-white/10">
                <div className="flex items-start gap-4">
                  <Calendar className="w-6 h-6 text-lime mt-1" />
                  <div>
                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Date & Time</p>
                    <p className="font-semibold text-white mt-2">
                      {eventDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </p>
                    <p className="text-sm text-white/60 mt-1">
                      {eventDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} — {event.mode === "online" ? "Online" : "Local Time"}
                    </p>
                    <p className="text-xs text-white/40 mt-1">Timezone offset: {utcOffset}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-lime/30 hover:bg-white/10">
                <div className="flex items-start gap-4">
                  <MapPin className="w-6 h-6 text-lime mt-1" />
                  <div>
                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Venue</p>
                    <p className="font-semibold text-white mt-2">
                      {event.mode === "online" ? "Virtual Event" : event.venue.split(",")[0]}
                    </p>
                    <p className="text-sm text-white/60 mt-1">
                      {event.mode === "online" ? event.venue : event.venue.split(",").slice(1).join(",")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-panel rounded-3xl p-8 border border-white/10 bg-white/[0.04] shadow-2xl relative overflow-hidden">
              <div className="absolute -top-8 -right-6 h-24 w-24 rounded-full bg-lime/15 blur-2xl" />
              <div className="flex items-end justify-between mb-6">
                <div>
                  <h2 className="text-lg font-heading font-bold text-white mb-1">Register</h2>
                  <p className="text-xs text-white/60">Secure your position today.</p>
                </div>
                <div className="text-right">
                  <span className="text-lime font-bold block text-lg">{availability.remaining}</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Spots Remaining</span>
                </div>
              </div>

              {regStatus === "success" ? (
                <div className="py-10 flex flex-col items-center text-center">
                  <CheckCircle2 className="w-16 h-16 text-lime mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Registration Complete!</h3>
                  <p className="text-sm text-white/60">{regMsg}</p>
                </div>
              ) : !isRegistrationOpen ? (
                <div className="py-10 flex flex-col items-center text-center bg-white/5 rounded-2xl border border-white/10">
                  <AlertCircle className="w-12 h-12 text-white/20 mb-4" />
                  <h3 className="text-lg font-bold text-white mb-2">
                    {availability.state === "full" ? "Event is Full" : "Registration Closed"}
                  </h3>
                  <p className="text-sm text-white/60">
                    Unfortunately, we are not accepting new registrations at this time.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
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
                      onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
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
                      onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
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
                    className="w-full py-3.5 bg-lime text-[#0f1105] font-bold rounded-xl hover:bg-lime/90 transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
                  >
                    {regStatus === "loading" ? "Processing..." : "Complete Registration"}
                  </button>

                  <p className="text-[10px] text-center text-white/40 mt-4">
                    By registering, you agree to our <a href="#" className="underline hover:text-white">Terms</a> and <a href="#" className="underline hover:text-white">Privacy Policy</a>.
                  </p>
                </form>
              )}
            </div>

            <div className="glass-panel rounded-2xl p-5 border border-white/10 flex items-center gap-4 bg-white/[0.04]">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <span className="text-lg font-bold text-white">
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

        <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-8 lg:gap-12">
          <div className="glass-panel rounded-3xl p-8 border border-white/10 bg-white/[0.04]">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-sm font-bold text-white">Event Timeline</h2>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">{scheduleItems.length} moments</span>
            </div>
            <div className="relative pl-8">
              <div className="absolute left-3 top-2 bottom-2 w-px bg-gradient-to-b from-lime/40 via-white/10 to-transparent"></div>
              <div className="space-y-6">
                {scheduleItems.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="relative flex items-start gap-5">
                    <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full border border-lime/30 bg-lime/10 text-lime">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition hover:border-lime/30 hover:bg-white/10">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                        {item.time && (
                          <span className="text-[10px] font-mono uppercase tracking-widest text-lime">{item.time}</span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-white/60 mt-1">{item.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {event.image_url ? (
            <div className="rounded-3xl overflow-hidden border border-white/10 h-[320px] lg:h-full relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={event.image_url.startsWith("http") ? event.image_url : `${API_BASE_URL}${event.image_url}`}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-[#0f1105]/80 via-transparent to-transparent" />
            </div>
          ) : (
            <div className="rounded-3xl bg-white/5 border border-white/10 h-[320px] lg:h-full flex items-center justify-center">
              <span className="text-white/20 font-heading">Eventic Platform</span>
            </div>
          )}
        </div>

        {event.mode === "offline" && event.location_lat && event.location_lng && (
          <div className="mt-20">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-xl font-heading font-bold text-lime mb-2">Find Us</h2>
                <p className="text-white/60 max-w-xl text-sm leading-relaxed">
                  Located at {event.venue}. Please arrive 15 minutes prior to the start time. Secure parking is available on-site for all registered attendees.
                </p>
              </div>
            </div>

            <div className="h-[400px] w-full rounded-3xl overflow-hidden glass-panel border border-white/10 p-2">
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
