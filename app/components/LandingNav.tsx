"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/app/components/Logo";

const navLinks = [
  { href: "#top", label: "Home" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#templates", label: "Templates" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export default function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0A0A0F]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-6 py-4">
          {/* Logo — always visible */}
          <a href="#top" className="shrink-0">
            <Logo />
          </a>

          {/* Nav links — visible at 1024px+, hidden below */}
          <div className="hidden lg:flex items-center gap-8 ml-10">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-400 transition-colors hover:text-white whitespace-nowrap"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Buttons — visible at 1024px+, hidden below */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <Link
              href="/login"
              className="rounded-xl border border-white/[0.1] px-5 py-2.5 text-sm font-medium text-slate-300 transition-all hover:bg-white/[0.06] hover:text-white whitespace-nowrap"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-500 whitespace-nowrap"
            >
              Get Started Free
            </Link>
          </div>

          {/* Hamburger — visible below 1024px only */}
          <button
            onClick={() => setMenuOpen(true)}
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg text-slate-400 transition-colors hover:text-white hover:bg-white/[0.06]"
            aria-label="Open menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Full-screen mobile menu overlay — below 1024px only */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] bg-[#0A0A0F] flex flex-col">
          {/* Top bar with logo + close */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <a
              href="#top"
              onClick={() => setMenuOpen(false)}
              className="inline-flex"
            >
              <Logo />
            </a>
            <button
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-center w-10 h-10 rounded-lg text-slate-400 transition-colors hover:text-white hover:bg-white/[0.06]"
              aria-label="Close menu"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Nav links stacked */}
          <div className="flex flex-col px-6 pt-6 gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-4 py-3.5 text-base font-medium text-slate-200 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Buttons at bottom */}
          <div className="mt-auto px-6 pb-10 flex flex-col gap-3">
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="rounded-xl border border-white/[0.1] py-3 text-center text-sm font-medium text-slate-300 transition-all hover:bg-white/[0.06] hover:text-white"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              onClick={() => setMenuOpen(false)}
              className="rounded-xl bg-emerald-600 py-3 text-center text-sm font-medium text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-500"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
