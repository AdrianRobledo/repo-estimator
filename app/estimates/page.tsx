"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/app/components/AppShell";
import type { EstimateData } from "@/lib/types";

const tabs = ["all", "draft", "sent", "approved", "declined"] as const;
type Tab = (typeof tabs)[number];

const tabLabels: Record<Tab, string> = {
  all: "All",
  draft: "Drafts",
  sent: "Sent",
  approved: "Approved",
  declined: "Declined",
};

const statusBadge: Record<string, string> = {
  draft: "bg-slate-500/15 text-slate-400 border-slate-500/20",
  sent: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  approved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  declined: "bg-red-500/15 text-red-400 border-red-500/20",
};

type SortKey = "newest" | "oldest" | "highest" | "lowest";

const sortLabels: Record<SortKey, string> = {
  newest: "Newest",
  oldest: "Oldest",
  highest: "Highest Amount",
  lowest: "Lowest Amount",
};

/** Parses both "February 17, 2026" and "2026-02-17" into a short display date */
function formatDate(dateStr: string) {
  // ISO format like "2026-02-17"
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
  // Human-readable format like "February 17, 2026" — re-format to short
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
  return dateStr;
}

/** Get a sortable timestamp from the stored date string */
function dateToTime(dateStr: string): number {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr + "T00:00:00").getTime();
  }
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

