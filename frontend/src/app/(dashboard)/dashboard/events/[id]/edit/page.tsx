"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { fetchEvent, updateEvent, publishEvent, deleteEvent, uploadFile, API_BASE_URL } from "@/lib/api";
import { Event } from "@/lib/types";
import { ArrowLeft, CheckCircle2, Clock, Image as ImageIcon, Send, MapPin, Upload, Loader2 } from "lucide-react";
import Link from "next/link";

import AddressAutocomplete from "@/components/AddressAutocomplete";
import dynamic from "next/dynamic";

const MapDisplay = dynamic(() => import("@/components/MapDisplay"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-white/5 animate-pulse flex items-center justify-center border border-white/10 rounded-xl">
      <MapPin className="w-8 h-8 text-white/20" />
    </div>
  ),
});

export default function EventEditor({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { getToken } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState<Partial<Event>>({});

  // Status states
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Track if changes were made since last save
  const isDirty = useRef(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const token = await getToken();
      if (!token) throw new Error("No token");

      const { url } = await uploadFile(token, file);
      setFormData(prev => ({ ...prev, image_url: url }));
      isDirty.current = true;
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Fetch initial data
  useEffect(() => {
    async function loadEvent() {
      try {
        const token = await getToken();
        if (!token) return;
        const data = await fetchEvent(token, params.id);

        // Format date for the datetime-local input (YYYY-MM-DDThh:mm)
        if (data.date_time) {
          const d = new Date(data.date_time);
          data.date_time = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
        }

        setEvent(data);
        setFormData(data);
      } catch (err) {
        console.error("Failed to load event:", err);
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [params.id, getToken]);

  // 30s Autosave Logic
  useEffect(() => {
    const saveDraft = async () => {
      if (!isDirty.current) return;

      try {
        setIsSaving(true);
        const token = await getToken();
        if (!token) return;

        // Convert local datetime back to ISO before sending
        const payloadToSave = { ...formData };
        if (payloadToSave.date_time) {
          payloadToSave.date_time = new Date(payloadToSave.date_time).toISOString();
        }

        // Clean up readonly fields
        delete payloadToSave._id;
        delete payloadToSave.id;
        delete payloadToSave.organizer_id;
        delete payloadToSave.created_at;
        delete payloadToSave.updated_at;
        delete payloadToSave.slug;

        await updateEvent(token, params.id, payloadToSave);

        setLastSaved(new Date());
        isDirty.current = false;
      } catch (err) {
        console.error("Autosave failed:", err);
      } finally {
        setIsSaving(false);
      }
    };

    const intervalId = setInterval(saveDraft, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [formData, params.id, getToken]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
    isDirty.current = true;
  };

  const handlePublish = async () => {
    try {
      setIsPublishing(true);
      const token = await getToken();
      if (!token) throw new Error("No token");

      // Force a final save before publish
      const payloadToSave = { ...formData };
      if (payloadToSave.date_time) {
        payloadToSave.date_time = new Date(payloadToSave.date_time).toISOString();
      }
      delete payloadToSave._id;
      delete payloadToSave.id;
      delete payloadToSave.organizer_id;
      delete payloadToSave.created_at;
      delete payloadToSave.updated_at;
      delete payloadToSave.slug;

      await updateEvent(token, params.id, payloadToSave);
      await publishEvent(token, params.id);

      router.push("/dashboard");
    } catch (error) {
      console.error("Publish failed:", error);
      alert("Failed to publish event. Ensure all fields are filled correctly.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this event? This will also remove all attendee records and cannot be undone.")) return;

    try {
      setIsDeleting(true);
      const token = await getToken();
      if (!token) throw new Error("Authentication failed");

      await deleteEvent(token, params.id);
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Delete failed:", err);
      alert(err.message || "Failed to delete event. Please ensure you have permission.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="w-8 h-8 border-4 border-lime border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!event) {
    return <div className="text-white">Event not found.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto pb-20">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div>
            <h1 className="text-3xl font-heading font-bold text-white flex items-center gap-3">
              {formData.title || "Untitled Event"}
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/10 text-white/70 uppercase tracking-widest border border-white/10">
                {event.status}
              </span>
            </h1>
          </div>
        </div>

        {/* Action Panel */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm">
            {isSaving ? (
              <span className="text-lime flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-lime border-t-transparent rounded-full animate-spin" />
                Saving...
              </span>
            ) : lastSaved ? (
              <span className="text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Saved at {lastSaved.toLocaleTimeString()}
              </span>
            ) : (
              <span className="text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Draft automatically saves
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2.5 border border-red-500/50 text-red-400 font-bold rounded-xl hover:bg-red-500/10 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isDeleting ? "Deleting..." : "Delete Event"}
            </button>
            <button
              onClick={handlePublish}
              disabled={isPublishing || event.status === "published"}
              className="px-6 py-2.5 bg-lime text-[#1a1e0a] font-bold rounded-xl hover:bg-lime/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {isPublishing ? "Publishing..." : event.status === "published" ? "Published" : "Publish Event"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Main Form Column ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Basic Info */}
          <div className="glass-panel rounded-2xl p-6 md:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-heading font-bold text-white mb-1">Basic Information</h2>
              <p className="text-sm text-muted-foreground mb-6">The core details displayed on your event page.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">Event Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title || ""}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lime/50 focus:ring-1 focus:ring-lime/50 transition-all placeholder:text-white/20"
                  placeholder="e.g. Next.js Architecture Workshop"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description || ""}
                  onChange={handleChange}
                  rows={5}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lime/50 focus:ring-1 focus:ring-lime/50 transition-all placeholder:text-white/20 resize-y"
                  placeholder="Describe your event..."
                />
              </div>
            </div>
          </div>

          {/* Media */}
          <div className="glass-panel rounded-2xl p-6 md:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-heading font-bold text-white mb-1">Cover Image</h2>
              <p className="text-sm text-muted-foreground mb-6">Upload a high-quality image for the event banner.</p>
            </div>

            <div className="space-y-4">
              <div 
                className={cn(
                  "relative group cursor-pointer border-2 border-dashed rounded-2xl transition-all duration-300 min-h-[200px] flex flex-col items-center justify-center p-8",
                  isUploading ? "border-lime/50 bg-lime/5" : "border-white/10 hover:border-lime/30 hover:bg-white/[0.02]"
                )}
                onClick={() => document.getElementById('cover-upload')?.click()}
              >
                <input
                  id="cover-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                
                {isUploading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-lime animate-spin" />
                    <p className="text-sm font-bold text-lime animate-pulse">Uploading asset...</p>
                  </div>
                ) : formData.image_url ? (
                  <div className="absolute inset-0 rounded-2xl overflow-hidden group">
                    <img 
                      src={formData.image_url.startsWith('http') ? formData.image_url : `${API_BASE_URL}${formData.image_url}`} 
                      alt="Cover Preview" 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
                      <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                        <Upload className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-sm font-bold text-white">Click to Replace Image</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                      <ImageIcon className="w-8 h-8 text-white/40 group-hover:text-lime transition-colors" />
                    </div>
                    <div className="text-center">
                      <p className="text-base font-bold text-white mb-1">Click to upload cover</p>
                      <p className="text-sm text-muted-foreground">PNG, JPG or WebP (max 5MB)</p>
                    </div>
                  </div>
                )}
              </div>

              {formData.image_url && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ImageIcon className="w-3 h-3" />
                  <span className="truncate max-w-md">Asset Location: {formData.image_url}</span>
                </div>
              )}
            </div>
          </div>

          {/* Logistics */}
          <div className="glass-panel rounded-2xl p-6 md:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-heading font-bold text-white mb-1">Logistics</h2>
              <p className="text-sm text-muted-foreground mb-6">When, where, and how people can attend.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">Date & Time</label>
                <input
                  type="datetime-local"
                  name="date_time"
                  value={formData.date_time || ""}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lime/50 focus:ring-1 focus:ring-lime/50 transition-all [color-scheme:dark]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">Capacity</label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity || ""}
                  onChange={handleChange}
                  min={1}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lime/50 focus:ring-1 focus:ring-lime/50 transition-all placeholder:text-white/20"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">Mode</label>
                <select
                  name="mode"
                  value={formData.mode || "online"}
                  onChange={handleChange}
                  className="w-full bg-[#1a1e0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lime/50 focus:ring-1 focus:ring-lime/50 transition-all"
                >
                  <option value="online">Online</option>
                  <option value="offline">In-Person</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">Venue / Link</label>
                {formData.mode === 'online' ? (
                  <input
                    type="text"
                    name="venue"
                    value={formData.venue || ""}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lime/50 focus:ring-1 focus:ring-lime/50 transition-all placeholder:text-white/20"
                    placeholder="Zoom Link"
                  />
                ) : (
                  <div className="space-y-4">
                    <AddressAutocomplete
                      value={formData.venue || ""}
                      onChange={(addr, lat, lng) => {
                        setFormData(prev => ({
                          ...prev,
                          venue: addr,
                          location_lat: lat,
                          location_lng: lng
                        }));
                        isDirty.current = true;
                      }}
                      placeholder="Physical Address (e.g. RCCIIT, Kolkata)"
                    />

                    {formData.location_lat && formData.location_lng && (
                      <div className="h-48 rounded-xl overflow-hidden border border-white/10 group relative">
                        <div className="absolute top-3 right-3 z-10">
                          <div className="px-2 py-1 bg-lime text-[#1a1e0a] text-[10px] font-bold rounded-md shadow-lg flex items-center gap-1.5">
                            <MapPin className="w-3 h-3" /> Exact Coordinates Locked
                          </div>
                        </div>
                        <MapDisplay
                          lat={formData.location_lat}
                          lng={formData.location_lng}
                          venueName={formData.venue}
                          onLocationSelect={(lat, lng) => {
                            setFormData(prev => ({
                              ...prev,
                              location_lat: lat,
                              location_lng: lng
                            }));
                            isDirty.current = true;
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-white/80 mb-2">Registration Mode</label>
                <select
                  name="registration_mode"
                  value={formData.registration_mode || "open"}
                  onChange={handleChange}
                  className="w-full bg-[#1a1e0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lime/50 focus:ring-1 focus:ring-lime/50 transition-all"
                >
                  <option value="open">Open (Auto-approve)</option>
                  <option value="shortlisted">Shortlisted (Require manual approval)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ── Settings Sidebar ── */}
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="font-heading font-bold text-white mb-4">Event Status</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/60">Current Status</span>
                <span className={cn(
                  "px-2 py-0.5 rounded-md font-bold uppercase tracking-wider text-[10px]",
                  event.status === 'published' ? "bg-lime/20 text-lime" : "bg-white/10 text-white"
                )}>
                  {event.status}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/60">Template Used</span>
                <span className="text-white font-medium capitalize">
                  {event.template_used || "None"}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/60">Registrations</span>
                <span className="text-white font-medium">0 / {formData.capacity || 0}</span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-xs text-white/40 leading-relaxed">
                Changes are automatically saved every 30 seconds as a draft. You must click Publish to make this event live to the public.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// Utility to merge classes safely
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
