"use client";

import { useState } from "react";
import Link from "next/link";

const navLinks = [
  { href: "#top", label: "Home" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "/pricing", label: "Pricing", isPage: true },
  { href: "#templates", label: "Templates" },
];

export default function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0B0F1A]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center px-6 py-4">
        {/* Logo */}
        <a href="#top" className="text-xl font-bold text-white shrink-0">
          Preciso
        </a>

        {/* Centered links — desktop */}
        <div className="hidden md:flex flex-1 items-center justify-center gap-1">
          {navLinks.map((link) =>
            link.isPage ? (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-white"
              >
                {link.label}
              </a>
            )
          )}
        </div>

        {/* Right side buttons — desktop */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <Link
            href="/login"
            className="rounded-xl border border-white/[0.1] px-4 py-2 text-sm font-medium text-slate-300 transition-all hover:bg-white/[0.06] hover:text-white"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-500"
          >
            Get Started Free
          </Link>
        </div>

        {/* Mobile hamburger */}
        <div className="ml-auto md:hidden">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            {open ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-white/[0.08] px-6 py-3 space-y-1">
          {navLinks.map((link) =>
            link.isPage ? (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:text-white hover:bg-white/[0.06]"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:text-white hover:bg-white/[0.06]"
              >
                {link.label}
              </a>
            )
          )}
          <div className="border-t border-white/[0.08] pt-3 mt-2 space-y-2">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="block rounded-xl border border-white/[0.1] px-3 py-2.5 text-center text-sm font-medium text-slate-300 transition-all hover:bg-white/[0.06]"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              className="block rounded-xl bg-indigo-600 px-3 py-2.5 text-center text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-500"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
