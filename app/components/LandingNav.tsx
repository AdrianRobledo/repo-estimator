"use client";

import Link from "next/link";

const navLinks = [
  { href: "#top", label: "Home" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "/pricing", label: "Pricing", isPage: true },
  { href: "#templates", label: "Templates" },
];

export default function LandingNav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0B0F1A]/80 backdrop-blur-xl">
      <div className="mx-auto max-w-5xl flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <a href="#top" className="text-xl font-bold text-white shrink-0">
          Preciso
        </a>

        {/* Nav links — centered */}
        <div className="flex items-center gap-8 ml-10">
          {navLinks.map((link) =>
            link.isPage ? (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-400 transition-colors hover:text-white whitespace-nowrap"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-400 transition-colors hover:text-white whitespace-nowrap"
              >
                {link.label}
              </a>
            )
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/login"
            className="rounded-xl border border-white/[0.1] px-5 py-2.5 text-sm font-medium text-slate-300 transition-all hover:bg-white/[0.06] hover:text-white whitespace-nowrap"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-500 whitespace-nowrap"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </nav>
  );
}
