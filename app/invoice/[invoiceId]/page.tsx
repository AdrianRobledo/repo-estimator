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
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F1A]">
        <div className="px-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.05]">
            <svg className="h-6 w-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-white">Invoice not found</p>
          <p className="mt-1 text-sm text-slate-500">
            This link may be invalid or the invoice is no longer available.
          </p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F1A]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-indigo-500" />
      </div>
    );
  }

  const profile = invoice.profile;
  const isPaid = invoice.status === "paid" || justPaid;

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
              <p className="truncate text-lg font-bold text-white">{profile?.businessName}</p>
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
              <h1 className="text-xl font-bold text-white">Invoice</h1>
              <p className="mt-0.5 text-sm text-slate-500">
                {invoice.invoiceNumber} &middot; {invoice.date}
              </p>
            </div>
            <span className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${isPaid ? "bg-emerald-400" : "bg-amber-400"}`} />
              <span className={`text-xs font-semibold ${isPaid ? "text-emerald-400" : "text-amber-400"}`}>
                {isPaid ? "Paid" : "Unpaid"}
              </span>
            </span>
          </div>

          <div className="mx-5 border-t border-white/[0.08]" />

          <div className="grid grid-cols-2 gap-4 px-5 pt-4 pb-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Bill to</p>
              <div className="mt-2 space-y-0.5">
                {invoice.customer.name && (
                  <p className="text-sm font-semibold text-white">{invoice.customer.name}</p>
                )}
                {invoice.customer.address && (
                  <p className="text-sm text-slate-400">{invoice.customer.address}</p>
                )}
                {(invoice.customer.phone || invoice.customer.email) && (
                  <p className="text-sm text-slate-500">
                    {[invoice.customer.phone, invoice.customer.email].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Details</p>
              <div className="mt-2 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Due Date</span>
                  <span className="font-medium text-white">{formatDisplayDate(invoice.dueDate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Estimate</span>
                  <span className="font-medium text-white">{invoice.estimateNumber}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className="mt-1">
            <div className="grid grid-cols-[1fr_3rem_5rem] gap-2 bg-white/[0.03] px-5 py-2.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Item</span>
              <span className="text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">Qty</span>
              <span className="text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">Amount</span>
            </div>

            {invoice.items.map((item, i) => {
              const qty = parseFloat(item.quantity) || 0;
              const price = parseFloat(item.price) || 0;
              const amount = qty * price;

              return (
                <div
                  key={item.id}
                  className={`grid grid-cols-[1fr_3rem_5rem] gap-2 px-5 py-3 ${
                    i % 2 === 0 ? "" : "bg-white/[0.02]"
                  } ${i < invoice.items.length - 1 ? "border-b border-white/[0.06]" : ""}`}
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
            <span className="text-sm font-medium text-indigo-200">
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-4 text-base font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-500 hover:shadow-xl hover:shadow-emerald-500/30 active:scale-[0.98] disabled:opacity-50"
            >
              {payLoading ? "Redirecting..." : `Pay Now — $${invoice.total.toFixed(2)}`}
            </button>
          </div>
        )}

        {/* Status message */}
        <div className="mt-5 px-1">
          <div
            className={`rounded-2xl p-6 text-center backdrop-blur-xl border ${
              isPaid
                ? "bg-emerald-500/10 border-emerald-500/20"
                : "bg-white/[0.05] border-white/[0.08]"
            }`}
          >
            {isPaid ? (
              <>
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15">
                  <svg className="h-6 w-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-lg font-bold text-emerald-400">Payment Received</p>
                <p className="mt-1 text-sm text-emerald-400/70">
                  This invoice has been paid in full. Thank you!
                </p>
              </>
            ) : (
              <>
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15">
                  <svg className="h-6 w-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-lg font-bold text-white">Payment Due</p>
                <p className="mt-1 text-sm text-slate-500">
                  Please remit ${invoice.total.toFixed(2)} by {formatDisplayDate(invoice.dueDate)}.
                </p>
                {(profile?.phone || profile?.email) && (
                  <p className="mt-2 text-xs text-slate-500">
                    Questions? Contact {[profile?.phone, profile?.email].filter(Boolean).join(" or ")}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-slate-500">Powered by QuickEstimate</p>
      </div>
    </div>
  );
}
