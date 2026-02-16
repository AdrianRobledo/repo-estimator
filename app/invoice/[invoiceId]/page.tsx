"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import type { InvoiceData } from "@/lib/types";

function formatDisplayDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ViewInvoicePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [payLoading, setPayLoading] = useState(false);

  // Optimistic paid state when returning from Stripe
  const justPaid = searchParams.get("paid") === "true";

  useEffect(() => {
    fetch(`/api/invoices/${params.invoiceId}/public`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setInvoice)
      .catch(() => setNotFound(true));
  }, [params.invoiceId]);

  async function handlePay() {
    if (!invoice) return;
    setPayLoading(true);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId: invoice.id }),
    });
    if (res.ok) {
      const { url } = await res.json();
      if (url) window.location.href = url;
    }
    setPayLoading(false);
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
          <p className="text-lg font-semibold text-slate-800">Invoice not found</p>
          <p className="mt-1 text-sm text-slate-500">
            This link may be invalid or the invoice is no longer available.
          </p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
      </div>
    );
  }

  const profile = invoice.profile;
  const isPaid = invoice.status === "paid" || justPaid;

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
              <p className="truncate text-lg font-bold text-white">{profile?.businessName}</p>
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
              <h1 className="text-xl font-bold text-slate-800">Invoice</h1>
              <p className="mt-0.5 text-sm text-slate-500">
                {invoice.invoiceNumber} &middot; {invoice.date}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold tracking-wide ring-1 ${
                isPaid
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                  : "bg-amber-50 text-amber-700 ring-amber-200"
              }`}
            >
              {isPaid ? "Paid" : "Unpaid"}
            </span>
          </div>

          <div className="mx-5 border-t border-slate-100" />

          <div className="grid grid-cols-2 gap-4 px-5 pt-4 pb-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Bill to</p>
              <div className="mt-2 space-y-0.5">
                {invoice.customer.name && (
                  <p className="text-sm font-semibold text-slate-800">{invoice.customer.name}</p>
                )}
                {invoice.customer.address && (
                  <p className="text-sm text-slate-600">{invoice.customer.address}</p>
                )}
                {(invoice.customer.phone || invoice.customer.email) && (
                  <p className="text-sm text-slate-500">
                    {[invoice.customer.phone, invoice.customer.email].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Details</p>
              <div className="mt-2 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Due Date</span>
                  <span className="font-medium text-slate-800">{formatDisplayDate(invoice.dueDate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Estimate</span>
                  <span className="font-medium text-slate-800">{invoice.estimateNumber}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className="mt-1">
            <div className="grid grid-cols-[1fr_3rem_5rem] gap-2 bg-slate-50 px-5 py-2.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Item</span>
              <span className="text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Qty</span>
              <span className="text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Amount</span>
            </div>

            {invoice.items.map((item, i) => {
              const qty = parseFloat(item.quantity) || 0;
              const price = parseFloat(item.price) || 0;
              const amount = qty * price;

              return (
                <div
                  key={item.id}
                  className={`grid grid-cols-[1fr_3rem_5rem] gap-2 px-5 py-3 ${
                    i % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                  } ${i < invoice.items.length - 1 ? "border-b border-slate-100" : ""}`}
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
            <span className="text-sm font-medium text-slate-300">
              {isPaid ? "Amount Paid" : "Amount Due"}
            </span>
            <span className="text-2xl font-bold tracking-tight text-white">
              ${invoice.total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Pay Now button for unpaid invoices */}
        {!isPaid && (
          <div className="mt-5 px-1">
            <button
              type="button"
              onClick={handlePay}
              disabled={payLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-4 text-base font-bold text-white shadow-md shadow-emerald-600/25 transition-all hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/30 active:scale-[0.98] disabled:opacity-50"
            >
              {payLoading ? "Redirecting..." : `Pay Now — $${invoice.total.toFixed(2)}`}
            </button>
          </div>
        )}

        {/* Status message */}
        <div className="mt-5 px-1">
          <div
            className={`rounded-xl p-6 text-center shadow-sm ${
              isPaid
                ? "bg-emerald-50 ring-1 ring-emerald-200"
                : "bg-white ring-1 ring-slate-200"
            }`}
          >
            {isPaid ? (
              <>
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                  <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-lg font-bold text-emerald-800">Payment Received</p>
                <p className="mt-1 text-sm text-emerald-600">
                  This invoice has been paid in full. Thank you!
                </p>
              </>
            ) : (
              <>
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                  <svg className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-lg font-bold text-slate-800">Payment Due</p>
                <p className="mt-1 text-sm text-slate-500">
                  Please remit ${invoice.total.toFixed(2)} by {formatDisplayDate(invoice.dueDate)}.
                </p>
                {(profile?.phone || profile?.email) && (
                  <p className="mt-2 text-xs text-slate-400">
                    Questions? Contact {[profile?.phone, profile?.email].filter(Boolean).join(" or ")}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">Powered by QuickEstimate</p>
      </div>
    </div>
  );
}
