"use client";

import React from "react";
import Link from "next/link";
import { 
  Zap, 
  Settings, 
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Bot
} from "lucide-react";

export default function IntegrationsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-lime font-semibold uppercase tracking-widest mb-1">
            Ecosystem
          </p>
          <h1 className="text-4xl font-heading font-bold text-white mb-1">
            Integrations
          </h1>
          <p className="text-muted-foreground text-sm">
            Expand your capabilities by connecting third-party services.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* HubSpot Card */}
        <div className="glass-panel rounded-3xl p-8 border-lime/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
            <Bot size={120} />
          </div>
          
          <div className="flex items-center justify-between mb-8">
            <div className="w-16 h-16 bg-lime rounded-2xl flex items-center justify-center border-glow">
              <Bot className="text-olive-dark w-10 h-10" />
            </div>
            <span className="px-3 py-1 bg-lime/10 text-lime text-[10px] font-black uppercase tracking-widest rounded-lg border border-lime/20">
              Active
            </span>
          </div>

          <h2 className="text-2xl font-heading font-bold text-white mb-3">HubSpot CRM</h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-8 max-w-sm">
            Automatically sync every attendee and registration lifecycle update to your HubSpot contacts. Maintain a clean, unified CRM effortlessly.
          </p>

          <div className="space-y-4 mb-10">
            {[
              { icon: ShieldCheck, text: "Secure token-based sync" },
              { icon: RefreshCw, text: "Real-time lifecycle propagation" },
              { icon: ExternalLink, text: "Direct contact mapping" },
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-xs text-white/60">
                <feature.icon className="w-4 h-4 text-lime" />
                <span>{feature.text}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <Link 
              href="/dashboard/settings"
              className="flex items-center justify-center gap-2 w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all group/btn border border-white/5"
            >
              Manage Connection
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </Link>

            <button
              onClick={async () => {
                const confirm = window.confirm("This will sync ALL existing attendees to HubSpot. Continue?");
                if (!confirm) return;
                
                try {
                  const token = await (window as any).Clerk?.session?.getToken();
                  const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/integrations/hubspot/sync`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                  });
                  if (resp.ok) {
                    const data = await resp.json();
                    alert(`Successfully triggered sync for ${data.synced_count} attendees!`);
                  } else {
                    alert("Failed to trigger sync. Please check your HubSpot key in Settings.");
                  }
                } catch (err) {
                  alert("An error occurred during synchronization.");
                }
              }}
              className="flex items-center justify-center gap-2 w-full py-4 bg-lime/10 hover:bg-lime/20 text-lime rounded-2xl font-bold transition-all border border-lime/20"
            >
              <RefreshCw className="w-4 h-4" />
              Full Synchronize
            </button>
          </div>
        </div>

        {/* Placeholder for future integrations */}
        <div className="glass-panel rounded-3xl p-8 border-white/5 opacity-40 grayscale flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6">
            <Zap className="text-white/20 w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white/60 mb-2">More coming soon</h3>
          <p className="text-white/20 text-xs max-w-[200px]">
            We are working on Slack, Discord, and Stripe integrations.
          </p>
        </div>
      </div>
    </div>
  );
}
