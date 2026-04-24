"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { 
  Settings as SettingsIcon, 
  Bot, 
  Key, 
  Save, 
  Trash2, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ShieldCheck,
  Zap
} from "lucide-react";
import { fetchSettings, updateSettings, type Settings } from "@/lib/api";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const { getToken } = useAuth();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Form state
  const [hubspotKey, setHubspotKey] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;

      const data = await fetchSettings(token);
      setSettings(data);
      setName(data.name || "");
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      setSuccess(false);
      const token = await getToken();
      if (!token) return;

      const payload: any = {};
      if (name !== settings?.name) payload.name = name;
      if (hubspotKey) payload.hubspot_api_key = hubspotKey;

      const updated = await updateSettings(token, payload);
      setSettings(updated);
      setHubspotKey(""); // Reset input since it's masked in the response
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveKey() {
    if (!confirm("Are you sure you want to disconnect HubSpot?")) return;
    
    try {
      setSaving(true);
      const token = await getToken();
      if (!token) return;

      const updated = await updateSettings(token, { hubspot_api_key: "" });
      setSettings(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to disconnect HubSpot");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-white/40">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-lime" />
          Settings
        </h1>
        <p className="text-white/40 font-medium">Manage your organizer profile and ecosystem integrations.</p>
      </motion.div>

      <div className="space-y-8">
        {/* Profile Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel rounded-3xl p-8 border border-white/5"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-lime/10 rounded-2xl text-lime border border-lime/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Organizer Profile</h2>
              <p className="text-sm text-white/40">Your basic information and identity.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 ml-1">
                Display Name
              </label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name or company name"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-lime/50 focus:border-lime/50 transition-all placeholder:text-white/20"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 ml-1">
                Email Address
              </label>
              <input 
                type="email" 
                disabled
                value={settings?.email || ""}
                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-3.5 text-white/40 cursor-not-allowed font-mono text-sm"
              />
              <p className="text-[10px] text-white/20 mt-3 ml-1 flex items-center gap-2">
                <AlertCircle className="w-3 h-3" /> Email is managed via Clerk authentication.
              </p>
            </div>
          </div>
        </motion.section>

        {/* HubSpot Integration */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel rounded-3xl p-8 border border-white/5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
            <Zap className="w-32 h-32 text-lime" />
          </div>

          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-lime/10 rounded-2xl text-lime border border-lime/20">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">HubSpot Integration</h2>
              <p className="text-sm text-white/40">Sync attendees to your HubSpot CRM automatically.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-4 bg-white/[0.02] border border-white/10 rounded-2xl flex items-start gap-4">
               <AlertCircle className="w-5 h-5 text-lime/60 shrink-0 mt-0.5" />
               <div className="text-xs text-white/60 leading-relaxed">
                 To integrate, create a <strong>Private App</strong> in your HubSpot settings and provide the <strong>Access Token</strong> below. Make sure it has <code>crm.objects.contacts.write</code> and <code>crm.objects.contacts.read</code> scopes.
               </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 ml-1 flex justify-between items-center">
                <span>HubSpot Private App Access Token</span>
                {settings?.has_hubspot_key && (
                  <span className="text-[9px] font-black text-lime bg-lime/10 px-2.5 py-1 rounded-full border border-lime/20 shadow-[0_0_10px_rgba(193,217,73,0.1)]">CONNECTED</span>
                )}
              </label>
              
              <div className="relative">
                <input 
                  type="password" 
                  value={hubspotKey}
                  onChange={(e) => setHubspotKey(e.target.value)}
                  placeholder={settings?.hubspot_api_key_masked || "pat-na-********"}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-lime/50 focus:border-lime/50 transition-all placeholder:text-white/20 font-mono"
                />
                <Key className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
              </div>

              {settings?.has_hubspot_key && (
                <button 
                  onClick={handleRemoveKey}
                  className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-rose-500/60 hover:text-rose-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Disconnect HubSpot Ecosystem
                </button>
              )}
            </div>
          </div>
        </motion.section>

        {/* Action Bar */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between pt-4"
        >
          <div className="flex items-center gap-4">
             {error && (
               <div className="text-rose-500 text-xs font-bold flex items-center gap-2 bg-rose-500/10 px-4 py-2 rounded-xl border border-rose-500/20">
                 <AlertCircle className="w-4 h-4" /> {error}
               </div>
             )}
             {success && (
               <div className="text-lime text-xs font-bold flex items-center gap-2 bg-lime/10 px-4 py-2 rounded-xl border border-lime/20">
                 <CheckCircle2 className="w-4 h-4" /> Configuration synchronized successfully!
               </div>
             )}
          </div>
          
          <button 
            onClick={handleSave}
            disabled={saving || (!hubspotKey && name === settings?.name)}
            className="bg-lime hover:bg-lime/90 disabled:bg-white/5 disabled:text-white/20 disabled:cursor-not-allowed text-[#1a1e0a] font-bold py-4 px-10 rounded-2xl transition-all shadow-xl shadow-lime/10 flex items-center gap-3 border-glow"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Persist Changes
          </button>
        </motion.div>
      </div>
    </div>
  );
}
