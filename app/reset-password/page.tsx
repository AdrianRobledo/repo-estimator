"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Logo from "@/app/components/Logo";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordInner />
    </Suspense>
  );
}

function ResetPasswordInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Something went wrong");
      return;
    }

    setSuccess(true);
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0F]">
        <div className="w-full max-w-sm px-6 text-center">
          <h2 className="text-lg font-semibold text-white">Invalid reset link</h2>
          <p className="mt-2 text-sm text-slate-400">
            This password reset link is invalid. Please request a new one.
          </p>
          <Link
            href="/forgot-password"
            className="mt-4 inline-block text-sm font-medium text-emerald-400 hover:text-emerald-300"
          >
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0F]">
      <div className="w-full max-w-sm px-6">
        <div className="text-center">
          <div className="flex justify-center"><Logo size="large" /></div>
          <p className="mt-2 text-sm text-slate-500">Set a new password</p>
        </div>

        <div className="mt-8 rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] p-6">
          {success ? (
            <div className="text-center">
              <h2 className="text-lg font-semibold text-white">Password updated!</h2>
              <p className="mt-2 text-sm text-slate-400">
                Your password has been reset. You can now sign in with your new password.
              </p>
              <Link
                href="/login"
                className="mt-4 inline-block rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-500"
              >
                Sign In
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full rounded-xl bg-white/[0.05] border border-white/[0.1] px-3 py-2.5 text-white placeholder:text-slate-500 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10"
                    placeholder="At least 8 characters"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="mt-1 block w-full rounded-xl bg-white/[0.05] border border-white/[0.1] px-3 py-2.5 text-white placeholder:text-slate-500 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10"
                    placeholder="Confirm your password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-500 disabled:opacity-50"
                >
                  {loading ? "Updating..." : "Reset Password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
