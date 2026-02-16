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
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="px-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-200">
            <svg className="h-6 w-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-slate-800">Estimate not found</p>
          <p className="mt-1 text-sm text-slate-500">
            This link may be invalid or the estimate is no longer available.
          </p>
        </div>
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
      </div>
    );
  }

  const profile = estimate.profile;

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Navy header */}
      <div className="bg-[#1A365D]">
        <div className="mx-auto max-w-lg px-5 pb-16 pt-8">
          <div className="flex items-center gap-3.5">
            {profile?.logo && (
              <img
                src={profile.logo}
                alt="Logo"
                className="h-12 w-12 rounded-xl border-2 border-white/20 object-cover"
              />
            )}
            <div className="min-w-0">
              <p className="truncate text-lg font-bold text-white">
                {profile?.businessName}
              </p>
              <p className="truncate text-sm text-slate-300">
                {[profile?.phone, profile?.email].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main card */}
      <div className="mx-auto -mt-8 max-w-lg px-4 pb-10">
        <div className="overflow-hidden rounded-2xl bg-white shadow-lg shadow-slate-900/8 ring-1 ring-slate-200">
          <div className="flex items-center justify-between px-5 pt-5 pb-4">
            <div>
              <h1 className="text-xl font-bold text-slate-800">Estimate</h1>
              <p className="mt-0.5 text-sm text-slate-500">
                {estimate.estimateNumber} &middot; {estimate.date}
              </p>
            </div>
            {responded && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${
                  responded === "approved"
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                    : "bg-red-50 text-red-600 ring-1 ring-red-200"
                }`}
              >
                {responded === "approved" ? "Approved" : "Declined"}
              </span>
            )}
          </div>

          <div className="mx-5 border-t border-slate-100" />

          {(estimate.customer.name || estimate.customer.address) && (
            <div className="px-5 pt-4 pb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Prepared for
              </p>
              <div className="mt-2 space-y-0.5">
                {estimate.customer.name && (
                  <p className="text-sm font-semibold text-slate-800">{estimate.customer.name}</p>
                )}
                {estimate.customer.address && (
                  <p className="text-sm text-slate-600">{estimate.customer.address}</p>
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
            <div className="grid grid-cols-[1fr_3rem_5rem] gap-2 bg-slate-50 px-5 py-2.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Item</span>
              <span className="text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Qty</span>
              <span className="text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Amount</span>
            </div>

            {estimate.items.map((item, i) => {
              const qty = parseFloat(item.quantity) || 0;
              const price = parseFloat(item.price) || 0;
              const amount = qty * price;

              return (
                <div
                  key={item.id}
                  className={`grid grid-cols-[1fr_3rem_5rem] gap-2 px-5 py-3 ${
                    i % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                  } ${i < estimate.items.length - 1 ? "border-b border-slate-100" : ""}`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800">{item.description || "—"}</p>
                    <p className="text-xs text-slate-400">${price.toFixed(2)} ea.</p>
                  </div>
                  <span className="self-center text-right text-sm text-slate-600">{qty}</span>
                  <span className="self-center text-right text-sm font-semibold text-slate-800">${amount.toFixed(2)}</span>
                </div>
              );
            })}
          </div>

          <div className="mx-5 mt-2 mb-5 flex items-center justify-between rounded-xl bg-[#1A365D] px-5 py-4">
            <span className="text-sm font-medium text-slate-300">Total Due</span>
            <span className="text-2xl font-bold tracking-tight text-white">${estimate.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Approve / Decline */}
        {!responded ? (
          <div className="mt-5 space-y-3 px-1">
            <button
              type="button"
              onClick={() => handleResponse("approved")}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-4 text-base font-bold text-white shadow-md shadow-emerald-600/25 transition-all hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/30 active:scale-[0.98]"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Approve Estimate
            </button>
            <button
              type="button"
              onClick={() => handleResponse("declined")}
              className="w-full rounded-xl border border-slate-200 bg-white py-4 text-base font-semibold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-800 active:scale-[0.98]"
            >
              Decline
            </button>
            <p className="text-center text-xs text-slate-400">This estimate is valid for 30 days.</p>
          </div>
        ) : (
          <div className="mt-5 px-1">
            <div
              className={`rounded-xl p-6 text-center shadow-sm ${
                responded === "approved"
                  ? "bg-emerald-50 ring-1 ring-emerald-200"
                  : "bg-white ring-1 ring-slate-200"
              }`}
            >
              {responded === "approved" ? (
                <>
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                    <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-lg font-bold text-emerald-800">Estimate Approved</p>
                  <p className="mt-1 text-sm text-emerald-600">
                    Thank you! {profile?.businessName ? `${profile.businessName} has` : "We've"} been notified and will be in touch.
                  </p>
                </>
              ) : (
                <>
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                    <svg className="h-6 w-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <p className="text-lg font-bold text-slate-800">Estimate Declined</p>
                  <p className="mt-1 text-sm text-slate-500">No worries at all. Feel free to reach out if anything changes.</p>
                </>
              )}
            </div>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-slate-400">Powered by QuickEstimate</p>
      </div>
    </div>
  );
}
