"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import type { InvoiceData } from "@/lib/types";
import { formatDisplayDate } from "@/lib/format";

export default function ViewInvoicePage() {
  const params = useParams();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [notFound, setNotFound] = useState(false);


  useEffect(() => {
    fetch(`/api/invoices/${params.invoiceId}/public`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setInvoice)
      .catch(() => setNotFound(true));
  }, [params.invoiceId]);

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="px-6 text-center">
          <p className="text-lg font-semibold text-gray-800">Invoice not found</p>
          <p className="mt-1 text-sm text-gray-500">
            This link may be invalid or the invoice is no longer available.
          </p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-gray-600" />
      </div>
    );
  }

  const profile = invoice.profile;
  const isPaid = invoice.status === "paid";

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        {/* Document card */}
        <div className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-gray-200">
          {/* Business header */}
          <div className="border-b border-gray-200 px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
              <div className="text-sm text-gray-500 sm:text-right">
                {profile?.address && <p>{profile.address}</p>}
                {profile?.phone && <p>{profile.phone}</p>}
                {profile?.email && <p>{profile.email}</p>}
              </div>
            </div>
          </div>

          {/* INVOICE title row */}
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 sm:px-8">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                INVOICE
              </h1>
              <div className="text-right">
                <p className="text-sm text-gray-500">{invoice.invoiceNumber}</p>
                <p className="text-sm text-gray-500">{invoice.date}</p>
              </div>
            </div>
          </div>

          {/* Bill To + Details */}
          <div className="border-b border-gray-200 px-6 py-5 sm:px-8">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Bill To
                </p>
                <div className="mt-2">
                  {invoice.customer.name && (
                    <p className="text-base font-semibold text-gray-900">
                      {invoice.customer.name}
                    </p>
                  )}
                  {invoice.customer.address && (
                    <p className="text-sm text-gray-600">
                      {invoice.customer.address}
                    </p>
                  )}
                  {invoice.customer.phone && (
                    <p className="mt-1 text-sm text-gray-500">{invoice.customer.phone}</p>
                  )}
                  {invoice.customer.email && (
                    <p className="text-sm text-gray-500">{invoice.customer.email}</p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Details
                </p>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Due Date</span>
                    <span className="font-medium text-gray-900">
                      {formatDisplayDate(invoice.dueDate)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Estimate Ref</span>
                    <span className="font-medium text-gray-900">
                      {invoice.estimateNumber}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Status</span>
                    <span
                      className={`font-semibold ${isPaid ? "text-green-600" : "text-amber-600"}`}
                    >
                      {isPaid ? "Paid" : "Unpaid"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Line items — mobile cards */}
          <div className="px-6 sm:hidden">
            <div className="divide-y divide-gray-100">
              {invoice.items.map((item) => {
                const qty = parseFloat(item.quantity) || 0;
                const price = parseFloat(item.price) || 0;
                const amount = qty * price;
                return (
                  <div key={item.id} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800">{item.description || "\u2014"}</p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {qty} \u00D7 ${price.toFixed(2)}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-medium text-gray-900">
                      ${amount.toFixed(2)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Line items — desktop table */}
          <div className="px-6 sm:px-8">
            <table className="hidden w-full sm:table">
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
                {invoice.items.map((item, i) => {
                  const qty = parseFloat(item.quantity) || 0;
                  const price = parseFloat(item.price) || 0;
                  const amount = qty * price;
                  return (
                    <tr
                      key={item.id}
                      className={
                        i < invoice.items.length - 1
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
              {isPaid ? "Amount Paid" : "Amount Due"}
            </span>
            <span className="text-2xl font-bold text-gray-900">
              ${invoice.total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Payment status area */}
        {isPaid ? (
          <div className="mt-6">
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
              <p className="text-lg font-bold text-green-800">Payment Received</p>
              <p className="mt-1 text-sm text-green-700">
                This invoice has been paid in full. Thank you!
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
              <p className="text-sm font-semibold text-gray-800">
                To pay this invoice, contact {profile?.businessName || "the business"}:
              </p>
              <div className="mt-3 flex flex-col items-center gap-1.5">
                {profile?.phone && (
                  <a
                    href={`tel:${profile.phone}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {profile.phone}
                  </a>
                )}
                {profile?.email && (
                  <a
                    href={`mailto:${profile.email}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {profile.email}
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Payment due footer message */}
        <div className="mt-6 text-center">
          {!isPaid && (
            <div className="text-sm text-gray-500">
              <p>Payment is due by {formatDisplayDate(invoice.dueDate)}.</p>
              {(profile?.phone || profile?.email) && (
                <p className="mt-1">
                  For payment questions, contact{" "}
                  {profile?.phone && <span>{profile.phone}</span>}
                  {profile?.phone && profile?.email && <br className="sm:hidden" />}
                  {profile?.phone && profile?.email && <span className="hidden sm:inline"> or </span>}
                  {profile?.email && <span>{profile.email}</span>}.
                </p>
              )}
            </div>
          )}
          <p className="mt-2 text-xs text-gray-300">Powered by Preciso</p>
        </div>
      </div>
    </div>
  );
}
