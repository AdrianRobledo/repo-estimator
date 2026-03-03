"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { jsPDF } from "jspdf";
import AppShell from "@/app/components/AppShell";
import SendModal from "@/app/components/SendModal";
import type { EstimateData, LineItem } from "@/lib/types";
import { formatDate, estimateStatusBadge } from "@/lib/format";

interface EstimateDetail extends EstimateData {
  createdAt: string;
  updatedAt: string;
}

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function EstimateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [estimate, setEstimate] = useState<EstimateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);

  useEffect(() => {
    fetch(`/api/estimates/${params.estimateId}`)
      .then((r) => {
        if (r.status === 401) { router.push("/"); throw new Error("unauth"); }
        if (!r.ok) { router.push("/estimates"); throw new Error("notfound"); }
        return r.json();
      })
      .then((data) => { setEstimate(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.estimateId, router]);

  async function handleSendAndShow() {
    if (!estimate || acting) return;
    setActing(true);
    try {
      const res = await fetch(`/api/estimates/${estimate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "sent" }),
      });
      if (res.ok) {
        setEstimate({ ...estimate, status: "sent" });
        setShowSendModal(true);
      }
    } finally {
      setActing(false);
    }
  }

  async function handleDelete() {
    if (!estimate || acting) return;
    setActing(true);
    try {
      const res = await fetch(`/api/estimates/${estimate.id}`, { method: "DELETE" });
      if (res.ok) router.push("/estimates");
    } finally {
      setActing(false);
    }
  }

  async function handleConvertToInvoice() {
    if (!estimate || acting) return;
    setActing(true);
    setError(null);
    try {
      const now = new Date();
      const y = now.getFullYear().toString().slice(-2);
      const m = String(now.getMonth() + 1).padStart(2, "0");
      const d = String(now.getDate()).padStart(2, "0");
      const rand = Math.floor(Math.random() * 900 + 100);
      const invoiceNumber = `INV-${y}${m}${d}-${rand}`;
      const date = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      const due = new Date(now);
      due.setDate(due.getDate() + 30);
      const dueDate = `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, "0")}-${String(due.getDate()).padStart(2, "0")}`;

      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estimateId: estimate.id,
          invoiceNumber,
          date,
          dueDate,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/invoice/${data.id}`);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error === "Already invoiced" ? "This estimate has already been converted to an invoice." : errData.error || "Failed to create invoice.");
      }
    } finally {
      setActing(false);
    }
  }

  function generatePDF() {
    if (!estimate) return;
    const est = estimate;
    const profile = est.profile;
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const margin = 48;
    const cw = pw - margin * 2;
    let y = 0;

    const green = { r: 5, g: 150, b: 105 };
    const darkGreen = { r: 4, g: 120, b: 87 };
    const navy = { r: 15, g: 23, b: 42 };
    const dark = { r: 30, g: 41, b: 59 };
    const slate = { r: 100, g: 116, b: 139 };
    const lightSlate = { r: 148, g: 163, b: 184 };
    const grayBg = { r: 248, g: 250, b: 252 };
    const grayLine = { r: 226, g: 232, b: 240 };

    y = margin;
    let logoEndX = margin;
    if (profile?.logo) {
      try { doc.addImage(profile.logo, "JPEG", margin, y - 8, 52, 52); logoEndX = margin + 62; } catch { /* skip */ }
    }
    if (profile) {
      doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.setTextColor(navy.r, navy.g, navy.b);
      doc.text(profile.businessName || "", logoEndX, y + 12);
      doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(slate.r, slate.g, slate.b);
      const contactLeft = [profile.ownerName, profile.phone].filter(Boolean).join("  \u00B7  ");
      if (contactLeft) doc.text(contactLeft, logoEndX, y + 28);
      if (profile.email) doc.text(profile.email, logoEndX, y + 40);
      if (profile.address) doc.text(profile.address, logoEndX, y + 52);
      const rightContact = [profile.phone, profile.email].filter(Boolean);
      if (rightContact.length) {
        doc.setFontSize(8.5); doc.setTextColor(lightSlate.r, lightSlate.g, lightSlate.b);
        let ry = y + 12;
        rightContact.forEach((line) => { doc.text(line!, pw - margin, ry, { align: "right" }); ry += 12; });
      }
    }
    y += 56;

    doc.setFillColor(green.r, green.g, green.b); doc.rect(0, y, pw, 4, "F"); y += 20;

    doc.setFont("helvetica", "bold"); doc.setFontSize(28); doc.setTextColor(navy.r, navy.g, navy.b);
    doc.text("ESTIMATE", margin, y + 4);
    if (est.jobTitle) {
      doc.setFont("helvetica", "normal"); doc.setFontSize(13); doc.setTextColor(slate.r, slate.g, slate.b);
      doc.text(est.jobTitle, margin, y + 22);
    }
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(slate.r, slate.g, slate.b);
    doc.text("Estimate No.", pw - margin - 120, y - 8);
    doc.setFont("helvetica", "bold"); doc.setTextColor(dark.r, dark.g, dark.b);
    doc.text(est.estimateNumber, pw - margin, y - 8, { align: "right" });
    doc.setFont("helvetica", "normal"); doc.setTextColor(slate.r, slate.g, slate.b);
    doc.text("Date", pw - margin - 120, y + 6);
    doc.setTextColor(dark.r, dark.g, dark.b); doc.text(est.date, pw - margin, y + 6, { align: "right" });
    if (est.jobDate) {
      doc.setTextColor(slate.r, slate.g, slate.b); doc.text("Scheduled Date", pw - margin - 120, y + 20);
      doc.setFont("helvetica", "bold"); doc.setTextColor(green.r, green.g, green.b);
      const jd = new Date(est.jobDate + "T00:00:00");
      doc.text(jd.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), pw - margin, y + 20, { align: "right" });
    }
    y += 40;
    if (est.jobTitle) y += 18;

    doc.setFillColor(grayBg.r, grayBg.g, grayBg.b); doc.setDrawColor(grayLine.r, grayLine.g, grayLine.b); doc.setLineWidth(0.75);
    const boxH = 80; doc.roundedRect(margin, y, cw, boxH, 6, 6, "FD");
    doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(green.r, green.g, green.b);
    doc.text("PREPARED FOR", margin + 14, y + 16);
    doc.setFont("helvetica", "normal"); doc.setTextColor(dark.r, dark.g, dark.b); doc.setFontSize(10);
    let cy = y + 32;
    if (est.customer.name) { doc.setFont("helvetica", "bold"); doc.text(est.customer.name, margin + 14, cy); doc.setFont("helvetica", "normal"); cy += 14; }
    if (est.customer.address) { doc.setTextColor(slate.r, slate.g, slate.b); doc.text(est.customer.address, margin + 14, cy); cy += 14; }
    const custContact = [est.customer.phone, est.customer.email].filter(Boolean).join("  \u00B7  ");
    if (custContact) { doc.setTextColor(slate.r, slate.g, slate.b); doc.setFontSize(9); doc.text(custContact, margin + 14, cy); }
    y += boxH + 20;

    const colDesc = margin; const colQty = margin + cw * 0.52; const colPrice = margin + cw * 0.72; const colAmount = pw - margin; const rowH = 30;
    doc.setFillColor(darkGreen.r, darkGreen.g, darkGreen.b); doc.roundedRect(margin, y, cw, rowH, 4, 4, "F");
    doc.setFillColor(darkGreen.r, darkGreen.g, darkGreen.b); doc.rect(margin, y + rowH - 6, cw, 6, "F");
    doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
    doc.text("DESCRIPTION", colDesc + 12, y + 19); doc.text("QTY", colQty, y + 19, { align: "right" });
    doc.text("UNIT PRICE", colPrice, y + 19, { align: "right" }); doc.text("AMOUNT", colAmount - 12, y + 19, { align: "right" });
    y += rowH;

    doc.setFontSize(9);
    const total = est.total;
    est.items.forEach((item: LineItem, i: number) => {
      const qty = parseFloat(item.quantity) || 0; const price = parseFloat(item.price) || 0; const amount = qty * price;
      if (y > ph - 150) { doc.addPage(); y = margin; }
      if (i % 2 === 0) { doc.setFillColor(grayBg.r, grayBg.g, grayBg.b); doc.rect(margin, y, cw, rowH, "F"); }
      doc.setFillColor(green.r, green.g, green.b); doc.rect(margin, y, 2, rowH, "F");
      doc.setFont("helvetica", "normal"); doc.setTextColor(dark.r, dark.g, dark.b); doc.text(item.description || "\u2014", colDesc + 12, y + 19);
      doc.setTextColor(slate.r, slate.g, slate.b); doc.text(qty.toString(), colQty, y + 19, { align: "right" });
      doc.text(`$${price.toFixed(2)}`, colPrice, y + 19, { align: "right" });
      doc.setFont("helvetica", "bold"); doc.setTextColor(dark.r, dark.g, dark.b); doc.text(`$${amount.toFixed(2)}`, colAmount - 12, y + 19, { align: "right" });
      y += rowH;
      doc.setDrawColor(grayLine.r, grayLine.g, grayLine.b); doc.setLineWidth(0.5); doc.line(margin, y, pw - margin, y);
    });
    y += 12;

    const totalsX = pw - margin - 200; const totalsValX = pw - margin - 12;
    doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(slate.r, slate.g, slate.b);
    doc.text("Subtotal", totalsX, y + 14); doc.setTextColor(dark.r, dark.g, dark.b); doc.text(`$${total.toFixed(2)}`, totalsValX, y + 14, { align: "right" }); y += 24;
    doc.setDrawColor(grayLine.r, grayLine.g, grayLine.b); doc.setLineWidth(0.5); doc.line(totalsX, y, pw - margin, y); y += 4;
    doc.setFillColor(green.r, green.g, green.b); doc.roundedRect(totalsX - 10, y, 222, 38, 6, 6, "F");
    doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
    doc.text("TOTAL DUE", totalsX + 6, y + 24); doc.setFontSize(16); doc.text(`$${total.toFixed(2)}`, totalsValX, y + 24, { align: "right" }); y += 56;

    if (est.notes) {
      if (y > ph - 140) { doc.addPage(); y = margin; }
      doc.setFillColor(grayBg.r, grayBg.g, grayBg.b); doc.setDrawColor(grayLine.r, grayLine.g, grayLine.b); doc.setLineWidth(0.5);
      const noteLines = doc.splitTextToSize(est.notes, cw - 28); const notesBoxH = 34 + noteLines.length * 12;
      doc.roundedRect(margin, y, cw, notesBoxH, 4, 4, "FD");
      doc.setFillColor(green.r, green.g, green.b); doc.rect(margin, y + 4, 3, notesBoxH - 8, "F");
      doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(green.r, green.g, green.b); doc.text("NOTES", margin + 14, y + 16);
      doc.setFont("helvetica", "normal"); doc.setTextColor(slate.r, slate.g, slate.b); doc.setFontSize(8.5);
      let ny = y + 30; noteLines.forEach((line: string) => { doc.text(line, margin + 14, ny); ny += 12; });
      y += notesBoxH + 16;
    }

    if (y > ph - 120) { doc.addPage(); y = margin; }
    doc.setDrawColor(grayLine.r, grayLine.g, grayLine.b); doc.setLineWidth(0.5); doc.line(margin, y, pw - margin, y); y += 16;
    doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(navy.r, navy.g, navy.b); doc.text("TERMS & CONDITIONS", margin, y); y += 14;
    doc.setFont("helvetica", "normal"); doc.setTextColor(slate.r, slate.g, slate.b); doc.setFontSize(8);
    const terms = ["This estimate is valid for 30 days from the date of issue.", "Payment is due upon completion unless otherwise agreed in writing.", "Prices are subject to change if scope of work changes."];
    terms.forEach((line) => { doc.text(`\u2022  ${line}`, margin, y); y += 13; });

    const footY = ph - 44;
    doc.setFillColor(navy.r, navy.g, navy.b); doc.rect(0, footY, pw, 44, "F");
    doc.setFillColor(green.r, green.g, green.b); doc.rect(0, footY, pw, 2, "F");
    doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); doc.setTextColor(200, 215, 235);
    doc.text("This estimate is valid for 30 days  \u00B7  Powered by Preciso", pw / 2, footY + 26, { align: "center" });

    doc.save(`${est.estimateNumber}.pdf`);
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-white" />
        </div>
      </AppShell>
    );
  }

  if (!estimate) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-slate-500">Estimate not found</p>
        </div>
      </AppShell>
    );
  }

  const status = estimate.status;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
        {/* Back link */}
        <Link
          href="/estimates"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-300"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Estimates
        </Link>

        {/* Header */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <h1 className={`text-2xl font-bold ${estimate.customer.name ? "text-white" : "italic text-slate-500"}`}>
            {estimate.customer.name || "Unnamed Customer"}
          </h1>
          <span className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold ${estimateStatusBadge[status] || estimateStatusBadge.draft}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
        {estimate.jobTitle && (
          <p className="mt-1 text-sm text-slate-400">{estimate.jobTitle}</p>
        )}
        <p className="mt-1 text-sm text-slate-500">
          {estimate.estimateNumber} &middot; {formatDate(estimate.date)}
        </p>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-6 flex flex-wrap gap-2">
          {status === "draft" && (
            <>
              <button onClick={() => router.push(`/estimate?edit=${estimate.id}`)} className="rounded-xl bg-white/[0.06] border border-white/[0.1] px-4 py-2 text-sm font-medium text-slate-300 transition-all hover:bg-white/[0.1]">
                Edit
              </button>
              <button onClick={handleSendAndShow} disabled={acting} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-500 disabled:opacity-50">
                {acting ? "Sending..." : "Send"}
              </button>
              <button onClick={generatePDF} className="rounded-xl bg-white/[0.06] border border-white/[0.1] px-4 py-2 text-sm font-medium text-slate-300 transition-all hover:bg-white/[0.1]">
                Download PDF
              </button>
              <button onClick={() => setShowDeleteConfirm(true)} className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm font-medium text-red-400 transition-all hover:bg-red-500/20">
                Delete
              </button>
            </>
          )}
          {status === "sent" && (
            <>
              <button onClick={() => setShowSendModal(true)} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-500">
                Send
              </button>
              <button onClick={generatePDF} className="rounded-xl bg-white/[0.06] border border-white/[0.1] px-4 py-2 text-sm font-medium text-slate-300 transition-all hover:bg-white/[0.1]">
                Download PDF
              </button>
            </>
          )}
          {status === "approved" && (
            <>
              {!estimate.invoiceId && (
                <button onClick={handleConvertToInvoice} disabled={acting} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-500 disabled:opacity-50">
                  {acting ? "Creating..." : "Convert to Invoice"}
                </button>
              )}
              {estimate.invoiceId && (
                <Link href={`/invoice/${estimate.invoiceId}`} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-500">
                  View Invoice
                </Link>
              )}
              <button onClick={() => setShowSendModal(true)} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-500">
                Send
              </button>
              <button onClick={generatePDF} className="rounded-xl bg-white/[0.06] border border-white/[0.1] px-4 py-2 text-sm font-medium text-slate-300 transition-all hover:bg-white/[0.1]">
                Download PDF
              </button>
            </>
          )}
          {status === "declined" && (
            <>
              <button onClick={() => router.push(`/estimate?edit=${estimate.id}`)} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-500">
                Edit &amp; Resend
              </button>
              <button onClick={generatePDF} className="rounded-xl bg-white/[0.06] border border-white/[0.1] px-4 py-2 text-sm font-medium text-slate-300 transition-all hover:bg-white/[0.1]">
                Download PDF
              </button>
              <button onClick={() => setShowDeleteConfirm(true)} className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm font-medium text-red-400 transition-all hover:bg-red-500/20">
                Delete
              </button>
            </>
          )}
        </div>

        {/* Estimate Details Card */}
        <div className="mt-8 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] overflow-hidden">
          {/* Prepared For */}
          <div className="border-b border-white/[0.06] p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Prepared For</p>
            <div className="mt-2">
              {estimate.customer.name && <p className="text-sm font-semibold text-white">{estimate.customer.name}</p>}
              {estimate.customer.address && <p className="mt-0.5 text-sm text-slate-400">{estimate.customer.address}</p>}
              {(estimate.customer.phone || estimate.customer.email) && (
                <p className="mt-0.5 text-sm text-slate-500">
                  {[estimate.customer.phone, estimate.customer.email].filter(Boolean).join(" \u00B7 ")}
                </p>
              )}
            </div>
          </div>

          {/* Scheduled Date */}
          {estimate.jobDate && (
            <div className="border-b border-white/[0.06] px-5 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Scheduled Date</p>
              <p className="mt-1 text-sm font-medium text-slate-300">{formatDate(estimate.jobDate)}</p>
            </div>
          )}

          {/* Line Items */}
          <div className="p-5">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  <th className="pb-2 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Description</th>
                  <th className="w-16 pb-2 px-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Qty</th>
                  <th className="w-24 pb-2 px-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Price</th>
                  <th className="w-24 pb-2 pl-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Amount</th>
                </tr>
              </thead>
              <tbody>
                {estimate.items.map((item, i) => {
                  const qty = parseFloat(item.quantity) || 0;
                  const price = parseFloat(item.price) || 0;
                  const amount = qty * price;
                  return (
                    <tr key={item.id || i} className={i < estimate.items.length - 1 ? "border-b border-white/[0.04]" : ""}>
                      <td className="py-3 pr-3 text-sm">
                        {item.description ? (
                          <span className="text-slate-300">{item.description}</span>
                        ) : (
                          <span className="italic text-slate-500">General Service</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right text-sm text-slate-500">{qty}</td>
                      <td className="py-3 px-2 text-right text-sm text-slate-500">${price.toFixed(2)}</td>
                      <td className="py-3 pl-2 text-right text-sm font-medium text-white">${amount.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="border-t border-white/[0.08] p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-400">Total</span>
              <span className="text-xl font-bold text-white">${estimate.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Invoice Cross-Link */}
          {estimate.invoiceId && (
            <div className="border-t border-white/[0.06] p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Invoice</p>
              <Link
                href={`/invoice/${estimate.invoiceId}`}
                className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-300 transition-colors hover:text-white"
              >
                {estimate.invoiceNumber || "View Invoice"}
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Link>
            </div>
          )}

          {/* Notes */}
          {estimate.notes && (
            <div className="border-t border-white/[0.06] p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Notes</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-400">{estimate.notes}</p>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="mt-8 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Timeline</p>
          <div className="mt-3 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-500/20 border border-slate-500/30">
                <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              </div>
              <div>
                <p className="text-sm text-slate-300">Created</p>
                <p className="text-xs text-slate-500">{formatTimestamp(estimate.createdAt)}</p>
              </div>
            </div>
            {status !== "draft" && (
              <div className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 border border-amber-500/30">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-300">Sent</p>
                  <p className="text-xs text-slate-500">{formatDate(estimate.date)}</p>
                </div>
              </div>
            )}
            {status === "approved" && (
              <div className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/30">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-emerald-400">Approved</p>
                  <p className="text-xs text-slate-500">{formatTimestamp(estimate.updatedAt)}</p>
                </div>
              </div>
            )}
            {status === "declined" && (
              <div className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/20 border border-red-500/30">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-400" />
                </div>
                <div>
                  <p className="text-sm text-red-400">Declined</p>
                  <p className="text-xs text-slate-500">{formatTimestamp(estimate.updatedAt)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-[#12131A] border border-white/[0.1] p-6 shadow-2xl mx-4">
            <h3 className="text-lg font-bold text-white">Delete Estimate</h3>
            <p className="mt-2 text-sm text-slate-400">
              Are you sure you want to delete {estimate.estimateNumber}? This action cannot be undone.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-xl bg-white/[0.06] border border-white/[0.08] py-2.5 text-sm font-medium text-slate-400 transition-all hover:bg-white/[0.1] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowDeleteConfirm(false); handleDelete(); }}
                disabled={acting}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/25 transition-all hover:bg-red-500 disabled:opacity-50"
              >
                {acting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Modal */}
      {showSendModal && estimate && (
        <SendModal
          type="estimate"
          id={estimate.id}
          customerName={estimate.customer.name}
          customerPhone={estimate.customer.phone}
          customerEmail={estimate.customer.email}
          businessName={estimate.profile?.businessName}
          onClose={() => setShowSendModal(false)}
        />
      )}
    </AppShell>
  );
}
