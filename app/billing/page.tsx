"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import AppShell from "@/app/components/AppShell";

export default function BillingPage() {
  return (
    <Suspense>
      <BillingPageInner />
    </Suspense>
  );
}

function BillingPageInner() {
  const searchParams = useSearchParams();
  const showSuccess = searchParams.get("success") === "true";
  const [usage, setUsage] = useState<{
    plan: string;
    estimatesUsed: number;
    estimateLimit: number | null;
    stripeCurrentPeriodEnd: string | null;
  } | null>(null);
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/usage")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && !data.error) setUsage(data);
      });
  }, []);

  const isPro = usage?.plan === "pro";

  async function handleUpgrade(interval: "monthly" | "annual") {
    setUpgradingPlan(interval);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "subscription", interval }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setUpgradingPlan(null);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold text-white">Billing</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your subscription and usage
        </p>

        {/* Success Banner */}
        {showSuccess && (
          <div className="mt-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-400">
            Welcome to Pro! You now have unlimited access.
          </div>
        )}

        {/* Current Plan */}
        <div className="mt-6 rounded-2xl bg-white/[0.05] border border-white/[0.08] p-6">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Current Plan
            </h2>
            <span
              className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                isPro
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                  : "bg-white/[0.06] border border-white/[0.1] text-slate-400"
              }`}
            >
              {isPro ? "Pro" : "Free"}
            </span>
          </div>

          {/* Usage */}
          <div className="mt-5">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-slate-400">Estimates this month</span>
              <span className="font-medium text-white">
                {usage ? (
                  isPro ? (
                    `${usage.estimatesUsed} used`
                  ) : (
                    `${usage.estimatesUsed} of ${usage.estimateLimit}`
                  )
                ) : (
                  "..."
                )}
              </span>
            </div>
            {!isPro && usage && (
              <div className="mt-2 h-2 w-full rounded-full bg-white/[0.06]">
                <div
                  className="h-2 rounded-full bg-white/60 transition-all"
                  style={{
                    width: `${Math.min(100, ((usage.estimatesUsed) / (usage.estimateLimit || 3)) * 100)}%`,
                  }}
                />
              </div>
            )}
            {isPro && (
              <p className="mt-2 text-xs text-slate-500">Unlimited estimates</p>
            )}
          </div>

          {/* Pro subscription details */}
          {isPro && usage?.stripeCurrentPeriodEnd && (
            <div className="mt-4 border-t border-white/[0.06] pt-4">
              <p className="text-sm text-slate-400">
                Next billing date:{" "}
                <span className="text-white">
                  {new Date(usage.stripeCurrentPeriodEnd).toLocaleDateString(
                    "en-US",
                    { year: "numeric", month: "long", day: "numeric" }
                  )}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Upgrade Plans (free users only) */}
        {!isPro && (
          <div className="mt-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Upgrade to Pro</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Monthly */}
              <div className="rounded-2xl bg-white/[0.05] border border-white/[0.08] p-6">
                <h3 className="text-base font-bold text-white">Pro Monthly</h3>
                <p className="mt-2">
                  <span className="text-2xl font-bold text-white">$9.99</span>
                  <span className="text-sm text-slate-500">/month</span>
                </p>
                <ul className="mt-4 space-y-2">
                  {["Unlimited estimates", "Invoicing & payments", "Unlimited templates"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                      <svg className="h-3.5 w-3.5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleUpgrade("monthly")}
                  disabled={!!upgradingPlan}
                  className="mt-5 w-full rounded-xl bg-emerald-600 py-2.5 text-center text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-500 disabled:opacity-50"
                >
                  {upgradingPlan === "monthly" ? "Redirecting..." : "Upgrade Monthly"}
                </button>
              </div>

              {/* Annual */}
              <div className="relative rounded-2xl bg-white/[0.05] border border-emerald-500/30 ring-1 ring-emerald-500/20 p-6">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-0.5 text-xs font-bold text-emerald-400">
                    Save 33%
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">Pro Annual</h3>
                <p className="mt-2">
                  <span className="text-2xl font-bold text-white">$79.99</span>
                  <span className="text-sm text-slate-500">/year</span>
                </p>
                <ul className="mt-4 space-y-2">
                  {["Unlimited estimates", "Invoicing & payments", "Unlimited templates"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                      <svg className="h-3.5 w-3.5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleUpgrade("annual")}
                  disabled={!!upgradingPlan}
                  className="mt-5 w-full rounded-xl bg-emerald-600 py-2.5 text-center text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-500 disabled:opacity-50"
                >
                  {upgradingPlan === "annual" ? "Redirecting..." : "Upgrade Annual"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Manage Subscription (pro users) */}
        {isPro && (
          <div className="mt-6 rounded-2xl bg-white/[0.05] border border-white/[0.08] p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Manage Subscription
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Your Pro subscription is active. To make changes to your billing,
              contact support.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
