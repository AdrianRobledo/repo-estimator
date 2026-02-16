"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";
import Navbar from "@/app/components/Navbar";
import type { LineItem, EstimateData, InvoiceData } from "@/lib/types";

function generateInvoiceNumber() {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 900 + 100);
  return `INV-${y}${m}${d}-${rand}`;
}

function formatDueDate() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split("T")[0];
}

function formatDisplayDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function generateInvoicePDF(inv: InvoiceData) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  const navy = { r: 26, g: 54, b: 93 };
  const slate = { r: 100, g: 116, b: 139 };
  const grayBg = { r: 243, g: 244, b: 246 };
  const grayLine = { r: 209, g: 213, b: 219 };
  const profile = inv.profile;

  doc.setFillColor(navy.r, navy.g, navy.b);
  doc.rect(0, 0, pageWidth, 110, "F");

  let headerTextX = margin;
  if (profile?.logo) {
    try {
      doc.addImage(profile.logo, "JPEG", margin, 24, 60, 60);
      headerTextX = margin + 74;
    } catch {
      // skip logo
    }
  }

  if (profile) {
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(profile.businessName || "", headerTextX, 50);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(200, 215, 235);
    const parts = [profile.ownerName, profile.phone, profile.email].filter(Boolean);
    doc.text(parts.join("   |   "), headerTextX, 68);
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", pageWidth - margin, 52, { align: "right" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 215, 235);
  doc.text(inv.invoiceNumber, pageWidth - margin, 70, { align: "right" });
  doc.text(inv.date, pageWidth - margin, 84, { align: "right" });

  y = 130;

  const colLeft = margin;
  const colRight = pageWidth / 2 + 20;

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(slate.r, slate.g, slate.b);
  doc.text("BILL TO", colLeft, y);
  doc.text("INVOICE DETAILS", colRight, y);
  y += 14;

  doc.setFontSize(10);
  let custY = y;
  if (inv.customer.name) { doc.setFont("helvetica", "bold"); doc.setTextColor(50, 50, 50); doc.text(inv.customer.name, colLeft, custY); doc.setFont("helvetica", "normal"); custY += 15; }
  if (inv.customer.address) { doc.setTextColor(50, 50, 50); doc.text(inv.customer.address, colLeft, custY); custY += 15; }
  if (inv.customer.phone) { doc.setTextColor(50, 50, 50); doc.text(inv.customer.phone, colLeft, custY); custY += 15; }
  if (inv.customer.email) { doc.setTextColor(50, 50, 50); doc.text(inv.customer.email, colLeft, custY); custY += 15; }

  let detY = y;
  doc.setFontSize(9);
  const details = [
    ["Invoice No.", inv.invoiceNumber],
    ["Date", inv.date],
    ["Due Date", formatDisplayDate(inv.dueDate)],
    ["Estimate Ref.", inv.estimateNumber],
  ];
  details.forEach(([label, val]) => {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(slate.r, slate.g, slate.b);
    doc.text(label, colRight, detY);
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "bold");
    doc.text(val, colRight + 80, detY);
    detY += 15;
  });

  y = Math.max(custY, detY) + 20;

  doc.setDrawColor(grayLine.r, grayLine.g, grayLine.b);
  doc.setLineWidth(0.75);
  doc.line(margin, y, pageWidth - margin, y);
  y += 20;

  const colDesc = margin;
  const colQty = margin + contentWidth * 0.52;
  const colPrice = margin + contentWidth * 0.68;
  const colAmount = pageWidth - margin;
  const rowH = 28;

  doc.setFillColor(navy.r, navy.g, navy.b);
  doc.rect(margin, y, contentWidth, rowH, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("DESCRIPTION", colDesc + 10, y + 18);
  doc.text("QTY", colQty, y + 18, { align: "right" });
  doc.text("UNIT PRICE", colPrice + 10, y + 18, { align: "right" });
  doc.text("AMOUNT", colAmount - 10, y + 18, { align: "right" });
  y += rowH;

  doc.setFontSize(9);
  inv.items.forEach((item: LineItem, i: number) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.price) || 0;
    const amount = qty * price;

    if (y > pageHeight - 140) { doc.addPage(); y = margin; }

    if (i % 2 === 0) {
      doc.setFillColor(grayBg.r, grayBg.g, grayBg.b);
      doc.rect(margin, y, contentWidth, rowH, "F");
    }

    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    doc.text(item.description || "—", colDesc + 10, y + 18);
    doc.setTextColor(slate.r, slate.g, slate.b);
    doc.text(qty.toString(), colQty, y + 18, { align: "right" });
    doc.text(`$${price.toFixed(2)}`, colPrice + 10, y + 18, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.setTextColor(50, 50, 50);
    doc.text(`$${amount.toFixed(2)}`, colAmount - 10, y + 18, { align: "right" });
    y += rowH;
  });

  doc.setDrawColor(navy.r, navy.g, navy.b);
  doc.setLineWidth(1.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  const totalsX = pageWidth - margin - 180;
  const totalsValX = pageWidth - margin - 10;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(slate.r, slate.g, slate.b);
  doc.text("Subtotal", totalsX, y + 14);
  doc.setTextColor(50, 50, 50);
  doc.text(`$${inv.total.toFixed(2)}`, totalsValX, y + 14, { align: "right" });
  y += 22;

  doc.setTextColor(slate.r, slate.g, slate.b);
  doc.text("Tax", totalsX, y + 14);
  doc.setTextColor(50, 50, 50);
  doc.text("—", totalsValX, y + 14, { align: "right" });
  y += 22;

  doc.setFillColor(navy.r, navy.g, navy.b);
  doc.roundedRect(totalsX - 10, y, 200, 34, 4, 4, "F");
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("AMOUNT DUE", totalsX + 4, y + 22);
  doc.setFontSize(14);
  doc.text(`$${inv.total.toFixed(2)}`, totalsValX, y + 22, { align: "right" });
  y += 52;

  if (y > pageHeight - 130) { doc.addPage(); y = margin; }

  doc.setDrawColor(grayLine.r, grayLine.g, grayLine.b);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 16;

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(navy.r, navy.g, navy.b);
  doc.text("PAYMENT TERMS", margin, y);
  y += 14;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(slate.r, slate.g, slate.b);
  doc.setFontSize(8);
  const terms = [
    `Payment is due by ${formatDisplayDate(inv.dueDate)}.`,
    "Please reference the invoice number with your payment.",
    "Late payments may be subject to additional fees.",
  ];
  terms.forEach((line) => { doc.text(`•  ${line}`, margin, y); y += 13; });

  doc.setFillColor(grayBg.r, grayBg.g, grayBg.b);
  doc.rect(0, pageHeight - 40, pageWidth, 40, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(slate.r, slate.g, slate.b);
  doc.text("Thank you for your business!", pageWidth / 2, pageHeight - 18, { align: "center" });

  if (profile?.businessName) {
    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.text(`${profile.businessName}  •  Generated with QuickEstimate`, pageWidth / 2, pageHeight - 8, { align: "center" });
  }

  doc.save(`${inv.invoiceNumber}.pdf`);
}

export default function DashboardPage() {
  const router = useRouter();
  const [estimates, setEstimates] = useState<EstimateData[]>([]);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/estimates").then((r) => r.json()),
      fetch("/api/invoices").then((r) => r.json()),
    ]).then(([est, inv]) => {
      setEstimates(est);
      setInvoices(inv);
      setLoading(false);
    });
  }, []);

  async function convertToInvoice(est: EstimateData) {
    const invoiceNumber = generateInvoiceNumber();
    const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const dueDate = formatDueDate();

    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estimateId: est.id, invoiceNumber, date, dueDate }),
    });

    if (res.ok) {
      const data = await res.json();
      // Refresh data
      const [estData, invData] = await Promise.all([
        fetch("/api/estimates").then((r) => r.json()),
        fetch("/api/invoices").then((r) => r.json()),
      ]);
      setEstimates(estData);
      setInvoices(invData);
    }
  }

  async function togglePaid(inv: InvoiceData) {
    const newStatus = inv.status === "unpaid" ? "paid" : "unpaid";
    await fetch(`/api/invoices/${inv.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setInvoices(
      invoices.map((i) =>
        i.id === inv.id ? { ...i, status: newStatus } : i
      )
    );
  }

  function copyLink(path: string, id: string) {
    navigator.clipboard.writeText(`${window.location.origin}${path}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const statusColor: Record<string, string> = {
    sent: "bg-blue-50 text-blue-700 ring-blue-200",
    approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    declined: "bg-red-50 text-red-600 ring-red-200",
    unpaid: "bg-amber-50 text-amber-700 ring-amber-200",
    paid: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />

      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* Estimates Section */}
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">
          Estimates
        </h2>

        {estimates.length === 0 ? (
          <div className="mt-3 rounded-xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
            No estimates yet. Create your first one!
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {estimates.map((est) => (
              <div
                key={est.id}
                className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      {est.customer.name || "No customer name"}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {est.estimateNumber} &middot; {est.date}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${
                        statusColor[est.status] || "bg-slate-50 text-slate-600 ring-slate-200"
                      }`}
                    >
                      {est.status.charAt(0).toUpperCase() + est.status.slice(1)}
                    </span>
                    <span className="text-sm font-bold text-slate-800">
                      ${est.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => copyLink(`/view/${est.id}`, `est-${est.id}`)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                  >
                    {copiedId === `est-${est.id}` ? "Copied!" : "Copy Link"}
                  </button>

                  {est.status === "approved" && !est.invoiceId && (
                    <button
                      onClick={() => convertToInvoice(est)}
                      className="rounded-lg bg-[#1A365D] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#2B4E7C]"
                    >
                      Convert to Invoice
                    </button>
                  )}

                  {est.invoiceId && (
                    <span className="self-center text-xs text-slate-400">
                      Invoiced
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Invoices Section */}
        <h2 className="mt-10 text-sm font-bold uppercase tracking-widest text-slate-400">
          Invoices
        </h2>

        {invoices.length === 0 ? (
          <div className="mt-3 rounded-xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
            No invoices yet. Approve an estimate to create one.
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      {inv.customer.name || "No customer name"}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {inv.invoiceNumber} &middot; Due{" "}
                      {formatDisplayDate(inv.dueDate)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${
                        statusColor[inv.status]
                      }`}
                    >
                      {inv.status === "unpaid" ? "Unpaid" : "Paid"}
                    </span>
                    <span className="text-sm font-bold text-slate-800">
                      ${inv.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => copyLink(`/invoice/${inv.id}`, `inv-${inv.id}`)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                  >
                    {copiedId === `inv-${inv.id}` ? "Copied!" : "Copy Link"}
                  </button>
                  <button
                    onClick={() => generateInvoicePDF(inv)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                  >
                    Download PDF
                  </button>
                  <button
                    onClick={() => togglePaid(inv)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      inv.status === "unpaid"
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                    }`}
                  >
                    {inv.status === "unpaid" ? "Mark as Paid" : "Mark as Unpaid"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
