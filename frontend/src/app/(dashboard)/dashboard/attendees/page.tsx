"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import {
  fetchAllRegistrations,
  approveRegistration,
  rejectRegistration,
  revokeRegistration,
  fetchSettings
} from "../../../../lib/api";
import type { Registration, RSVPStatus } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";

export default function GlobalAttendeesPage() {
  const router = useRouter();
  const { getToken } = useAuth();

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
  }, [filterStatus]);

  useEffect(() => {
    loadData();
  }, [filterStatus, page]);

  async function loadData() {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;

      const [data, settings] = await Promise.all([
        fetchAllRegistrations(
          token,
          filterStatus === "all" ? undefined : filterStatus,
          pageSize,
          page * pageSize
        ),
        fetchSettings(token)
      ]);
      setAttendees(data);
      setHasNext(data.length === pageSize);
      setHasHubspot(settings.has_hubspot_key);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load attendees");
    } finally {
      setLoading(false);
    }
  }

  const handleStatusUpdate = async (attendeeId: string, action: 'approve' | 'reject' | 'revoke') => {
    try {
      setActionLoading(attendeeId);
      const token = await getToken();
      if (!token) return;

      if (action === 'approve') await approveRegistration(token, attendeeId);
      else if (action === 'reject') await rejectRegistration(token, attendeeId);
      else if (action === 'revoke') await revokeRegistration(token, attendeeId);

      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredAttendees = attendees.filter(a =>
    a.attendee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.attendee_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: RSVPStatus) => {
    switch (status) {
      case "approved":
      case "registered":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
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
        <div>
          <p className="text-xs text-lime font-semibold uppercase tracking-widest mb-1">
            Management
          </p>
          <h1 className="text-4xl font-heading font-bold text-white mb-1">
            Attendees
          </h1>
          <p className="text-muted-foreground text-sm">
            Orchestrate your guest list across all events.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-lime transition-colors" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lime/50 focus:border-lime/50 transition-all w-72"
            />
          </div>
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl glass-panel text-muted-foreground hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total", value: attendees.length, icon: Users, color: "text-white" },
          { label: "Pending", value: attendees.filter(a => a.status === 'pending').length, icon: Clock, color: "text-amber-400" },
          { label: "Approved", value: attendees.filter(a => ['approved', 'registered'].includes(a.status)).length, icon: CheckCircle2, color: "text-emerald-400" },
          { label: "Rejected", value: attendees.filter(a => ['rejected', 'revoked'].includes(a.status)).length, icon: XCircle, color: "text-rose-400" },
        ].map((stat, i) => (
          <div key={i} className="glass-panel rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
              <stat.icon className="w-4 h-4 text-white/20" />
            </div>
            <p className={`text-3xl font-heading font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-white/40 mr-2" />
        {[
          { id: "all", label: "All" },
          { id: "pending", label: "Pending" },
          { id: "approved", label: "Approved" },
          { id: "rejected", label: "Rejected" },
          { id: "registered", label: "Registered" },
          { id: "revoked", label: "Revoked" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterStatus(f.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filterStatus === f.id
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

      {/* Content */}
      <div className="glass-panel rounded-3xl overflow-hidden min-h-[400px]">
        {loading && !attendees.length ? (
          <div className="flex flex-col items-center justify-center py-40">
            <Loader2 className="w-10 h-10 animate-spin text-lime mb-4" />
            <p className="text-muted-foreground animate-pulse">Synchronizing records...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-40">
            <AlertCircle className="w-10 h-10 text-rose-500 mb-4" />
            <p className="text-rose-500 font-bold mb-2">Sync Interrupted</p>
            <p className="text-muted-foreground text-sm mb-6">{error}</p>
            <button onClick={loadData} className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold transition-all">Retry Connection</button>
          </div>
        ) : filteredAttendees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/10">
              <Users className="w-8 h-8 text-white/10" />
            </div>
            <p className="text-muted-foreground font-medium">No attendees found in this sector.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] text-[11px] uppercase tracking-widest text-muted-foreground font-bold border-b border-white/5">
                <th className="px-8 py-5">Attendee Identity</th>
                <th className="px-8 py-5">Status</th>
                {hasHubspot && <th className="px-8 py-5">Sync State</th>}
                <th className="px-8 py-5">Timestamp</th>
                <th className="px-8 py-5 text-right">Directives</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredAttendees.map((attendee) => (
                <tr key={attendee.id} className="group hover:bg-white/[0.01] transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-lime/20 to-lime/5 border border-lime/10 flex items-center justify-center text-sm font-black text-lime">
                        {attendee.attendee_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-white group-hover:text-lime transition-colors">{attendee.attendee_name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1 font-mono">
                          <Mail className="w-3 h-3 text-lime/40" /> {attendee.attendee_email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusColor(attendee.status)}`}>
                      {attendee.status}
                    </span>
                  </td>
                  {hasHubspot && (
                    <td className="px-8 py-6">
                      <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${attendee.sync_status === 'synced' ? 'text-emerald-400' :
                          attendee.sync_status === 'failed' ? 'text-rose-400' : 'text-amber-400'
                        }`} title={attendee.sync_status === 'failed' ? attendee.sync_error_message || 'Sync failed' : undefined}>
                        <div className={`w-1.5 h-1.5 rounded-full ${attendee.sync_status === 'synced' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' :
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
                    {format(new Date(attendee.created_at), "dd/MM/yyyy HH:mm")}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setSelectedAttendee(attendee); setShowHistory(true); }}
                        className="p-2.5 hover:bg-white/5 rounded-xl text-muted-foreground hover:text-white transition-all"
                        title="View Audit Trail"
                      >
                        <History className="w-4 h-4" />
                      </button>

                      {attendee.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(attendee.id, 'approve')}
                            disabled={actionLoading === attendee.id}
                            className="p-2.5 hover:bg-emerald-500/10 rounded-xl text-emerald-500/60 hover:text-emerald-500 transition-all"
                            title="Approve Entry"
                          >
                            {actionLoading === attendee.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(attendee.id, 'reject')}
                            disabled={actionLoading === attendee.id}
                            className="p-2.5 hover:bg-rose-500/10 rounded-xl text-rose-500/60 hover:text-rose-500 transition-all"
                            title="Deny Entry"
                          >
                            {actionLoading === attendee.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                          </button>
                        </>
                      )}

                      {(attendee.status === "approved" || attendee.status === "registered") && (
                        <button
                          onClick={() => handleStatusUpdate(attendee.id, 'revoke')}
                          disabled={actionLoading === attendee.id}
                          className="p-2.5 hover:bg-rose-500/10 rounded-xl text-rose-500/60 hover:text-rose-500 transition-all"
                          title="Revoke Permission"
                        >
                          {actionLoading === attendee.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-50"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-[#0f1108] border-l border-white/10 z-[60] p-10 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-lime/10 rounded-lg">
                    <History className="w-5 h-5 text-lime" />
                  </div>
                  <h2 className="text-2xl font-heading font-bold text-white tracking-tight">Audit Trail</h2>
                </div>
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
                    <div className="text-sm text-muted-foreground font-mono">{selectedAttendee.attendee_email}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Current Status</p>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(selectedAttendee.status)}`}>
                      {selectedAttendee.status}
                    </span>
                  </div>
                  {hasHubspot && (
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">HubSpot Sync</p>
                      <p className="text-xs font-bold text-white">{selectedAttendee.sync_status.toUpperCase()}</p>
                    </div>
                  )}
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
                      <p className="text-sm font-bold text-white">
                        Status updated to <span className="text-lime uppercase tracking-wider">{entry.status}</span>
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {format(new Date(entry.changed_at), "MMM d, HH:mm:ss")}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(new Date(entry.changed_at), "yyyy")}
                        </div>
                      </div>
                      {entry.reason && (
                        <div className="p-3 bg-white/[0.03] rounded-xl text-xs text-muted-foreground italic border border-white/5">
                          "{entry.reason}"
                        </div>
                      )}
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
