"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/estimate", label: "New Estimate" },
  { href: "/templates", label: "Templates" },
  { href: "/pricing", label: "Pricing" },
  { href: "/setup", label: "Setup" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-white/[0.05] backdrop-blur-xl border-b border-white/[0.08]">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3">
        <Link href="/dashboard" className="text-lg font-bold text-white">
          Preciso
        </Link>
        <div className="flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                pathname === link.href
                  ? "bg-indigo-500/20 text-indigo-400"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="ml-2 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-400 transition-all duration-200 hover:bg-rose-500/10 hover:text-rose-400"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}
