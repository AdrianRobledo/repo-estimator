"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/app/components/AppShell";
import type { EstimateData } from "@/lib/types";

// ── Date helpers (no libraries) ──

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getWeekDays(anchor: Date): Date[] {
  const mon = getMonday(anchor);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
}

function getMonthGrid(anchor: Date): Date[][] {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startMonday = getMonday(firstDay);
  const weeks: Date[][] = [];
  const cursor = new Date(startMonday);
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
    // Stop if we've moved past the current month and filled at least 4 weeks
    if (cursor.getMonth() !== month && w >= 3) break;
  }
  return weeks;
}

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isToday(d: Date, todayStr: string): boolean {
  return toISO(d) === todayStr;
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  draft: { bg: "bg-slate-500/15", border: "border-slate-500/25", text: "text-slate-400", dot: "bg-slate-400" },
  sent: { bg: "bg-amber-500/15", border: "border-amber-500/25", text: "text-amber-400", dot: "bg-amber-400" },
  approved: { bg: "bg-emerald-500/15", border: "border-emerald-500/25", text: "text-emerald-400", dot: "bg-emerald-400" },
};

function getStatusColors(status: string) {
  return STATUS_COLORS[status] || STATUS_COLORS.draft;
}

export default function CalendarPage() {
  const router = useRouter();
  const [estimates, setEstimates] = useState<EstimateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"week" | "month">("week");
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [todayStr, setTodayStr] = useState("");
  const [hoveredEstimate, setHoveredEstimate] = useState<{ est: EstimateData; rect: DOMRect } | null>(null);

  useEffect(() => {
    setCurrentDate(new Date());
    setTodayStr(toISO(new Date()));
    fetch("/api/estimates")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setEstimates(data.filter((e: EstimateData) => e.jobDate));
        setLoading(false);
      });
  }, []);

  // Filter estimates by job date
  function getEstimatesForDate(dateStr: string) {
    return estimates.filter((e) => e.jobDate === dateStr);
  }

  // Navigation
  function goToday() {
    setCurrentDate(new Date());
  }
  function goPrev() {
    const d = new Date(currentDate!);
    if (view === "week") d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  }
  function goNext() {
    const d = new Date(currentDate!);
    if (view === "week") d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  }

  function handleCardHover(est: EstimateData, e: React.MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setHoveredEstimate({ est, rect });
  }

  if (loading || !currentDate) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-white" />
        </div>
      </AppShell>
    );
  }

  const weekDays = getWeekDays(currentDate);
  const monthGrid = getMonthGrid(currentDate);

  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];
  const formatShort = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const weekLabel =
    weekStart.getFullYear() === weekEnd.getFullYear()
      ? `${formatShort(weekStart)} - ${formatShort(weekEnd)}, ${weekEnd.getFullYear()}`
      : `${formatShort(weekStart)}, ${weekStart.getFullYear()} - ${formatShort(weekEnd)}, ${weekEnd.getFullYear()}`;
  const monthLabel = `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 min-h-screen">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-white">Calendar</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={goToday}
              className="rounded-lg bg-white/[0.06] border border-white/[0.1] px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/[0.1] hover:text-white"
            >
              Today
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={goPrev}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={goNext}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <span className="min-w-[180px] text-center text-sm font-medium text-white">
              {view === "week" ? weekLabel : monthLabel}
            </span>
            <div className="ml-2 flex rounded-lg bg-white/[0.06] border border-white/[0.1] p-0.5">
              <button
                onClick={() => setView("week")}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                  view === "week"
                    ? "bg-white/[0.15] text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setView("month")}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                  view === "month"
                    ? "bg-white/[0.15] text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Month
              </button>
            </div>
          </div>
        </div>

        {/* Week View */}
        {view === "week" && (
          <div className="mt-6 grid grid-cols-7 gap-px rounded-xl bg-white/[0.06] border border-white/[0.08] overflow-hidden">
            {weekDays.map((day, i) => {
              const dateStr = toISO(day);
              const dayEstimates = getEstimatesForDate(dateStr);
              const today = isToday(day, todayStr);

              return (
                <div
                  key={i}
                  className={`flex min-h-[320px] flex-col bg-[#0A0A0F] transition-colors ${
                    today ? "border-t-2 border-t-white/30 bg-white/[0.03]" : ""
                  }`}
                >
                  {/* Day header */}
                  <div className={`px-2 py-2 text-center border-b border-white/[0.06] ${today ? "bg-white/[0.06]" : ""}`}>
                    <p className={`text-[11px] font-medium ${today ? "text-white" : "text-slate-500"}`}>
                      {DAY_NAMES[i]}
                    </p>
                    <p className={`text-lg font-bold ${today ? "text-white" : "text-white"}`}>
                      {day.getDate()}
                    </p>
                  </div>

                  {/* Day content */}
                  <div className="flex-1 p-1.5 space-y-1">
                    {dayEstimates.map((est) => {
                      const sc = getStatusColors(est.status);
                      return (
                        <div
                          key={est.id}
                          onClick={() => router.push(`/view/${est.id}`)}
                          onMouseEnter={(e) => handleCardHover(est, e)}
                          onMouseLeave={() => setHoveredEstimate(null)}
                          className={`cursor-pointer rounded-lg ${sc.bg} border ${sc.border} px-2 py-1.5 transition-all hover:scale-[1.02] hover:shadow-lg`}
                        >
                          <p className="truncate text-xs font-medium text-white">
                            {est.customer.name || "Unnamed"}
                          </p>
                          <p className={`text-[11px] ${sc.text}`}>
                            ${est.total.toFixed(2)}
                          </p>
                        </div>
                      );
                    })}
                    {dayEstimates.length === 0 && (
                      <Link
                        href={`/estimate?jobDate=${dateStr}`}
                        className="flex h-full min-h-[60px] items-center justify-center rounded-lg transition-all hover:bg-white/[0.03]"
                      >
                        <svg className="h-5 w-5 text-slate-700 opacity-0 transition-opacity group-hover:opacity-100 hover:!opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ opacity: undefined }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                        </svg>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Month View */}
        {view === "month" && (
          <div className="mt-6 rounded-xl bg-white/[0.06] border border-white/[0.08] overflow-hidden">
            {/* Day name headers */}
            <div className="grid grid-cols-7 border-b border-white/[0.06]">
              {DAY_NAMES.map((name) => (
                <div key={name} className="px-2 py-2 text-center">
                  <p className="text-[11px] font-medium text-slate-500">{name}</p>
                </div>
              ))}
            </div>

            {/* Month grid */}
            {monthGrid.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 border-b border-white/[0.06] last:border-b-0">
                {week.map((day, di) => {
                  const dateStr = toISO(day);
                  const dayEstimates = getEstimatesForDate(dateStr);
                  const today = isToday(day, todayStr);
                  const isCurrentMonth = day.getMonth() === currentDate.getMonth();

                  return (
                    <div
                      key={di}
                      onClick={() => {
                        if (dayEstimates.length > 0) {
                          setCurrentDate(day);
                          setView("week");
                        } else {
                          router.push(`/estimate?jobDate=${dateStr}`);
                        }
                      }}
                      className={`min-h-[80px] cursor-pointer border-r border-white/[0.04] last:border-r-0 p-1.5 transition-colors hover:bg-white/[0.03] ${
                        !isCurrentMonth ? "opacity-40" : ""
                      } ${today ? "bg-white/[0.04]" : "bg-[#0A0A0F]"}`}
                    >
                      <p className={`text-xs font-medium ${today ? "text-white" : "text-slate-400"}`}>
                        {day.getDate()}
                      </p>
                      <div className="mt-1 space-y-0.5">
                        {dayEstimates.slice(0, 3).map((est) => {
                          const sc = getStatusColors(est.status);
                          return (
                            <div
                              key={est.id}
                              className={`h-1.5 rounded-full ${sc.dot}`}
                              title={`${est.customer.name || "Unnamed"} — $${est.total.toFixed(2)}`}
                            />
                          );
                        })}
                        {dayEstimates.length > 3 && (
                          <p className="text-[10px] text-slate-500">+{dayEstimates.length - 3} more</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {estimates.length === 0 && !loading && (
          <div className="mt-12 text-center">
            <svg className="mx-auto h-12 w-12 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-3 text-sm text-slate-400">No jobs scheduled yet</p>
            <p className="mt-1 text-xs text-slate-600">Add a job date when creating an estimate to see it here</p>
            <Link
              href="/estimate"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-500"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Estimate
            </Link>
          </div>
        )}
      </div>

      {/* Hover Tooltip */}
      {hoveredEstimate && (
        <div
          className="pointer-events-none fixed z-50"
          style={{
            left: hoveredEstimate.rect.left + hoveredEstimate.rect.width / 2,
            top: hoveredEstimate.rect.top - 8,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="rounded-xl bg-[#1a1f2e] border border-white/[0.12] px-4 py-3 shadow-2xl min-w-[200px]">
            <p className="text-sm font-semibold text-white">
              {hoveredEstimate.est.customer.name || "Unnamed"}
            </p>
            <div className="mt-1.5 space-y-0.5">
              <p className="text-xs text-slate-400">
                {hoveredEstimate.est.estimateNumber}
              </p>
              <p className="text-xs text-slate-400">
                Status:{" "}
                <span className={getStatusColors(hoveredEstimate.est.status).text}>
                  {hoveredEstimate.est.status.charAt(0).toUpperCase() + hoveredEstimate.est.status.slice(1)}
                </span>
              </p>
              <p className="text-xs text-white font-medium">
                ${hoveredEstimate.est.total.toFixed(2)}
              </p>
              {hoveredEstimate.est.customer.phone && (
                <p className="text-xs text-slate-500">
                  {hoveredEstimate.est.customer.phone}
                </p>
              )}
            </div>
          </div>
          {/* Arrow */}
          <div className="mx-auto h-2 w-2 -translate-y-px rotate-45 bg-[#1a1f2e] border-r border-b border-white/[0.12]" />
        </div>
      )}
    </AppShell>
  );
}
