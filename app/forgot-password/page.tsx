"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/app/components/Logo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [googleOnly, setGoogleOnly] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setGoogleOnly(false);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.googleOnly) {
      setGoogleOnly(true);
      return;
    }

    setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0F]">
      <div className="w-full max-w-sm px-6">
        <div className="text-center">
          <div className="flex justify-center"><Logo size="large" /></div>
          <p className="mt-2 text-sm text-slate-500">Reset your password</p>
        </div>

        <div className="mt-8 rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] p-6">
          {sent ? (
            <div className="text-center">
              <h2 className="text-lg font-semibold text-white">Check your email</h2>
              <p className="mt-2 text-sm text-slate-400">
                If an account exists with that email, we sent a password reset link.
              </p>
              <Link
                href="/login"
                className="mt-4 inline-block text-sm font-medium text-emerald-400 hover:text-emerald-300"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              {googleOnly && (
                <div className="mb-4 rounded-xl bg-blue-500/10 border border-blue-500/20 px-4 py-3 text-sm text-blue-400">
                  This account uses Google sign-in. Please sign in with Google instead.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full rounded-xl bg-white/[0.05] border border-white/[0.1] px-3 py-2.5 text-white placeholder:text-slate-500 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10"
                    placeholder="you@example.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-500 disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>

              <p className="mt-4 text-center text-sm text-slate-500">
                <Link
                  href="/login"
                  className="font-medium text-emerald-400 hover:text-emerald-300"
                >
                  Back to Sign In
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
