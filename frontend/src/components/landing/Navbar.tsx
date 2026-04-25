"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { SignedIn, UserButton } from "@clerk/nextjs";
import NavHeader from "@/components/ui/nav-header";

const BRAND_NAME = "Eventic";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pt-4">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="relative flex items-center justify-between h-14">
          {/* ── Logo (Left) ── */}
          <div className="flex-1 md:w-1/3 flex items-center">
            <Link href="/" className="flex items-center gap-2 sm:gap-3 z-50 group">
              <img src="/logo.png" alt="Logo" className="w-8 h-8 sm:w-9 sm:h-9 object-contain group-hover:scale-110 transition-transform duration-500" />
              <span className="text-xl sm:text-3xl font-black tracking-tighter text-white drop-shadow-md">
                {BRAND_NAME}
              </span>
            </Link>
          </div>

          {/* ── Desktop NavHeader (Center) ── */}
          <div className="hidden md:flex flex-1 justify-center">
            <NavHeader />
          </div>

          {/* ── Right side (Empty or UserButton) ── */}
          <div className="flex-1 md:w-1/3 flex items-center justify-end gap-3 z-50">
            <SignedIn>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9 border border-white/20 shadow-lg",
                  },
                }}
              />
            </SignedIn>

            {/* ── Mobile Toggle ── */}
            <button
              className="md:hidden p-2.5 text-white bg-white/5 rounded-xl backdrop-blur-md border border-white/10 transition-all hover:bg-white/10"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>

        {/* ── Mobile Menu ── */}
        {mobileOpen && (
          <div className="md:hidden mt-4 p-2 rounded-[2rem] bg-background/80 backdrop-blur-2xl border border-white/10 shadow-2xl animate-fade-up overflow-hidden">
            <div className="flex flex-col p-2 gap-1">
              {[
                { label: "Explore", href: "#explore" },
                { label: "Features", href: "#features" },
                { label: "Dashboard", href: "/dashboard" },
              ].map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-white/40 hover:text-white hover:bg-white/5 rounded-2xl transition-all"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
