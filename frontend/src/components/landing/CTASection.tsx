"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

/* ── Swap CTA content here ── */
const CTA_TITLE = "Ready to launch your vision?";
const CTA_SUBTITLE =
  "Join over 2,000+ creators who trust our platform for their high-stakes event infrastructure.";
const CTA_BUTTON = "Get Started";
const CTA_PLACEHOLDER = "Enter your email";

export default function CTASection() {
  const [email, setEmail] = useState("");
  const router = useRouter();

  const handleGetStarted = () => {
    // If they entered an email, we could pass it to the sign-in/up page
    if (email) {
      router.push(`/sign-in?email_address=${encodeURIComponent(email)}`);
    } else {
      router.push("/sign-in");
    }
  };

  return (
    <section className="py-24 px-4">
      <div className="max-w-3xl mx-auto text-center">
        {/* ── CTA Card ── */}
        <div className="glass-card rounded-3xl p-10 sm:p-14 relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] bg-lime/5 rounded-full blur-[100px] pointer-events-none" />

          <h2 className="relative text-2xl sm:text-3xl font-bold text-white mb-4">
            {CTA_TITLE}
          </h2>
          <p className="relative text-sm sm:text-base text-gray-400 mb-8 max-w-lg mx-auto">
            {CTA_SUBTITLE}
          </p>

          {/* ── Email Input ── */}
          <div className="relative flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder={CTA_PLACEHOLDER}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full flex-1 px-5 py-3.5 rounded-full bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-lime/40 focus:ring-1 focus:ring-lime/20 transition-all"
            />
            <button 
              onClick={handleGetStarted}
              className="group w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-lime text-olive-dark font-semibold text-sm hover:bg-lime-light transition-all duration-300 hover:shadow-[0_0_30px_rgba(193,217,73,0.3)] flex-shrink-0"
            >
              {CTA_BUTTON}
              <ArrowRight
                size={14}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
