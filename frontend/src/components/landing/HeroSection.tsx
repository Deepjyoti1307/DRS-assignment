"use client";

import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";

/* ── Swap hero content here ── */
const HERO_BADGE = "REVOLUTIONIZING EVENT TECH";
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
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-12 px-4 overflow-hidden bg-background">
      {/* ── Background glow effects ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Animated Mesh Gradient */}
        <div className="absolute inset-0 gradient-mesh animate-mesh opacity-60" />
        
        {/* Floating Orbs - Increased Intensity */}
        <div className="absolute top-[10%] left-[10%] w-[500px] h-[500px] bg-lime/20 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] bg-lime/15 rounded-full blur-[150px] animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[30%] left-[30%] w-[400px] h-[400px] bg-lime/25 rounded-full blur-[100px] animate-pulse-slow" />
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-lime/10 rounded-full blur-[180px] animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 text-center max-w-5xl mx-auto">
        {/* ── Badge ── */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 mb-8 animate-fade-up backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-lime animate-pulse" />
          <span className="text-[10px] font-black tracking-[0.3em] text-white uppercase opacity-80">
            {HERO_BADGE}
          </span>
        </div>

        {/* ── Headline ── */}
        <h1
          className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tighter mb-8 animate-fade-up text-white"
          style={{ animationDelay: "0.1s" }}
        >
          {HERO_TITLE_PARTS.line1_start}
          <span className="text-lime text-glow italic relative">
            {HERO_TITLE_PARTS.line1_accent}
            <span className="absolute -bottom-2 left-0 w-full h-1 bg-lime/30 blur-sm rounded-full" />
          </span>
          <br className="hidden sm:block" />
          {HERO_TITLE_PARTS.line1_end} {HERO_TITLE_PARTS.line2_start}
          <span className="text-lime text-glow italic ml-2">{HERO_TITLE_PARTS.line2_accent}</span>
        </h1>

        {/* ── Description ── */}
        <p
          className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-up font-medium"
          style={{ animationDelay: "0.2s" }}
        >
          {HERO_DESCRIPTION}
        </p>

        {/* ── CTA Buttons ── */}
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-fade-up"
          style={{ animationDelay: "0.3s" }}
        >
          <Link
            href="/sign-in"
            className="group relative flex items-center justify-center gap-4 px-10 h-[72px] min-w-[280px] rounded-full bg-lime text-olive-dark font-mono font-bold text-sm uppercase tracking-[0.2em] transition-all duration-500 hover:scale-105 hover:shadow-[0_20px_40px_rgba(193,217,73,0.3)]"
          >
            <span className="relative">{CTA_PRIMARY}</span>
            <ArrowRight
              size={20}
              className="relative group-hover:translate-x-1 transition-transform"
            />
          </Link>
          
          <button className="group flex items-center justify-center gap-4 px-10 h-[72px] min-w-[280px] rounded-full border border-white/10 bg-white/5 text-white font-mono font-bold text-sm uppercase tracking-[0.2em] backdrop-blur-xl transition-all duration-500 hover:bg-white/10 hover:border-white/20">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-all duration-500">
              <Play size={16} className="fill-white ml-1 text-white" />
            </div>
            {CTA_SECONDARY}
          </button>
        </div>
      </div>
    </section>
  );
}
