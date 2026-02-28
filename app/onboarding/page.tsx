"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/app/components/Logo";
import { formatPhone } from "@/lib/format";
import { TRADE_TYPES } from "@/lib/sample-estimates";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("");

  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [tradeType, setTradeType] = useState("");

  useEffect(() => {
    fetch("/api/onboarding")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.onboardingComplete) {
          router.replace("/dashboard");
          return;
        }
        if (data?.name) setUserName(data.name);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName, phone, tradeType }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Something went wrong");
        setSaving(false);
        return;
      }

      const data = await res.json();
      router.push(`/estimate?sample=${encodeURIComponent(data.tradeType)}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0F]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-white" />
      </div>
    );
  }

  const isValid = businessName.trim() && phone.trim() && tradeType;

  const inputClass =
    "mt-1 block w-full rounded-xl bg-white/[0.05] border border-white/[0.1] px-3 py-2.5 text-white placeholder:text-slate-500 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10";
  const selectChevron = `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0F]">
      <div className="w-full max-w-sm px-6">
        <div className="text-center">
          <div className="flex justify-center">
            <Logo size="large" />
          </div>
          {userName ? (
            <p className="mt-3 text-sm text-slate-400">
              Welcome, <span className="text-white font-medium">{userName}</span>
            </p>
          ) : (
            <p className="mt-3 text-sm text-slate-400">Welcome!</p>
          )}
        </div>

        <div className="mt-8 rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] p-6">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-1">
            <div className="h-1.5 flex-1 rounded-full bg-emerald-500" />
            <div className="h-1.5 flex-1 rounded-full bg-white/[0.08]" />
          </div>
          <p className="text-xs text-slate-500 mb-5">Step 1 of 2: Tell us about your business</p>

          {error && (
            <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400">
                Business Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Mike's Plumbing"
                autoFocus
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400">
                Phone Number <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="(555) 123-4567"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400">
                Trade / Service Type <span className="text-red-400">*</span>
              </label>
              <select
                value={tradeType}
                onChange={(e) => setTradeType(e.target.value)}
                className={`${inputClass} appearance-none`}
                style={{
                  backgroundImage: selectChevron,
                  backgroundPosition: "right 0.75rem center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "1.2em 1.2em",
                  paddingRight: "2.5rem",
                }}
              >
                <option value="" disabled className="bg-[#0A0A0F] text-slate-500">
                  Select your trade...
                </option>
                {TRADE_TYPES.map((t) => (
                  <option key={t} value={t} className="bg-[#0A0A0F] text-white">
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={!isValid || saving}
              className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/10 border-t-white" />
              )}
              Continue
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
