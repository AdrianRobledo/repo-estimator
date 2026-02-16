"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import type { EstimateData } from "@/lib/types";

export default function ViewEstimatePage() {
  const params = useParams();
  const [estimate, setEstimate] = useState<EstimateData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [responded, setResponded] = useState<"approved" | "declined" | null>(null);

  useEffect(() => {
    fetch(`/api/estimates/${params.estimateId}/public`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => {
        setEstimate(data);
        if (data.status === "approved" || data.status === "declined") {
          setResponded(data.status as "approved" | "declined");
        }
      })
      .catch(() => setNotFound(true));
  }, [params.estimateId]);

  async function handleResponse(status: "approved" | "declined") {
    if (!estimate) return;
    await fetch(`/api/estimates/${estimate.id}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setResponded(status);
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F1A]">
        <div className="px-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.05]">
            <svg className="h-6 w-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-white">Estimate not found</p>
          <p className="mt-1 text-sm text-slate-500">
            This link may be invalid or the estimate is no longer available.
          </p>
        </div>
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F1A]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-indigo-500" />
      </div>
    );
  }

  const profile = estimate.profile;

  return (
    <div className="min-h-screen bg-[#0B0F1A]">
      {/* Gradient header */}
      <div className="bg-gradient-to-br from-[#0B0F1A] via-indigo-950 to-[#0B0F1A]">
        <div className="mx-auto max-w-lg px-5 pb-16 pt-8">
          <div className="flex items-center gap-3.5">
            {profile?.logo && (
              <img
                src={profile.logo}
                alt="Logo"
                className="h-12 w-12 rounded-xl border-2 border-white/[0.1] object-cover"
              />
            )}
            <div className="min-w-0">
              <p className="truncate text-lg font-bold text-white">
                {profile?.businessName}
              </p>
              <p className="truncate text-sm text-slate-400">
                {[profile?.phone, profile?.email].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main card */}
      <div className="mx-auto -mt-8 max-w-lg px-4 pb-10">
        <div className="overflow-hidden rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] shadow-lg shadow-black/20">
          <div className="flex items-center justify-between px-5 pt-5 pb-4">
            <div>
              <h1 className="text-xl font-bold text-white">Estimate</h1>
              <p className="mt-0.5 text-sm text-slate-500">
                {estimate.estimateNumber} &middot; {estimate.date}
              </p>
            </div>
            {responded && (
              <span className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${responded === "approved" ? "bg-emerald-400" : "bg-rose-400"}`} />
                <span className={`text-xs font-semibold ${responded === "approved" ? "text-emerald-400" : "text-rose-400"}`}>
                  {responded === "approved" ? "Approved" : "Declined"}
                </span>
              </span>
            )}
          </div>

          <div className="mx-5 border-t border-white/[0.08]" />

          {(estimate.customer.name || estimate.customer.address) && (
            <div className="px-5 pt-4 pb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Prepared for
              </p>
              <div className="mt-2 space-y-0.5">
                {estimate.customer.name && (
                  <p className="text-sm font-semibold text-white">{estimate.customer.name}</p>
                )}
                {estimate.customer.address && (
                  <p className="text-sm text-slate-400">{estimate.customer.address}</p>
                )}
                {(estimate.customer.phone || estimate.customer.email) && (
                  <p className="text-sm text-slate-500">
                    {[estimate.customer.phone, estimate.customer.email].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Line items */}
          <div className="mt-1">
            <div className="grid grid-cols-[1fr_3rem_5rem] gap-2 bg-white/[0.03] px-5 py-2.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Item</span>
              <span className="text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">Qty</span>
              <span className="text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">Amount</span>
            </div>

            {estimate.items.map((item, i) => {
              const qty = parseFloat(item.quantity) || 0;
              const price = parseFloat(item.price) || 0;
              const amount = qty * price;

              return (
                <div
                  key={item.id}
                  className={`grid grid-cols-[1fr_3rem_5rem] gap-2 px-5 py-3 ${
                    i % 2 === 0 ? "" : "bg-white/[0.02]"
                  } ${i < estimate.items.length - 1 ? "border-b border-white/[0.06]" : ""}`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">{item.description || "—"}</p>
                    <p className="text-xs text-slate-500">${price.toFixed(2)} ea.</p>
                  </div>
                  <span className="self-center text-right text-sm text-slate-400">{qty}</span>
                  <span className="self-center text-right text-sm font-semibold text-white">${amount.toFixed(2)}</span>
                </div>
              );
            })}
          </div>

          <div className="mx-5 mt-2 mb-5 flex items-center justify-between rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-5 py-4 shadow-lg shadow-indigo-500/20">
            <span className="text-sm font-medium text-indigo-200">Total Due</span>
            <span className="text-2xl font-bold tracking-tight text-white">${estimate.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Approve / Decline */}
        {!responded ? (
          <div className="mt-5 space-y-3 px-1">
            <button
              type="button"
              onClick={() => handleResponse("approved")}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-4 text-base font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-500 hover:shadow-xl hover:shadow-emerald-500/30 active:scale-[0.98]"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Approve Estimate
            </button>
            <button
              type="button"
              onClick={() => handleResponse("declined")}
              className="w-full rounded-xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] py-4 text-base font-semibold text-slate-400 transition-all hover:bg-white/[0.08] hover:text-white active:scale-[0.98]"
            >
              Decline
            </button>
            <p className="text-center text-xs text-slate-500">This estimate is valid for 30 days.</p>
          </div>
        ) : (
          <div className="mt-5 px-1">
            <div
              className={`rounded-2xl p-6 text-center backdrop-blur-xl border ${
                responded === "approved"
                  ? "bg-emerald-500/10 border-emerald-500/20"
                  : "bg-white/[0.05] border-white/[0.08]"
              }`}
            >
              {responded === "approved" ? (
                <>
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15">
                    <svg className="h-6 w-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-lg font-bold text-emerald-400">Estimate Approved</p>
                  <p className="mt-1 text-sm text-emerald-400/70">
                    Thank you! {profile?.businessName ? `${profile.businessName} has` : "We've"} been notified and will be in touch.
                  </p>
                </>
              ) : (
                <>
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.05]">
                    <svg className="h-6 w-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <p className="text-lg font-bold text-white">Estimate Declined</p>
                  <p className="mt-1 text-sm text-slate-500">No worries at all. Feel free to reach out if anything changes.</p>
                </>
              )}
            </div>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-slate-500">Powered by Preciso AI</p>
      </div>
    </div>
  );
}