export default function EstimatesPage() {
  const router = useRouter();
  const [estimates, setEstimates] = useState<EstimateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [convertingId, setConvertingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/estimates")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setEstimates(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

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
        setConvertingId(null);
      }
    } catch {
      setConvertingId(null);
    }
  }

  const results = useMemo(() => {
    let list = tab === "all" ? estimates : estimates.filter((e) => e.status === tab);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          (e.customer.name || "").toLowerCase().includes(q) ||
          e.estimateNumber.toLowerCase().includes(q)
      );
    }

    list = [...list].sort((a, b) => {
      switch (sort) {
        case "oldest":
          return dateToTime(a.date) - dateToTime(b.date);
        case "highest":
          return b.total - a.total;
        case "lowest":
          return a.total - b.total;
        default:
          return dateToTime(b.date) - dateToTime(a.date);
      }
    });

    return list;
  }, [estimates, tab, search, sort]);

  const selectChevron = `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`;

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
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Estimates</h1>
            <p className="mt-1 text-sm text-slate-500">
              {estimates.length} estimate{estimates.length !== 1 ? "s" : ""} total
            </p>
          </div>
          <Link
            href="/estimate"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-500"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Estimate
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="mt-6 flex gap-1.5 overflow-x-auto">
          {tabs.map((t) => {
            const count =
              t === "all"
                ? estimates.length
                : estimates.filter((e) => e.status === t).length;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  tab === t
                    ? "bg-white/[0.1] text-white border border-white/20"
                    : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-300 border border-transparent"
                }`}
              >
                {tabLabels[t]}
                <span className="ml-1.5 text-[10px] opacity-60">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Search + Sort */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer or estimate number..."
              className="block w-full rounded-xl bg-white/[0.05] border border-white/[0.1] pl-10 pr-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="shrink-0 rounded-xl bg-white/[0.05] border border-white/[0.1] px-3 py-2.5 text-sm text-slate-400 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10 appearance-none"
            style={{ backgroundImage: selectChevron, backgroundPosition: "right 0.6rem center", backgroundRepeat: "no-repeat", backgroundSize: "1.2em 1.2em", paddingRight: "2.2rem" }}
          >
            {(Object.entries(sortLabels) as [SortKey, string][]).map(([key, label]) => (
              <option key={key} value={key} className="bg-[#0A0A0F] text-white">
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Content */}
        {results.length === 0 ? (
          <div className="mt-8 rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-12 text-center">
            <svg className="mx-auto h-10 w-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-3 text-sm text-slate-500">
              {search
                ? "No estimates match your search"
                : tab === "all"
                  ? "No estimates yet"
                  : `No ${tabLabels[tab].toLowerCase()} estimates`}
            </p>
            {tab === "all" && !search && (
              <Link
                href="/estimate"
                className="mt-3 inline-block text-sm font-medium text-slate-300 transition-colors hover:text-white"
              >
                Create your first estimate
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table — hidden below md */}
            <div className="mt-6 hidden md:block rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Customer</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Estimate #</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Job Date</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Items</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Total</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="w-0 px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((est, i) => (
                    <tr
                      key={est.id}
                      onClick={() => router.push(`/estimates/${est.id}`)}
                      className={`group cursor-pointer transition-all duration-150 hover:bg-white/[0.05] ${
                        i < results.length - 1 ? "border-b border-white/[0.04]" : ""
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold truncate max-w-[180px] ${est.customer.name ? "text-white" : "italic text-slate-500"}`}>
                            {est.customer.name || "Unnamed Customer"}
                          </span>
                          <svg className="h-4 w-4 shrink-0 text-slate-600 opacity-0 transition-opacity group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-sm text-slate-400">{est.estimateNumber}</td>
                      <td className="px-3 py-3.5 text-sm text-slate-400">{formatDate(est.date)}</td>
                      <td className="px-3 py-3.5 text-sm text-slate-500">
                        {est.jobDate ? formatDate(est.jobDate) : "\u2014"}
                      </td>
                      <td className="px-3 py-3.5 text-sm text-slate-500">
                        {est.items.length} item{est.items.length !== 1 ? "s" : ""}
                      </td>
                      <td className="px-3 py-3.5 text-right text-sm font-semibold text-white">
                        ${est.total.toFixed(2)}
                      </td>
                      <td className="px-3 py-3.5 text-right">
                        <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${statusBadge[est.status] || statusBadge.draft}`}>
                          {est.status.charAt(0).toUpperCase() + est.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {est.status === "approved" && !est.invoiceId && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleConvertToInvoice(est.id); }}
                            disabled={convertingId === est.id}
                            className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-medium text-emerald-400 transition-all hover:bg-emerald-500/20 disabled:opacity-50 opacity-0 group-hover:opacity-100"
                          >
                            {convertingId === est.id ? "Creating..." : "Convert to Invoice"}
                          </button>
                        )}
                        {est.status === "approved" && est.invoiceId && (
                          <Link
                            href={`/invoice/${est.invoiceId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded-lg bg-white/[0.06] border border-white/10 px-2.5 py-1 text-[11px] font-medium text-slate-300 transition-all hover:bg-white/[0.1]"
                          >
                            {est.invoiceNumber || "Invoiced"}
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards — visible below md */}
            <div className="mt-6 space-y-3 md:hidden">
              {results.map((est) => (
                <div
                  key={est.id}
                  onClick={() => router.push(`/estimates/${est.id}`)}
                  className="group cursor-pointer rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] p-4 transition-all duration-200 hover:bg-white/[0.06] hover:border-white/[0.12]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate ${est.customer.name ? "text-white" : "italic text-slate-500"}`}>
                        {est.customer.name || "Unnamed Customer"}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatDate(est.date)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2.5">
                      <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${statusBadge[est.status] || statusBadge.draft}`}>
                        {est.status.charAt(0).toUpperCase() + est.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-slate-500">{est.estimateNumber}</span>
                    <span className="text-sm font-bold text-white">${est.total.toFixed(2)}</span>
                  </div>
                  {est.status === "approved" && (
                    <div className="mt-2.5 flex items-center gap-2">
                      {!est.invoiceId ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleConvertToInvoice(est.id); }}
                          disabled={convertingId === est.id}
                          className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-all hover:bg-emerald-500/20 disabled:opacity-50"
                        >
                          {convertingId === est.id ? "Creating..." : "Convert to Invoice"}
                        </button>
                      ) : (
                        <Link
                          href={`/invoice/${est.invoiceId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded-lg bg-white/[0.06] border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition-all hover:bg-white/[0.1]"
                        >
                          {est.invoiceNumber || "Invoiced"}
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
