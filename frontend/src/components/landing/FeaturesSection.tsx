import { Zap, BarChart3, Link2, ShieldCheck, Cpu, Layout, Users2, Sparkles } from "lucide-react";

const SECTION_TITLE = "Core Engine Capabilities";
const SECTION_SUBTITLE = "The high-performance orchestration engine for world-class organizers.";

const FEATURES = [
  {
    icon: <Cpu className="w-6 h-6 text-lime" />,
    title: "Dynamic RSVP Logic",
    description: "Configurable registration workflows. Switch between instant Open registration or curated Shortlisted modes with ease.",
    size: "large",
  },
  {
    icon: <Link2 className="w-6 h-6 text-lime" />,
    title: "HubSpot Real-time Sync",
    description: "Bi-directional CRM integration that keeps your pipeline flowing without manual data entry.",
    size: "small",
  },
  {
    icon: <Users2 className="w-6 h-6 text-lime" />,
    title: "Atomic Capacity Control",
    description: "High-concurrency registration safety. Our engine ensures you never exceed event capacity, even under heavy load.",
    size: "small",
  },
  {
    icon: <ShieldCheck className="w-6 h-6 text-lime" />,
    title: "Enterprise Audit Trail",
    description: "Complete transparency. Every status transition and email interaction is logged for full accountability.",
    size: "medium",
  },
  {
    icon: <Zap className="w-6 h-6 text-lime" />,
    title: "Automated Workflows",
    description: "Trigger-based responsive email flows that keep attendees engaged from registration to check-in.",
    size: "medium",
  }
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-32 px-4 bg-background relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* ── Section Header ── */}
        <div className="text-center mb-24">
          <h2 className="text-4xl sm:text-6xl font-black text-white mb-6 tracking-tighter">
            {SECTION_TITLE}
          </h2>
          <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto font-medium">
            {SECTION_SUBTITLE}
          </p>
        </div>

        {/* ── Bento Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:auto-rows-[300px]">
          {/* Card 1: Logic (Large) */}
          <div className="md:col-span-2 md:row-span-2 glass-card-premium rounded-[2.5rem] p-10 flex flex-col justify-between group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-lime/10 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-lime/20 transition-all duration-700" />
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-8 border border-white/10 group-hover:scale-110 transition-transform duration-500">
                {FEATURES[0].icon}
              </div>
              <h3 className="text-3xl font-black text-white mb-4 tracking-tight">
                {FEATURES[0].title}
              </h3>
              <p className="text-gray-400 text-lg leading-relaxed max-w-md">
                {FEATURES[0].description}
              </p>
            </div>
            <div className="flex gap-4 mt-8">
              <div className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/60">Open Mode</div>
              <div className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/60">Shortlisted Mode</div>
            </div>
          </div>

          {/* Card 2: HubSpot (Small) */}
          <div className="glass-card-premium rounded-[2.5rem] p-8 flex flex-col group relative overflow-hidden">
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 transition-transform duration-500">
              {FEATURES[1].icon}
            </div>
            <h3 className="text-xl font-black text-white mb-3">
              {FEATURES[1].title}
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              {FEATURES[1].description}
            </p>
          </div>

          {/* Card 3: Users (Small) */}
          <div className="glass-card-premium rounded-[2.5rem] p-8 flex flex-col group relative overflow-hidden">
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 transition-transform duration-500">
              {FEATURES[2].icon}
            </div>
            <h3 className="text-xl font-black text-white mb-3">
              {FEATURES[2].title}
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              {FEATURES[2].description}
            </p>
          </div>

          {/* Card 4: Audit (Medium) */}
          <div className="md:col-span-2 glass-card-premium rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-10 group relative overflow-hidden">
            <div className="flex-1">
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 transition-transform duration-500">
                {FEATURES[3].icon}
              </div>
              <h3 className="text-2xl font-black text-white mb-4">
                {FEATURES[3].title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
                {FEATURES[3].description}
              </p>
            </div>
            <div className="hidden sm:grid grid-cols-2 gap-3 w-48 shrink-0">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-white/5 border border-white/10 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </div>

          {/* Card 5: Analytics (Medium) */}
          <div className="glass-card-premium rounded-[2.5rem] p-8 flex flex-col group relative overflow-hidden">
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 transition-transform duration-500">
              {FEATURES[4].icon}
            </div>
            <h3 className="text-xl font-black text-white mb-3">
              {FEATURES[4].title}
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              {FEATURES[4].description}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
