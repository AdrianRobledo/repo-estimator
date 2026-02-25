"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AppShell from "@/app/components/AppShell";
import type { BusinessProfile, EstimateData, InvoiceData } from "@/lib/types";

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardInner />
    </Suspense>
  );
}

function DashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [upgradeToast, setUpgradeToast] = useState(false);

  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      setUpgradeToast(true);
      window.history.replaceState({}, "", "/dashboard");
      const timer = setTimeout(() => setUpgradeToast(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);
  const [estimates, setEstimates] = useState<EstimateData[]>([]);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [templateCount, setTemplateCount] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [sendModal, setSendModal] = useState<{ type: "estimate" | "invoice"; id: string } | null>(null);
  const [onboardingDismissed, setOnboardingDismissed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("onboarding_dismissed") === "true";
    }
    return false;
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/estimates").then((r) => r.ok ? r.json() : []),
      fetch("/api/invoices").then((r) => r.ok ? r.json() : []),
      fetch("/api/profile").then((r) => r.ok ? r.json() : null),
      fetch("/api/templates").then((r) => r.ok ? r.json() : []),
    ]).then(([est, inv, prof, tmpl]) => {
      setEstimates(Array.isArray(est) ? est : []);
      setInvoices(Array.isArray(inv) ? inv : []);
      if (prof && !prof.error) setProfile(prof);
      setTemplateCount(Array.isArray(tmpl) ? tmpl.length : 0);
      setLoading(false);
    });
  }, []);

  const statusDot: Record<string, string> = {
    draft: "bg-slate-400",
    sent: "bg-amber-400",
    approved: "bg-emerald-400",
    declined: "bg-red-400",
    unpaid: "bg-amber-400",
    paid: "bg-emerald-400",
    overdue: "bg-red-400",
  };

  // Computed values
  const totalEstimates = estimates.length;
  const approved = estimates.filter((e) => e.status === "approved").length;
  const pending = estimates.filter((e) => e.status === "sent").length;
  const declined = estimates.filter((e) => e.status === "declined").length;
  const totalRevenue = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + i.total, 0);

  // Onboarding checklist
  const onboardingSteps = [
    { done: !!(profile?.businessName && profile?.ownerName), label: "Set up your business profile", href: "/setup" },
    { done: estimates.length > 0, label: "Create your first estimate", href: "/estimate" },
    { done: estimates.some((e) => e.status === "sent" || e.status === "approved" || e.status === "declined"), label: "Send an estimate to a customer", href: undefined },
    { done: estimates.some((e) => e.status === "approved") || invoices.some((i) => i.status === "paid"), label: "Get an estimate approved or invoice paid", href: undefined },
  ];
  const completedSteps = onboardingSteps.filter((s) => s.done).length;

  // Needs Attention items
  type AttentionItem = {
    id: string;
    kind: "awaiting" | "ready" | "overdue" | "approaching";
    priority: number;
    label: string;
    amount: number;
    context: string;
    linkId: string;
    linkType: "estimate" | "invoice";
  };

  const nowMs = Date.now();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const MS_PER_DAY = 86400000;

  function parseEstimateDate(dateStr: string): number {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return new Date(dateStr + "T00:00:00").getTime();
    const p = new Date(dateStr);
    return isNaN(p.getTime()) ? 0 : p.getTime();
  }

  const attentionItems: AttentionItem[] = [];

  // 1. Overdue invoices (priority 0 — highest)
  invoices.forEach((inv) => {
    if (inv.status !== "unpaid") return;
    const due = new Date(inv.dueDate + "T00:00:00");
    if (due >= todayStart) return;
    const daysOver = Math.floor((todayStart.getTime() - due.getTime()) / MS_PER_DAY);
    attentionItems.push({
      id: `inv-overdue-${inv.id}`,
      kind: "overdue",
      priority: 0,
      label: inv.customer.name || "Unnamed Customer",
      amount: inv.total,
      context: `Overdue ${daysOver} day${daysOver !== 1 ? "s" : ""}`,
      linkId: inv.id,
      linkType: "invoice",
    });
  });

  // 2. Awaiting response — sent > 2 days ago (priority 1)
  estimates.forEach((est) => {
    if (est.status !== "sent") return;
    const sentTime = parseEstimateDate(est.date);
    if (!sentTime) return;
    const daysSince = Math.floor((nowMs - sentTime) / MS_PER_DAY);
    if (daysSince < 2) return;
    attentionItems.push({
      id: `est-awaiting-${est.id}`,
      kind: "awaiting",
      priority: 1,
      label: est.customer.name || "Unnamed Customer",
      amount: est.total,
      context: `Sent ${daysSince} day${daysSince !== 1 ? "s" : ""} ago`,
      linkId: est.id,
      linkType: "estimate",
    });
  });

  // 3. Ready to invoice — approved, no invoice (priority 2)
  estimates.forEach((est) => {
    if (est.status !== "approved" || est.invoiceId) return;
    attentionItems.push({
      id: `est-ready-${est.id}`,
      kind: "ready",
      priority: 2,
      label: est.customer.name || "Unnamed Customer",
      amount: est.total,
      context: "Approved — ready to invoice",
      linkId: est.id,
      linkType: "estimate",
    });
  });

  // 4. Approaching due — unpaid, due within 7 days (priority 3)
  invoices.forEach((inv) => {
    if (inv.status !== "unpaid") return;
    const due = new Date(inv.dueDate + "T00:00:00");
    if (due < todayStart) return; // already overdue, handled above
    const daysUntil = Math.floor((due.getTime() - todayStart.getTime()) / MS_PER_DAY);
    if (daysUntil > 7) return;
    attentionItems.push({
      id: `inv-approaching-${inv.id}`,
      kind: "approaching",
      priority: 3,
      label: inv.customer.name || "Unnamed Customer",
      amount: inv.total,
      context: daysUntil === 0 ? "Due today" : `Due in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}`,
      linkId: inv.id,
      linkType: "invoice",
    });
  });

  attentionItems.sort((a, b) => a.priority - b.priority);
  const needsAttention = attentionItems.slice(0, 5);

  function handleCopyLink(link: string, id: string) {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const sendModalData = sendModal
    ? sendModal.type === "estimate"
      ? (() => {
          const est = estimates.find((e) => e.id === sendModal.id);
          return est ? { link: `${typeof window !== "undefined" ? window.location.origin : ""}/view/${est.id}`, customer: est.customer, profile: est.profile, label: "Estimate", id: est.id } : null;
        })()
      : (() => {
          const inv = invoices.find((i) => i.id === sendModal.id);
          return inv ? { link: `${typeof window !== "undefined" ? window.location.origin : ""}/invoice/${inv.id}`, customer: inv.customer, profile: inv.profile, label: "Invoice", id: inv.id } : null;
        })()
    : null;

  async function handleConvertToInvoice(estId: string) {
    setConvertingId(estId);
    try {
      const now = new Date();
      const y = now.getFullYear().toString().slice(-2);
      const m = String(now.getMonth() + 1).padStart(2, "0");
      const d = String(now.getDate()).padStart(2, "0");
      const rand = Math.floor(Math.random() * 900 + 100);
      const invoiceNumber = `INV-${y}${m}${d}-${rand}`;
      const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      const due = new Date(now);
      due.setDate(due.getDate() + 30);
      const dueDate = `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, "0")}-${String(due.getDate()).padStart(2, "0")}`;
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estimateId: estId, invoiceNumber, date: dateStr, dueDate }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/invoice/${data.id}`);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error === "Pro plan required" ? "Upgrade to Pro to create invoices." : errData.error || "Failed to create invoice.");
      }
    } finally {
      setConvertingId(null);
    }
  }

  // Week bar data (Mon-Sun of current week)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayDay = today.getDay(); // 0=Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - (todayDay === 0 ? 6 : todayDay - 1));
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
  const sunday = weekDays[6];
  const toISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const weekJobDates = new Set(
    estimates.filter((e) => {
      if (!e.jobDate) return false;
      const jd = new Date(e.jobDate + "T00:00:00");
      return jd >= monday && jd <= sunday;
    }).map((e) => e.jobDate!)
  );
  const upcomingJobs = estimates
    .filter((e) => {
      if (!e.jobDate) return false;
      const jd = new Date(e.jobDate + "T00:00:00");
      return jd >= today && jd <= sunday;
    })
    .sort((a, b) => a.jobDate!.localeCompare(b.jobDate!))
    .slice(0, 3);

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-white" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Upgrade Toast */}
      {upgradeToast && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in-up">
          <div className="flex items-center gap-3 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-emerald-500/25">
            <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Welcome to Preciso Pro! You now have unlimited access.
            <button onClick={() => setUpgradeToast(false)} className="ml-2 text-white/70 hover:text-white">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 bg-dashboard-mesh min-h-screen flex flex-col">
        {/* Page Title */}
        <div className="animate-fade-in-up">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Overview</h1>
        </div>

        {/* Stats Bar */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-5 animate-fade-in-up delay-100">
          {/* Total Estimates */}
          <div className="flex flex-col rounded-xl border border-white/[0.08] border-l-2 border-l-white/20 bg-gradient-to-r from-white/[0.05] to-white/[0.02] p-4">
            <div className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-xs font-medium text-slate-400">Total Estimates</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-white">{totalEstimates}</p>
            {totalEstimates === 0 && <p className="mt-1 text-[11px] text-slate-600">Create your first estimate to start tracking</p>}
          </div>

          {/* Approved */}
          <div className="flex flex-col rounded-xl border border-white/[0.08] border-l-2 border-l-emerald-500 bg-gradient-to-r from-white/[0.05] to-white/[0.02] p-4">
            <div className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-xs font-medium text-slate-400">Approved</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-emerald-400">{approved}</p>
            {totalEstimates === 0 && <p className="mt-1 text-[11px] text-slate-600">Create your first estimate to start tracking</p>}
          </div>

          {/* Pending */}
          <div className="flex flex-col rounded-xl border border-white/[0.08] border-l-2 border-l-amber-500 bg-gradient-to-r from-white/[0.05] to-white/[0.02] p-4">
            <div className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs font-medium text-slate-400">Pending</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-amber-400">{pending}</p>
            {totalEstimates === 0 && <p className="mt-1 text-[11px] text-slate-600">Create your first estimate to start tracking</p>}
          </div>

          {/* Declined */}
          <div className="flex flex-col rounded-xl border border-white/[0.08] border-l-2 border-l-red-500 bg-gradient-to-r from-white/[0.05] to-white/[0.02] p-4">
            <div className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <p className="text-xs font-medium text-slate-400">Declined</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-red-400">{declined}</p>
            {totalEstimates === 0 && <p className="mt-1 text-[11px] text-slate-600">Create your first estimate to start tracking</p>}
          </div>

          {/* Revenue */}
          <div className="flex flex-col rounded-xl border border-white/[0.08] border-l-2 border-l-emerald-500 bg-gradient-to-r from-white/[0.05] to-white/[0.02] p-4">
            <div className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs font-medium text-slate-400">Revenue</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-white">${Math.round(totalRevenue).toLocaleString()}</p>
            {totalEstimates === 0 && <p className="mt-1 text-[11px] text-slate-600">Create your first estimate to start tracking</p>}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid gap-3 sm:grid-cols-3 animate-fade-in-up delay-200">
          {/* New Estimate */}
          <Link
            href="/estimate"
            className="card-hover group rounded-xl bg-white/[0.04] border border-white/[0.08] p-4 hover:border-white/15 hover:shadow-lg hover:shadow-white/5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06]">
              <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className="mt-3 text-sm font-semibold text-white">New Estimate</p>
            <p className="mt-0.5 text-xs text-slate-500">Create from scratch</p>
          </Link>

          {/* Use Template */}
          <Link
            href="/templates"
            className="card-hover group rounded-xl bg-white/[0.04] border border-white/[0.08] p-4 hover:border-white/15 hover:shadow-lg hover:shadow-white/5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06]">
              <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
            </div>
            <p className="mt-3 text-sm font-semibold text-white">
              {templateCount > 0 ? "Use Template" : "Templates"}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {templateCount > 0
                ? `${templateCount} template${templateCount !== 1 ? "s" : ""} available`
                : "Create your first template"}
            </p>
          </Link>

          {/* View Invoices */}
          <Link
            href="/invoices"
            className="card-hover group rounded-xl bg-white/[0.04] border border-white/[0.08] p-4 hover:border-white/15 hover:shadow-lg hover:shadow-white/5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06]">
              <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
              </svg>
            </div>
            <p className="mt-3 text-sm font-semibold text-white">View Invoices</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {invoices.length} invoice{invoices.length !== 1 ? "s" : ""} total
            </p>
          </Link>
        </div>

        {/* Upcoming This Week */}
        <div className="mt-6 rounded-xl bg-white/[0.04] border border-white/[0.08] p-4 animate-fade-in-up delay-250">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-sm font-semibold text-white">This Week</h3>
            </div>
            <Link
              href="/calendar"
              className="text-xs text-slate-400 transition-colors hover:text-white"
            >
              View Calendar
            </Link>
          </div>

          {/* Week bar */}
          <div className="mt-3 grid grid-cols-7 gap-1">
            {weekDays.map((day, i) => {
              const iso = toISO(day);
              const hasJob = weekJobDates.has(iso);
              const isToday = day.getTime() === today.getTime();
              const isPast = day < today;
              return (
                <div
                  key={i}
                  className={`flex flex-col items-center rounded-lg py-1.5 ${
                    isToday
                      ? "bg-white/[0.06] border border-white/[0.12]"
                      : "border border-transparent"
                  }`}
                >
                  <span className={`text-[10px] font-medium ${isToday ? "text-white" : isPast ? "text-slate-600" : "text-slate-500"}`}>
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
                  </span>
                  <span className={`text-xs font-semibold ${isToday ? "text-white" : isPast ? "text-slate-600" : "text-slate-300"}`}>
                    {day.getDate()}
                  </span>
                  <div className="mt-1 h-1.5 w-1.5 rounded-full">
                    {hasJob && (
                      <div className={`h-1.5 w-1.5 rounded-full ${isToday ? "bg-emerald-400" : "bg-emerald-400"}`} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Job list or empty state */}
          {upcomingJobs.length > 0 ? (
            <div className="mt-3 space-y-0.5 border-t border-white/[0.06] pt-3">
              {upcomingJobs.map((job) => {
                const jobDateObj = new Date(job.jobDate! + "T00:00:00");
                const dayLabel = jobDateObj.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                return (
                  <div
                    key={job.id}
                    onClick={() => router.push(`/estimates/${job.id}`)}
                    className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-white/[0.04] cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDot[job.status] || "bg-slate-400"}`} />
                      <span className="text-[11px] text-slate-500 shrink-0 w-[90px]">{dayLabel}</span>
                      <span className="truncate text-sm text-white">{job.customer.name || "Unnamed Customer"}</span>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-white">${job.total.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-3 border-t border-white/[0.06] pt-3 text-center">
              <p className="text-xs text-slate-500">No jobs scheduled this week</p>
              <Link href="/calendar" className="mt-1 inline-block text-xs text-slate-400 transition-colors hover:text-white">
                Open calendar
              </Link>
            </div>
          )}
        </div>

        {/* Onboarding + Needs Attention */}
        <div className="mt-8 space-y-6 animate-fade-in-up delay-300">
          {!onboardingDismissed && (
            completedSteps < onboardingSteps.length ? (
              /* Onboarding Checklist — in progress */
              <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] overflow-hidden">
                <div className="h-1 w-full bg-white/[0.04]">
                  <div
                    className="h-full bg-gradient-to-r from-white/60 to-white/40 animate-progress"
                    style={{ width: `${(completedSteps / onboardingSteps.length) * 100}%` }}
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">Getting Started</h3>
                    <span className="text-xs text-slate-500">{completedSteps}/{onboardingSteps.length}</span>
                  </div>
                  <div className="mt-4 space-y-1">
                    {onboardingSteps.map((step, i) => {
                      const inner = (
                        <div className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 ${
                          step.href && !step.done ? "hover:bg-white/[0.05] cursor-pointer" : ""
                        } ${step.done ? "opacity-60" : ""}`}>
                          <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all ${
                            step.done
                              ? "bg-emerald-500/20 border border-emerald-500/30"
                              : "border-2 border-white/[0.12]"
                          }`}>
                            {step.done && (
                              <svg className="h-3.5 w-3.5 text-emerald-400 animate-check" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span className={`flex-1 text-sm ${step.done ? "text-slate-500 line-through" : "text-slate-300"}`}>
                            {step.label}
                          </span>
                          {step.href && !step.done && (
                            <svg className="h-4 w-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </div>
                      );
                      return step.href ? (
                        <Link key={i} href={step.href} className="block">
                          {inner}
                        </Link>
                      ) : (
                        <div key={i}>{inner}</div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* Onboarding Complete — congratulations */
              <div className="rounded-xl bg-white/[0.04] border border-emerald-500/20 overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-emerald-400" />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/25">
                        <svg className="h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-emerald-400">All set! You&apos;re ready to go.</h3>
                        <p className="mt-0.5 text-xs text-slate-500">You&apos;ve completed all the getting started steps.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setOnboardingDismissed(true); localStorage.setItem("onboarding_dismissed", "true"); }}
                      className="shrink-0 text-slate-600 transition-colors hover:text-slate-400"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )
          )}

          {/* Needs Attention */}
          <div className="rounded-2xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-xl border border-white/[0.08] p-6">
            <div className="flex items-center gap-2.5">
              <h3 className="text-sm font-semibold text-white">Needs Attention</h3>
              {needsAttention.length > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500/15 border border-red-500/25 px-1.5 text-[10px] font-bold text-red-400">
                  {attentionItems.length}
                </span>
              )}
            </div>

            {needsAttention.length === 0 ? (
              <div className="mt-5 flex flex-col items-center py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/25">
                  <svg className="h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="mt-3 text-sm font-medium text-emerald-400">You&apos;re all caught up!</p>
                <p className="mt-0.5 text-xs text-slate-500">No items need your attention right now</p>
              </div>
            ) : (
              <div className="mt-4 space-y-2.5">
                {needsAttention.map((item) => {
                  const kindStyle: Record<string, { dot: string; badge: string; badgeLabel: string }> = {
                    overdue: { dot: "bg-red-400", badge: "bg-red-500/15 text-red-400 border-red-500/20", badgeLabel: "Overdue" },
                    awaiting: { dot: "bg-amber-400", badge: "bg-amber-500/15 text-amber-400 border-amber-500/20", badgeLabel: "Awaiting" },
                    ready: { dot: "bg-emerald-400", badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20", badgeLabel: "Ready" },
                    approaching: { dot: "bg-amber-400", badge: "bg-amber-500/15 text-amber-400 border-amber-500/20", badgeLabel: "Due Soon" },
                  };
                  const style = kindStyle[item.kind];
                  return (
                    <div
                      key={item.id}
                      className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3.5 transition-all hover:bg-white/[0.05]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${style.dot}`} />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{item.label}</p>
                            <p className="mt-0.5 text-xs text-slate-500">{item.context}</p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-semibold ${style.badge}`}>
                            {style.badgeLabel}
                          </span>
                          <span className="text-sm font-bold text-white">${item.amount.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="mt-2.5 flex items-center gap-2">
                        {item.kind === "awaiting" && (
                          <button
                            onClick={() => setSendModal({ type: "estimate", id: item.linkId })}
                            className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-400 transition-all hover:bg-amber-500/20"
                          >
                            Follow Up
                          </button>
                        )}
                        {item.kind === "ready" && (
                          <button
                            onClick={() => handleConvertToInvoice(item.linkId)}
                            disabled={convertingId === item.linkId}
                            className="rounded-lg bg-white/[0.06] border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition-all hover:bg-white/[0.1] disabled:opacity-50"
                          >
                            {convertingId === item.linkId ? "Creating..." : "Convert to Invoice"}
                          </button>
                        )}
                        {(item.kind === "overdue" || item.kind === "approaching") && (
                          <button
                            onClick={() => setSendModal({ type: "invoice", id: item.linkId })}
                            className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 transition-all hover:bg-red-500/20"
                          >
                            Send Reminder
                          </button>
                        )}
                        <button
                          onClick={() => router.push(item.linkType === "estimate" ? `/estimates/${item.linkId}` : `/invoice/${item.linkId}`)}
                          className="rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-1.5 text-xs font-medium text-slate-400 transition-all hover:bg-white/[0.08] hover:text-slate-300"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 mb-4 flex-shrink-0 animate-fade-in-up delay-500">
          <div className="flex items-center justify-center gap-4 border-t border-white/[0.06] pt-6">
            <a href="#" className="text-xs text-slate-600 transition-colors hover:text-slate-400">Help</a>
            <span className="text-slate-700">&middot;</span>
            <a href="#" className="text-xs text-slate-600 transition-colors hover:text-slate-400">Contact</a>
            <span className="text-slate-700">&middot;</span>
            <a href="#" className="text-xs text-slate-600 transition-colors hover:text-slate-400">Terms</a>
          </div>
        </footer>
      </div>
      {/* Send Modal */}
      {sendModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSendModal(null)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-[#12131A] border border-white/[0.1] p-6 shadow-2xl mx-4">
            <button
              type="button"
              onClick={() => setSendModal(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-lg font-bold text-white">Send {sendModalData.label}</h3>
            <p className="mt-1 text-sm text-slate-400">
              Share this {sendModalData.label.toLowerCase()} with {sendModalData.customer.name || "your customer"}.
            </p>
            <div className="mt-5 space-y-2.5">
              <button
                onClick={() => handleCopyLink(sendModalData.link, sendModalData.id)}
                className="flex w-full items-center gap-3 rounded-xl bg-white/[0.05] border border-white/[0.1] px-4 py-3 text-left transition-all hover:bg-white/[0.1]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
                  <svg className="h-4.5 w-4.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">
                    {copiedId === sendModalData.id ? "Copied!" : "Copy Link"}
                  </p>
                  <p className="text-xs text-slate-500">Copy shareable link to clipboard</p>
                </div>
              </button>

              {sendModalData.customer.phone && (
                <a
                  href={`sms:${sendModalData.customer.phone}?body=${encodeURIComponent(`Hi ${sendModalData.customer.name || ""}, here is your ${sendModalData.label.toLowerCase()} from ${sendModalData.profile?.businessName || "us"}: ${sendModalData.link}`.trim())}`}
                  className="flex w-full items-center gap-3 rounded-xl bg-white/[0.05] border border-white/[0.1] px-4 py-3 text-left transition-all hover:bg-white/[0.1]"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
                    <svg className="h-4.5 w-4.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">Send via Text</p>
                    <p className="text-xs text-slate-500 truncate">{sendModalData.customer.phone}</p>
                  </div>
                </a>
              )}

              {sendModalData.customer.email && (
                <a
                  href={`mailto:${sendModalData.customer.email}?subject=${encodeURIComponent(`${sendModalData.label} from ${sendModalData.profile?.businessName || "us"}`)}&body=${encodeURIComponent(`Hi ${sendModalData.customer.name || ""},\n\nPlease find your ${sendModalData.label.toLowerCase()} here: ${sendModalData.link}\n\nThank you!`)}`}
                  className="flex w-full items-center gap-3 rounded-xl bg-white/[0.05] border border-white/[0.1] px-4 py-3 text-left transition-all hover:bg-white/[0.1]"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
                    <svg className="h-4.5 w-4.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">Send via Email</p>
                    <p className="text-xs text-slate-500 truncate">{sendModalData.customer.email}</p>
                  </div>
                </a>
              )}
            </div>
            <button
              onClick={() => setSendModal(null)}
              className="mt-5 w-full rounded-xl bg-white/[0.06] border border-white/[0.08] py-2.5 text-sm font-medium text-slate-400 transition-all hover:bg-white/[0.1] hover:text-white"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
