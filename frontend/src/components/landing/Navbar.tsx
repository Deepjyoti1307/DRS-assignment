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
          <div className="w-1/3 flex items-center">
            <Link href="/" className="flex items-center gap-3 z-50 group">
              <img src="/logo.png" alt="Logo" className="w-9 h-9 object-contain group-hover:scale-110 transition-transform duration-300" />
              <span className="text-3xl font-bold tracking-tight text-white drop-shadow-md">
                {BRAND_NAME}
              </span>
            </Link>
          </div>

          {/* ── Desktop NavHeader (Center) ── */}
          <div className="hidden md:flex flex-1 justify-center">
            <NavHeader />
          </div>

          {/* ── Right side (Empty or UserButton) ── */}
          <div className="w-1/3 flex items-center justify-end gap-3 z-50">
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
              className="md:hidden p-2 text-gray-300 bg-white/5 rounded-full backdrop-blur-md border border-white/10"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>

        {/* ── Mobile Menu ── */}
        {mobileOpen && (
          <div className="md:hidden mt-4 p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl animate-fade-up">
            <Link
              href="#explore"
              className="block px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Explore
            </Link>
            <Link
              href="#features"
              className="block px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="block px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Pricing
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
