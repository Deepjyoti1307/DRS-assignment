"use client";

import { Zap, BarChart3, Link2, ArrowUpRight } from "lucide-react";

/* ── Swap features content here ── */
const SECTION_TITLE = "Powerful Simplicity";
const SECTION_SUBTITLE =
  "Three pillars of tranquility for your next event.";

interface FeatureCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  tags?: string[];
  hasProgress?: boolean;
  progressLabel?: string;
  progressPercent?: number;
  hasIconRow?: boolean;
}

const FEATURES: FeatureCard[] = [
  {
    icon: <Zap size={20} className="text-lime" />,
    title: "One-click publishing",
    description:
      "Deploy your custom landing pages, registration forms, and marketing assets instantly. No code, no friction, just pure execution.",
    tags: ["INSTANT DEPLOY", "GLOBAL CDN"],
  },
  {
    icon: <BarChart3 size={20} className="text-lime" />,
    title: "Real-time RSVP",
    description:
      "Monitor your guest list with live sync updates.",
    hasProgress: true,
    progressLabel: "84 ACCEPTED / 100 INVITED",
    progressPercent: 84,
  },
  {
    icon: <Link2 size={20} className="text-lime" />,
    title: "HubSpot Integration",
    description:
      "Sync every lead, attendee, and engagement metric directly into your CRM. Keep your sales pipeline flowing with a bi-directional data link and custom field mapping.",
    hasIconRow: true,
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* ── Section Header ── */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            {SECTION_TITLE}
          </h2>
          <p className="text-gray-400 text-base sm:text-lg">
            {SECTION_SUBTITLE}
          </p>
        </div>

        {/* ── Features Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ── Card 1: One-click publishing (takes left column, top) ── */}
          <div className="glass-card rounded-2xl p-6 hover-lift">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="w-10 h-10 rounded-xl bg-lime/10 flex items-center justify-center mb-4">
                  {FEATURES[0].icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {FEATURES[0].title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-4">
                  {FEATURES[0].description}
                </p>
                {FEATURES[0].tags && (
                  <div className="flex gap-2 flex-wrap">
                    {FEATURES[0].tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 text-[10px] font-semibold tracking-wider uppercase rounded-md bg-lime/10 text-lime border border-lime/20"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {/* Mini chart visual */}
              <div className="hidden sm:flex items-end gap-1 h-24 flex-shrink-0">
                {[30, 50, 40, 65, 55, 80, 70].map((h, i) => (
                  <div
                    key={i}
                    className="w-3 rounded-t-sm"
                    style={{
                      height: `${h}%`,
                      background: `linear-gradient(to top, rgba(193,217,73,0.6), rgba(193,217,73,0.2))`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ── Card 2: Real-time RSVP (right column, top) ── */}
          <div className="glass-card rounded-2xl p-6 hover-lift">
            <div className="w-10 h-10 rounded-xl bg-lime/10 flex items-center justify-center mb-4">
              {FEATURES[1].icon}
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {FEATURES[1].title}
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              {FEATURES[1].description}
            </p>
            {FEATURES[1].hasProgress && (
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-[10px] tracking-wider uppercase text-gray-500 font-semibold">
                    {FEATURES[1].progressLabel}
                  </span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-lime to-olive animate-progress"
                    style={
                      {
                        "--progress-width": `${FEATURES[1].progressPercent}%`,
                      } as React.CSSProperties
                    }
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── Card 3: HubSpot Integration (spans full width) ── */}
          <div className="glass-card rounded-2xl p-6 hover-lift md:col-span-2">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <div className="w-10 h-10 rounded-xl bg-lime/10 flex items-center justify-center mb-4">
                  {FEATURES[2].icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {FEATURES[2].title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {FEATURES[2].description}
                </p>
              </div>
              {/* Integration icons */}
              {FEATURES[2].hasIconRow && (
                <div className="hidden sm:flex items-center gap-3 flex-shrink-0 pt-4">
                  {[
                    { icon: "💎", bg: "bg-purple-500/10" },
                    { icon: "⚡", bg: "bg-yellow-500/10" },
                    { icon: "🔗", bg: "bg-blue-500/10" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center text-lg border border-white/5 hover:border-lime/20 transition-colors cursor-pointer`}
                    >
                      {item.icon}
                    </div>
                  ))}
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 hover:border-lime/20 transition-colors cursor-pointer">
                    <ArrowUpRight size={16} className="text-gray-400" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
