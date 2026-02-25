"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import type { EstimateData } from "@/lib/types";

export default function ViewEstimatePage() {
  const params = useParams();
  const [estimate, setEstimate] = useState<EstimateData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [responded, setResponded] = useState<"approved" | "declined" | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    if (!estimate || submitting) return;
    setSubmitting(true);
    await fetch(`/api/estimates/${estimate.id}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setResponded(status);
    setSubmitting(false);
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="px-6 text-center">
          <p className="text-lg font-semibold text-gray-800">Estimate not found</p>
          <p className="mt-1 text-sm text-gray-500">
            This link may be invalid or the estimate is no longer available.
          </p>
        </div>
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-gray-600" />
      </div>
    );
  }

  const profile = estimate.profile;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        {/* Document card */}
        <div className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-gray-200">

          {/* Business header */}
          <div className="border-b border-gray-200 px-6 py-6 sm:px-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {profile?.logo && (
                  <img
                    src={profile.logo}
                    alt={profile.businessName || "Logo"}
                    className="h-14 w-14 rounded-lg object-cover"
                  />
                )}
                <div>
                  <p className="text-xl font-bold text-gray-900">
                    {profile?.businessName}
                  </p>
                  {profile?.ownerName && (
                    <p className="text-sm text-gray-500">{profile.ownerName}</p>
                  )}
                </div>
              </div>
              <div className="text-right text-sm text-gray-500">
                {profile?.address && <p>{profile.address}</p>}
                {profile?.phone && <p>{profile.phone}</p>}
                {profile?.email && <p>{profile.email}</p>}
              </div>
            </div>
          </div>

          {/* ESTIMATE title row */}
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 sm:px-8">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                ESTIMATE
              </h1>
              <div className="text-right">
                <p className="text-sm text-gray-500">
                  {estimate.estimateNumber}
                </p>
                <p className="text-sm text-gray-500">{estimate.date}</p>
              </div>
            </div>
          </div>

          {/* Prepared For */}
          {(estimate.customer.name || estimate.customer.address) && (
            <div className="border-b border-gray-200 px-6 py-5 sm:px-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Prepared For
              </p>
              <div className="mt-2">
                {estimate.customer.name && (
                  <p className="text-base font-semibold text-gray-900">
                    {estimate.customer.name}
                  </p>
                )}
                {estimate.customer.address && (
                  <p className="text-sm text-gray-600">
                    {estimate.customer.address}
                  </p>
                )}
                {(estimate.customer.phone || estimate.customer.email) && (
                  <p className="mt-1 text-sm text-gray-500">
                    {[estimate.customer.phone, estimate.customer.email]
                      .filter(Boolean)
                      .join(" \u00B7 ")}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Line items table */}
          <div className="px-6 sm:px-8">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="py-3 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Description
                  </th>
                  <th className="w-16 py-3 px-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Qty
                  </th>
                  <th className="w-24 py-3 px-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Price
                  </th>
                  <th className="w-24 py-3 pl-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {estimate.items.map((item, i) => {
                  const qty = parseFloat(item.quantity) || 0;
                  const price = parseFloat(item.price) || 0;
                  const amount = qty * price;
                  return (
                    <tr
                      key={item.id}
                      className={
                        i < estimate.items.length - 1
                          ? "border-b border-gray-100"
                          : ""
                      }
                    >
                      <td className="py-3 pr-3 text-sm text-gray-800">
                        {item.description || "\u2014"}
                      </td>
                      <td className="py-3 px-2 text-right text-sm text-gray-600">
                        {qty}
                      </td>
                      <td className="py-3 px-2 text-right text-sm text-gray-600">
                        ${price.toFixed(2)}
                      </td>
                      <td className="py-3 pl-2 text-right text-sm font-medium text-gray-900">
                        ${amount.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="border-t-2 border-gray-900 mx-6 sm:mx-8" />
          <div className="flex items-center justify-between px-6 py-5 sm:px-8">
            <span className="text-base font-semibold text-gray-700">
              Total Due
            </span>
            <span className="text-2xl font-bold text-gray-900">
              ${estimate.total.toFixed(2)}
            </span>
          </div>

          {/* Estimate valid note */}
          {!responded && (
            <div className="border-t border-gray-100 px-6 py-3 sm:px-8">
              <p className="text-center text-xs text-gray-400">
                This estimate is valid for 30 days from the date of issue.
              </p>
            </div>
          )}
        </div>

        {/* Action area — below the document card */}
        {!responded ? (
          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={() => handleResponse("approved")}
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 py-3.5 text-base font-semibold text-white transition-colors hover:bg-green-700 active:bg-green-800 disabled:opacity-60"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Approve Estimate
            </button>
            <button
              type="button"
              onClick={() => handleResponse("declined")}
              disabled={submitting}
              className="w-full rounded-lg border border-gray-300 bg-white py-3.5 text-base font-semibold text-gray-600 transition-colors hover:bg-gray-50 active:bg-gray-100 disabled:opacity-60"
            >
              Decline
            </button>
          </div>
        ) : (
          <div className="mt-6">
            {responded === "approved" ? (
              <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <svg
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p className="text-lg font-bold text-green-800">
                  Estimate Approved!
                </p>
                <p className="mt-1 text-sm text-green-700">
                  {profile?.businessName || "The contractor"} has been notified
                  and will be in touch to schedule your work.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                  <svg
                    className="h-6 w-6 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <p className="text-lg font-bold text-gray-800">
                  Estimate Declined
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {profile?.businessName || "The contractor"} has been notified.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          {(profile?.phone || profile?.email) && (
            <p className="text-xs text-gray-400">
              Questions? Contact{" "}
              {[profile?.phone, profile?.email].filter(Boolean).join(" or ")}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-300">Powered by Preciso</p>
        </div>
      </div>
    </div>
  );
}
