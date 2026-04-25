"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { 
  History, 
  Clock, 
  User, 
  Calendar,
  Loader2,
  AlertCircle,
  RefreshCw,
  Search,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import { fetchAuditLogs } from "../../../../lib/api";
import { motion, AnimatePresence } from "framer-motion";

export default function AuditTrailPage() {
  const { getToken } = useAuth();
  
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;

      const data = await fetchAuditLogs(token);
      setLogs(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }

  const filteredLogs = logs.filter(log => 
    log.attendee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.attendee_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
      case "registered":
        return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
      case "rejected":
      case "revoked":
        return "text-rose-400 bg-rose-400/10 border-rose-400/20";
      case "pending":
        return "text-amber-400 bg-amber-400/10 border-amber-400/20";
      default:
        return "text-white/40 bg-white/5 border-white/10";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-lime font-semibold uppercase tracking-widest mb-1">
            System Logs
          </p>
          <h1 className="text-4xl font-heading font-bold text-white mb-1">
            Audit Trail
          </h1>
          <p className="text-muted-foreground text-sm">
            A comprehensive record of all registration status transitions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-lime transition-colors" />
            <input 
              type="text" 
              placeholder="Search by name, email or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lime/50 focus:border-lime/50 transition-all w-80"
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

      {/* Feed Container */}
      <div className="glass-panel rounded-3xl p-8 min-h-[500px]">
        {loading && !logs.length ? (
          <div className="flex flex-col items-center justify-center py-40">
            <Loader2 className="w-10 h-10 animate-spin text-lime mb-4" />
            <p className="text-muted-foreground">Streaming audit feed...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-40 text-center">
            <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Feed Interrupted</h3>
            <p className="text-muted-foreground max-w-sm mb-8">{error}</p>
            <button onClick={loadData} className="px-8 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-all border border-white/10">Reconnect</button>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 text-center">
            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6 border border-white/10">
              <History className="w-10 h-10 text-white/10" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No activity recorded</h3>
            <p className="text-muted-foreground max-w-sm">When attendees register or their status changes, logs will materialize here.</p>
          </div>
        ) : (
          <div className="relative pl-8 space-y-12 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-[1px] before:bg-white/10">
            {filteredLogs.map((log, idx) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={idx} 
                className="relative"
              >
                {/* Timeline Dot */}
                <div className="absolute -left-[41px] top-1.5 w-[14px] h-[14px] rounded-full ring-8 ring-[#0f1108] bg-white/20 border-2 border-white/10" />
                
                <div className="flex items-start justify-between gap-8 group">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-sm font-black text-white/40 group-hover:bg-lime/10 group-hover:border-lime/20 group-hover:text-lime transition-all">
                        {log.attendee_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-white leading-none">
                          {log.attendee_name}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1 font-mono uppercase tracking-widest">
                          {log.attendee_email}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Transitioned to</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${getStatusColor(log.status)}`}>
                        {log.status}
                      </span>
                    </div>

                    {log.reason && (
                      <div className="p-3 bg-white/[0.02] rounded-xl text-xs text-muted-foreground italic border border-white/5 max-w-xl">
                        "{log.reason}"
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <div className="flex items-center justify-end gap-2 text-xs font-bold text-white/20 group-hover:text-lime/60 transition-colors mb-1">
                      <Clock className="w-3.5 h-3.5" />
                      {format(new Date(log.changed_at), "HH:mm:ss")}
                    </div>
                    <div className="flex items-center justify-end gap-2 text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(log.changed_at), "MMM d, yyyy")}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
