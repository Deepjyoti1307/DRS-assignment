"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  Mail,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  RefreshCw,
  History,
  Calendar,
  ExternalLink,
  RotateCcw
} from "lucide-react";
import { format } from "date-fns";
import {
  fetchRegistrations,
  shortlistRegistration,
  approveRegistration,
  rejectRegistration,
  revokeRegistration,
  checkInRegistration,
  fetchEvent,
  fetchSettings
} from "@/lib/api";
import type { Registration, Event, RSVPStatus } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function EventAttendeesPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { getToken } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<RSVPStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAttendee, setSelectedAttendee] = useState<Registration | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [hasHubspot, setHasHubspot] = useState(false);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const pageSize = 25;

  useEffect(() => {
    setPage(0);
  }, [id, filterStatus]);

  useEffect(() => {
    loadData();
  }, [id, filterStatus, page]);

  async function loadData() {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;

      const [eventData, attendeeData, settings] = await Promise.all([
        fetchEvent(token, id),
        fetchRegistrations(
          token,
          id,
          filterStatus === "all" ? undefined : filterStatus,
          pageSize,
          page * pageSize
        ),
        fetchSettings(token)
      ]);

      setEvent(eventData);
      setAttendees(attendeeData);
      setHasNext(attendeeData.length === pageSize);
      setHasHubspot(settings.has_hubspot_key);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load attendees");
    } finally {
      setLoading(false);
    }
  }

  const handleStatusUpdate = async (
    attendeeId: string,
    action: 'shortlist' | 'approve' | 'reject' | 'revoke' | 'check-in'
  ) => {
    try {
      setActionLoading(attendeeId);
      const token = await getToken();
      if (!token) return;

      if (action === 'shortlist') await shortlistRegistration(token, attendeeId);
      else if (action === 'approve') await approveRegistration(token, attendeeId);
      else if (action === 'reject') await rejectRegistration(token, attendeeId);
      else if (action === 'revoke') await revokeRegistration(token, attendeeId);
      else if (action === 'check-in') await checkInRegistration(token, attendeeId);

      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredAttendees = attendees.filter(a => {
    const name = a.attendee_name?.toLowerCase() || "";
    const email = a.attendee_email?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  const getStatusColor = (status: RSVPStatus) => {
    switch (status) {
      case "approved":
      case "registered":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "shortlisted":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "rejected":
      case "revoked":
        return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      case "pending":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      default:
        return "bg-white/10 text-white/60 border-white/10";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-6">
          <button
            onClick={() => router.back()}
            className="w-12 h-12 rounded-2xl glass-panel flex items-center justify-center hover:bg-white/10 transition-all border border-white/5"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <p className="text-xs text-lime font-semibold uppercase tracking-widest mb-1">
              {event?.title || "Event Records"}
            </p>
            <h1 className="text-4xl font-heading font-bold text-white mb-1">
              Attendee List
            </h1>
            <p className="text-muted-foreground text-sm">
              Manage specific entry permits and track registration lifecycle.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 pt-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-lime transition-colors" />
            <input
              type="text"
              placeholder="Search guests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lime/50 focus:border-lime/50 transition-all w-64"
            />
          </div>
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl glass-panel text-muted-foreground hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Registered", value: attendees.length, icon: Users, color: "text-white" },
          { label: "Pending", value: attendees.filter(a => a.status === 'pending').length, icon: Clock, color: "text-amber-400" },
          { label: "Shortlisted", value: attendees.filter(a => a.status === 'shortlisted').length, icon: Filter, color: "text-blue-400" },
          { label: "Approved", value: attendees.filter(a => ['approved', 'registered'].includes(a.status)).length, icon: CheckCircle2, color: "text-emerald-400" },
        ].map((stat, i) => (
          <div key={i} className="glass-panel rounded-2xl p-5 border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
              <stat.icon className="w-4 h-4 text-white/10" />
            </div>
            <p className={`text-2xl font-heading font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-white/40 mr-2" />
        {[
          { id: "all", label: "All" },
          { id: "pending", label: "Pending" },
          { id: "shortlisted", label: "Shortlisted" },
          { id: "approved", label: "Approved" },
          { id: "rejected", label: "Rejected" },
          { id: "registered", label: "Registered" },
          { id: "revoked", label: "Revoked" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterStatus(f.id as any)}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${filterStatus === f.id
              ? "bg-lime text-[#1a1e0a]"
              : "text-muted-foreground hover:text-white hover:bg-white/5"
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          onClick={() => setPage(p => Math.max(p - 1, 0))}
          disabled={page === 0}
          className="px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40"
        >
          Prev
        </button>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Page {page + 1}
        </span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={!hasNext}
          className="px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40"
        >
          Next
        </button>
      </div>

      {/* Content Table */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
        {loading && !attendees.length ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="w-10 h-10 animate-spin text-lime mb-4" />
            <p className="text-muted-foreground font-medium animate-pulse tracking-widest text-[10px] uppercase">Retrieving Guest Data...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-32">
            <AlertCircle className="w-10 h-10 text-rose-500 mb-4" />
            <p className="text-rose-500 font-bold mb-6">{error}</p>
            <button onClick={loadData} className="px-8 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all">Retry Synchronization</button>
          </div>
        ) : filteredAttendees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/10">
              <Users className="w-8 h-8 text-white/10" />
            </div>
            <p className="text-muted-foreground font-medium uppercase tracking-widest text-[10px]">No records found for this event.</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-white/[0.02] text-[10px] uppercase tracking-widest text-muted-foreground font-black border-b border-white/5">
                  <th className="px-8 py-6">Attendee Identity</th>
                  <th className="px-8 py-6">Contact info</th>
                  <th className="px-8 py-6">RSVP Status</th>
                  {hasHubspot && <th className="px-8 py-6">HubSpot Sync</th>}
                  <th className="px-8 py-6">Timestamp</th>
                  <th className="px-8 py-6 text-right">Directives</th>
                </tr>
              </thead>
            <tbody className="divide-y divide-white/5">
              {filteredAttendees.map((attendee) => (
                <tr key={attendee.id} className="group hover:bg-white/[0.01] transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-lime/10 flex items-center justify-center text-sm font-black text-lime border border-lime/20">
                        {attendee.attendee_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="font-bold text-white group-hover:text-lime transition-colors">{attendee.attendee_name}</div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1 font-mono text-[10px] uppercase tracking-wider">
                      <div className="flex items-center gap-2 text-white/60">
                        <Mail className="w-3 h-3 text-lime/40" /> {attendee.attendee_email}
                      </div>
                      {attendee.attendee_phone && (
                        <div className="flex items-center gap-2 text-white/40">
                          <Users className="w-3 h-3 text-lime/20" /> {attendee.attendee_phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${getStatusColor(attendee.status)}`}>
                      {attendee.status}
                    </span>
                  </td>
                  {hasHubspot && (
                    <td className="px-8 py-6">
                      <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${attendee.sync_status === 'synced' ? 'text-emerald-400' :
                        attendee.sync_status === 'failed' ? 'text-rose-400' : 'text-amber-400'
                        }`} title={attendee.sync_status === 'failed' ? attendee.sync_error_message || 'Sync failed' : undefined}>
                        <div className={`w-1.5 h-1.5 rounded-full ${attendee.sync_status === 'synced' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' :
                          attendee.sync_status === 'failed' ? 'bg-rose-400' : 'bg-amber-400 animate-pulse'
                          }`} />
                        <span>{attendee.sync_status}</span>
                        {attendee.hubspot_last_synced_at && (
                          <span className="text-[9px] text-white/40 normal-case tracking-normal">
                            ({format(new Date(attendee.hubspot_last_synced_at), "dd MMM HH:mm")})
                          </span>
                        )}
                      </div>
                    </td>
                  )}
                  <td className="px-8 py-6 text-xs text-muted-foreground font-mono">
                    {format(new Date(attendee.created_at), "dd MMM, HH:mm")}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setSelectedAttendee(attendee); setShowHistory(true); }}
                        className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all flex items-center gap-2"
                        title="Audit Log"
                      >
                        <History className="w-4 h-4" />
                        <span className="text-[9px] font-black uppercase tracking-widest hidden xl:inline">Logs</span>
                      </button>

                      {/* PENDING / SHORTLISTED: Approve or Reject */}
                      {(attendee.status === "pending" || attendee.status === "shortlisted") && (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleStatusUpdate(attendee.id || attendee._id!, 'approve')}
                            disabled={actionLoading === (attendee.id || attendee._id)}
                            className="px-6 py-2.5 bg-emerald-500 text-white rounded-full text-[10px] font-black uppercase tracking-[0.15em] hover:bg-emerald-400 hover:scale-105 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-emerald-400/30 flex items-center gap-2 disabled:opacity-50"
                          >
                            {actionLoading === (attendee.id || attendee._id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            Approve
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(attendee.id || attendee._id!, 'reject')}
                            disabled={actionLoading === (attendee.id || attendee._id)}
                            className="px-6 py-2.5 bg-rose-500 text-white rounded-full text-[10px] font-black uppercase tracking-[0.15em] hover:bg-rose-400 hover:scale-105 transition-all shadow-[0_0_20px_rgba(244,63,94,0.3)] border border-rose-400/30 flex items-center gap-2 disabled:opacity-50"
                          >
                            {actionLoading === (attendee.id || attendee._id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                            Reject
                          </button>
                        </div>
                      )}

                      {/* APPROVED / REGISTERED: Check-in, Shortlist, or Revoke */}
                      {(attendee.status === "approved" || attendee.status === "registered") && (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleStatusUpdate(attendee.id || attendee._id!, 'check-in')}
                            disabled={actionLoading === (attendee.id || attendee._id)}
                            className="px-6 py-2.5 bg-lime text-[#1a1e0a] rounded-full text-[10px] font-black uppercase tracking-[0.15em] hover:bg-white hover:scale-105 transition-all shadow-[0_0_20px_rgba(193,217,73,0.3)] border border-lime/30 flex items-center gap-2 disabled:opacity-50"
                          >
                            {actionLoading === (attendee.id || attendee._id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            Check-in
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(attendee.id || attendee._id!, 'shortlist')}
                            disabled={actionLoading === (attendee.id || attendee._id)}
                            className="px-6 py-2.5 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-[0.15em] hover:bg-blue-400 hover:scale-105 transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] border border-blue-400/30 flex items-center gap-2 disabled:opacity-50"
                          >
                            {actionLoading === (attendee.id || attendee._id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Filter className="w-3.5 h-3.5" />}
                            Shortlist
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(attendee.id || attendee._id!, 'revoke')}
                            disabled={actionLoading === (attendee.id || attendee._id)}
                            className="px-6 py-2.5 bg-rose-600 text-white rounded-full text-[10px] font-black uppercase tracking-[0.15em] hover:bg-rose-400 hover:scale-105 transition-all shadow-[0_0_20px_rgba(225,29,72,0.4)] border border-rose-400/30 flex items-center gap-2 disabled:opacity-50"
                          >
                            {actionLoading === (attendee.id || attendee._id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                            Revoke
                          </button>
                        </div>
                      )}

                      {/* REJECTED / REVOKED: Reconsider (Back to Shortlist) */}
                      {(attendee.status === "rejected" || attendee.status === "revoked") && (
                        <button
                          onClick={() => handleStatusUpdate(attendee.id || attendee._id!, 'shortlist')}
                          disabled={actionLoading === (attendee.id || attendee._id)}
                          className="px-8 py-2.5 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-[0.15em] hover:bg-blue-400 hover:scale-105 transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] border border-blue-400/30 flex items-center gap-2 disabled:opacity-50"
                        >
                          {actionLoading === (attendee.id || attendee._id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                          Reconsider
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* History Side Panel */}
      <AnimatePresence>
        {showHistory && selectedAttendee && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[200]"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-[#0f1108] border-l border-white/10 z-[210] p-10 overflow-y-auto shadow-[ -20px_0_50px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center justify-between mb-12">
                <h2 className="text-2xl font-heading font-bold text-white tracking-tight flex items-center gap-3">
                  <History className="w-6 h-6 text-lime" />
                  Audit Trail
                </h2>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-3 hover:bg-white/5 rounded-xl text-muted-foreground hover:text-white transition-all"
                >
                  <ArrowLeft className="w-5 h-5 rotate-180" />
                </button>
              </div>

              <div className="mb-10 p-6 glass-panel rounded-2xl border-lime/10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-lime flex items-center justify-center text-xl font-black text-olive-dark">
                    {selectedAttendee.attendee_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white">{selectedAttendee.attendee_name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{selectedAttendee.attendee_email}</div>
                  </div>
                </div>
              </div>

              {/* Internal Notes */}
              <div className="mb-10">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                  <Search className="w-3 h-3 text-lime" /> Internal Notes
                </h3>
                <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl text-sm text-white/50 italic font-mono leading-relaxed">
                  {selectedAttendee.notes || "No internal notes available for this attendee."}
                </div>
              </div>

              <div className="relative pl-8 space-y-10 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-[1px] before:bg-white/10">
                {selectedAttendee.status_history?.map((entry, idx) => (
                  <div key={idx} className="relative">
                    <div className={`absolute -left-[41px] top-1.5 w-[14px] h-[14px] rounded-full ring-8 ring-[#0f1108] border-2 ${idx === selectedAttendee.status_history.length - 1
                      ? "bg-lime border-lime shadow-[0_0_15px_rgba(193,217,73,0.5)]"
                      : "bg-white/5 border-white/10"
                      }`} />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {entry.from_status && (
                          <>
                            <span className="text-[10px] text-muted-foreground line-through opacity-50 uppercase tracking-tighter">{entry.from_status}</span>
                            <span className="text-[8px] text-lime">→</span>
                          </>
                        )}
                        <p className="text-sm font-bold text-white uppercase tracking-widest">
                          {entry.to_status || entry.status}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          {format(new Date(entry.changed_at), "dd MMM, HH:mm:ss")}
                        </div>
                        <div className="flex items-center gap-1.5 text-lime/40">
                          <Users className="w-3 h-3" />
                          By: {entry.changed_by === 'attendee' ? 'System (Auto)' : 'Organizer'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
