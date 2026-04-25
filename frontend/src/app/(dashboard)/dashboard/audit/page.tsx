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
  ArrowRight,
  ShieldCheck,
  XCircle,
  UserPlus,
  CheckCircle2,
  Timer,
  Zap
} from "lucide-react";
import { format } from "date-fns";
import { fetchAuditLogs } from "../../../../lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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
    (log.event_title && log.event_title.toLowerCase().includes(searchQuery.toLowerCase())) ||
    log.to_status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return { color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", icon: ShieldCheck };
      case "registered":
        return { color: "text-lime bg-lime/10 border-lime/20", icon: UserPlus };
      case "checked_in":
        return { color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20", icon: CheckCircle2 };
      case "shortlisted":
        return { color: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20", icon: Zap };
      case "rejected":
      case "revoked":
        return { color: "text-rose-400 bg-rose-400/10 border-rose-400/20", icon: XCircle };
      case "pending":
        return { color: "text-amber-400 bg-amber-400/10 border-amber-400/20", icon: Timer };
      default:
        return { color: "text-white/40 bg-white/5 border-white/10", icon: History };
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="px-2 py-1 bg-lime/10 border border-lime/20 rounded text-[10px] font-black text-lime uppercase tracking-[0.2em]">
              Security Protocol
            </div>
          </div>
          <h1 className="text-5xl font-heading font-black text-white tracking-tighter">
            Audit Trail
          </h1>
          <p className="text-white/40 text-sm mt-2 max-w-md font-medium leading-relaxed">
            Real-time synchronization of all registration state transitions across your event ecosystem.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-lime transition-all duration-300" />
            <input 
              type="text" 
              placeholder="Search feed..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-6 py-3.5 text-sm font-bold text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-lime/20 focus:border-lime/40 transition-all w-full md:w-80 sidebar-glass"
            />
          </div>
          <button 
            onClick={loadData}
            className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-white/40 hover:text-white hover:border-white/20 transition-all group"
            title="Refresh Feed"
          >
            <RefreshCw className={cn("w-5 h-5 transition-transform duration-500", loading && "animate-spin text-lime")} />
          </button>
        </div>
      </div>

      {/* Feed Container */}
      <div className="relative">
        {loading && !logs.length ? (
          <div className="glass-panel rounded-[2rem] p-8 flex flex-col items-center justify-center py-48 border-white/5">
            <div className="relative">
              <Loader2 className="w-12 h-12 animate-spin text-lime" />
              <div className="absolute inset-0 blur-xl bg-lime/20 animate-pulse" />
            </div>
            <p className="text-white/40 font-bold uppercase tracking-widest text-[10px] mt-6">Streaming live audit logs...</p>
          </div>
        ) : error ? (
          <div className="glass-panel rounded-[2rem] p-8 flex flex-col items-center justify-center py-40 text-center border-rose-500/10">
            <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mb-6 border border-rose-500/20">
              <AlertCircle className="w-10 h-10 text-rose-500" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2 tracking-tight">System Interruption</h3>
            <p className="text-white/40 max-w-sm mb-8 font-medium">{error}</p>
            <button 
              onClick={loadData} 
              className="px-10 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-white/10"
            >
              Reconnect Uplink
            </button>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="glass-panel rounded-[2rem] p-8 flex flex-col items-center justify-center py-40 text-center border-white/5">
            <div className="w-24 h-24 bg-white/[0.02] rounded-[2rem] flex items-center justify-center mb-8 border border-white/5 group">
              <History className="w-10 h-10 text-white/10 group-hover:text-white/20 transition-colors" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Zero Activity Detected</h3>
            <p className="text-white/40 max-w-sm font-medium leading-relaxed">No logs match your current search parameters. New entries will materialize here automatically.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredLogs.map((log, idx) => {
                const toConfig = getStatusConfig(log.to_status);
                const fromConfig = getStatusConfig(log.from_status || "new");
                const StatusIcon = toConfig.icon;

                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                      delay: idx * 0.03 
                    }}
                    key={`${log.registration_id}-${log.changed_at}-${idx}`} 
                    className="group relative overflow-hidden glass-panel rounded-3xl p-6 border border-white/5 hover:border-white/10 hover:bg-white/[0.02] transition-all duration-500"
                  >
                    {/* Background Decorative Element */}
                    <div className={cn(
                      "absolute -right-20 -top-20 w-64 h-64 blur-[100px] opacity-0 group-hover:opacity-10 transition-opacity duration-1000 pointer-events-none",
                      toConfig.color.split(' ')[1].replace('bg-', 'bg-')
                    )} />

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                      {/* Left Side: Identity & Context */}
                      <div className="flex items-center gap-6">
                        <div className={cn(
                          "w-16 h-16 rounded-[1.25rem] border flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-2xl shadow-black/40",
                          toConfig.color
                        )}>
                          <StatusIcon className="w-8 h-8" />
                        </div>
                        
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-black text-white tracking-tight leading-none">
                              {log.attendee_name}
                            </h3>
                            <div className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[9px] font-black text-white/30 uppercase tracking-widest">
                              ID: {log.registration_id.slice(-6)}
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-white/40">
                              <User className="w-3 h-3" />
                              {log.attendee_email}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-lime/60">
                              <Zap className="w-3 h-3" />
                              {log.event_title}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Transition Logic */}
                      <div className="flex items-center gap-4 bg-black/20 p-4 rounded-2xl border border-white/5">
                        <div className="flex flex-col items-center gap-1">
                           <span className="text-[9px] font-black text-white/20 uppercase tracking-widest leading-none">Original</span>
                           <span className={cn(
                             "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-[0.15em] border transition-all duration-500",
                             fromConfig.color
                           )}>
                             {log.from_status || "INITIAL"}
                           </span>
                        </div>

                        <ArrowRight className="w-5 h-5 text-white/10 group-hover:text-white/40 transition-all group-hover:translate-x-1" />

                        <div className="flex flex-col items-center gap-1">
                           <span className="text-[9px] font-black text-lime/40 uppercase tracking-widest leading-none">Modified</span>
                           <span className={cn(
                             "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-[0.15em] border transition-all duration-500 shadow-lg shadow-black/20",
                             toConfig.color
                           )}>
                             {log.to_status}
                           </span>
                        </div>
                      </div>

                      {/* Right Side: Timestamp & Metadata */}
                      <div className="text-right flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-4 lg:gap-2">
                        <div className="flex items-center gap-2 text-white group-hover:text-lime transition-colors">
                          <Clock className="w-4 h-4 text-white/20 group-hover:text-lime/60" />
                          <span className="text-sm font-black tabular-nums tracking-tight">
                            {format(new Date(log.changed_at), "HH:mm:ss")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-white/20 font-bold uppercase tracking-[0.2em] text-[9px]">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(new Date(log.changed_at), "MMM dd, yyyy")}
                        </div>
                      </div>
                    </div>

                    {/* Reason / Notes if available */}
                    {log.reason && (
                      <div className="mt-6 pt-6 border-t border-white/5 flex items-start gap-4">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                          <AlertCircle className="w-4 h-4 text-white/20" />
                        </div>
                        <p className="text-[13px] text-white/40 font-medium italic leading-relaxed">
                          "{log.reason}"
                        </p>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
