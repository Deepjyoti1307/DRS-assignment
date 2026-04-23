"use client";

import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";

/* ── Swap hero content here ── */
const HERO_BADGE = "REVOLUTIONIZING EVENT TECH — LIVE";
const HERO_TITLE_PARTS = {
  line1_start: "Go from ",
  line1_accent: "Idea",
  line1_end: " to Live Event",
  line2_start: "in ",
  line2_accent: "Minutes",
};
const HERO_DESCRIPTION =
  "Everything you need to host unforgettable events.";
const CTA_PRIMARY = "Get Started Free";
const CTA_SECONDARY = "Watch Demo";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-12 px-4 overflow-hidden">
      {/* ── Background glow effects ── */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        {/* Central vibrant lime glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[800px] h-[400px] sm:h-[600px] bg-lime/15 rounded-full blur-[120px] mix-blend-screen" />
        {/* Subtle olive/lime ambient glow at the top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[300px] bg-olive-dark/50 rounded-[100%] blur-[100px]" />
      </div>

      <div className="relative z-10 text-center max-w-4xl mx-auto">
        {/* ── Badge ── */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-lime/30 bg-lime/5 mb-8 animate-fade-up">
          <span className="text-xs font-semibold tracking-[0.2em] text-lime uppercase">
            {HERO_BADGE}
          </span>
        </div>

        {/* ── Headline ── */}
        <h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight mb-6 animate-fade-up"
          style={{ animationDelay: "0.1s" }}
        >
          <span className="text-gradient-hero">{HERO_TITLE_PARTS.line1_start}</span>
          <span className="gradient-lime-text italic">{HERO_TITLE_PARTS.line1_accent}</span>
          <span className="text-gradient-hero">{HERO_TITLE_PARTS.line1_end}</span>
          <br />
          <span className="text-gradient-hero">{HERO_TITLE_PARTS.line2_start}</span>
          <span className="gradient-lime-text italic">{HERO_TITLE_PARTS.line2_accent}</span>
        </h1>

        {/* ── Description ── */}
        <p
          className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up"
          style={{ animationDelay: "0.2s" }}
        >
          {HERO_DESCRIPTION}
        </p>

        {/* ── CTA Buttons ── */}
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up"
          style={{ animationDelay: "0.3s" }}
        >
          <Link 
            href="/sign-in" 
            style={{ backgroundColor: 'transparent', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
            className="group flex items-center gap-2 px-7 py-3.5 rounded-full border border-lime/50 text-white font-semibold text-sm transition-all duration-300 shadow-[0_0_15px_rgba(193,217,73,0.1)] hover:bg-lime/10 hover:border-lime/70 hover:shadow-[0_0_25px_rgba(193,217,73,0.2)]"
          >
            {CTA_PRIMARY}
            <ArrowRight
              size={16}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
          <button className="group flex items-center gap-2 px-7 py-3.5 rounded-full border border-white/20 text-white font-medium text-sm hover:bg-white/5 transition-all duration-300">
            <Play size={14} className="fill-white" />
            {CTA_SECONDARY}
          </button>
        </div>
      </div>

    </section>
  );
}
