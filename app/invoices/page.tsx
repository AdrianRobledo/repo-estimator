"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { jsPDF } from "jspdf";
import AppShell from "@/app/components/AppShell";
import SendModal from "@/app/components/SendModal";
import type { InvoiceData, LineItem } from "@/lib/types";

function formatDisplayDate(iso: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
  const parsed = new Date(iso);
  if (!isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
  return iso;
}

function getDisplayStatus(dueDate: string, status: string): string {
  if (status === "paid") return "paid";
  if (status === "unpaid") {
    const due = new Date(dueDate + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (due < today) return "overdue";
  }
  return status;
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
    try { doc.addImage(profile.logo, "JPEG", margin, 24, 60, 60); headerTextX = margin + 74; } catch { /* skip */ }
  }

  if (profile) {
    doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.setFont("helvetica", "bold");
    doc.text(profile.businessName || "", headerTextX, 50);
    doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(200, 215, 235);
    const parts = [profile.ownerName, profile.phone, profile.email].filter(Boolean);
    doc.text(parts.join("   |   "), headerTextX, 68);
  }

  doc.setTextColor(255, 255, 255); doc.setFontSize(28); doc.setFont("helvetica", "bold");
  doc.text("INVOICE", pageWidth - margin, 52, { align: "right" });
  doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(200, 215, 235);
  doc.text(inv.invoiceNumber, pageWidth - margin, 70, { align: "right" });
  doc.text(inv.date, pageWidth - margin, 84, { align: "right" });

  y = 130;
  const colLeft = margin;
  const colRight = pageWidth / 2 + 20;

  doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(slate.r, slate.g, slate.b);
  doc.text("BILL TO", colLeft, y);
  doc.text("INVOICE DETAILS", colRight, y);
  y += 14;

  doc.setFontSize(10);
  let custY = y;
  const billToMaxW = colRight - colLeft - 20;
  if (inv.customer.name) { doc.setFont("helvetica", "bold"); doc.setTextColor(50, 50, 50); doc.text(inv.customer.name, colLeft, custY); doc.setFont("helvetica", "normal"); custY += 15; }
  if (inv.customer.address) {
    doc.setTextColor(50, 50, 50);
    const addrLines: string[] = doc.splitTextToSize(inv.customer.address, billToMaxW);
    addrLines.forEach((line: string) => { doc.text(line, colLeft, custY); custY += 15; });
  }
  if (inv.customer.phone) { doc.setTextColor(50, 50, 50); doc.text(inv.customer.phone, colLeft, custY); custY += 15; }
  if (inv.customer.email) { doc.setTextColor(50, 50, 50); doc.text(inv.customer.email, colLeft, custY); custY += 15; }

  let detY = y;
  doc.setFontSize(9);
  const details = [["Invoice No.", inv.invoiceNumber], ["Date", inv.date], ["Due Date", formatDisplayDate(inv.dueDate)], ["Estimate Ref.", inv.estimateNumber]];
  details.forEach(([label, val]) => {
    doc.setFont("helvetica", "normal"); doc.setTextColor(slate.r, slate.g, slate.b); doc.text(label, colRight, detY);
    doc.setTextColor(50, 50, 50); doc.setFont("helvetica", "bold"); doc.text(val, colRight + 80, detY);
    detY += 15;
  });

  y = Math.max(custY, detY) + 20;
  doc.setDrawColor(grayLine.r, grayLine.g, grayLine.b); doc.setLineWidth(0.75); doc.line(margin, y, pageWidth - margin, y);
  y += 20;

  const colDesc = margin; const colQty = margin + contentWidth * 0.52; const colPrice = margin + contentWidth * 0.68; const colAmount = pageWidth - margin; const rowH = 28;
  doc.setFillColor(navy.r, navy.g, navy.b); doc.rect(margin, y, contentWidth, rowH, "F");
  doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
  doc.text("DESCRIPTION", colDesc + 10, y + 18); doc.text("QTY", colQty, y + 18, { align: "right" });
  doc.text("UNIT PRICE", colPrice + 10, y + 18, { align: "right" }); doc.text("AMOUNT", colAmount - 10, y + 18, { align: "right" });
  y += rowH;

  doc.setFontSize(9);
  const invDescMaxW = colQty - colDesc - 20;
  inv.items.forEach((item: LineItem, i: number) => {
    const qty = parseFloat(item.quantity) || 0; const price = parseFloat(item.price) || 0; const amount = qty * price;
    const descLines: string[] = doc.splitTextToSize(item.description || "—", invDescMaxW);
    const currentRowH = Math.max(rowH, descLines.length * 13 + 14);
    if (y > pageHeight - 140) { doc.addPage(); y = margin; }
    if (i % 2 === 0) { doc.setFillColor(grayBg.r, grayBg.g, grayBg.b); doc.rect(margin, y, contentWidth, currentRowH, "F"); }
    doc.setFont("helvetica", "normal"); doc.setTextColor(50, 50, 50);
    let descY = y + 14;
    descLines.forEach((line: string) => { doc.text(line, colDesc + 10, descY); descY += 13; });
    const midY = y + currentRowH / 2 + 3;
    doc.setTextColor(slate.r, slate.g, slate.b); doc.text(qty.toString(), colQty, midY, { align: "right" });
    doc.text(`$${price.toFixed(2)}`, colPrice + 10, midY, { align: "right" });
    doc.setFont("helvetica", "bold"); doc.setTextColor(50, 50, 50); doc.text(`$${amount.toFixed(2)}`, colAmount - 10, midY, { align: "right" });
    y += currentRowH;
  });

  doc.setDrawColor(navy.r, navy.g, navy.b); doc.setLineWidth(1.5); doc.line(margin, y, pageWidth - margin, y);
  y += 10;
  const totalsX = pageWidth - margin - 180; const totalsValX = pageWidth - margin - 10;
  doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(slate.r, slate.g, slate.b);
  doc.text("Subtotal", totalsX, y + 14); doc.setTextColor(50, 50, 50); doc.text(`$${inv.total.toFixed(2)}`, totalsValX, y + 14, { align: "right" });
  y += 22;
  doc.setTextColor(slate.r, slate.g, slate.b); doc.text("Tax", totalsX, y + 14); doc.setTextColor(50, 50, 50); doc.text("—", totalsValX, y + 14, { align: "right" });
  y += 22;
  doc.setFillColor(navy.r, navy.g, navy.b); doc.roundedRect(totalsX - 10, y, 200, 34, 4, 4, "F");
  doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
  doc.text("AMOUNT DUE", totalsX + 4, y + 22); doc.setFontSize(14); doc.text(`$${inv.total.toFixed(2)}`, totalsValX, y + 22, { align: "right" });
  y += 52;

  if (y > pageHeight - 130) { doc.addPage(); y = margin; }
  doc.setDrawColor(grayLine.r, grayLine.g, grayLine.b); doc.setLineWidth(0.5); doc.line(margin, y, pageWidth - margin, y);
  y += 16;
  doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(navy.r, navy.g, navy.b); doc.text("PAYMENT TERMS", margin, y);
  y += 14;
  doc.setFont("helvetica", "normal"); doc.setTextColor(slate.r, slate.g, slate.b); doc.setFontSize(8);
  const terms = [`Payment is due by ${formatDisplayDate(inv.dueDate)}.`, "Please reference the invoice number with your payment.", "Late payments may be subject to additional fees."];
  terms.forEach((line) => { doc.text(`•  ${line}`, margin, y); y += 13; });

  doc.setFillColor(grayBg.r, grayBg.g, grayBg.b); doc.rect(0, pageHeight - 40, pageWidth, 40, "F");
  doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(slate.r, slate.g, slate.b);
  doc.text("Thank you for your business!", pageWidth / 2, pageHeight - 18, { align: "center" });
  if (profile?.businessName) {
    doc.setFontSize(7); doc.setTextColor(180, 180, 180);
    doc.text(`${profile.businessName}  •  Powered by Preciso`, pageWidth / 2, pageHeight - 8, { align: "center" });
  }
  doc.save(`${inv.invoiceNumber}.pdf`);
}

const tabs = ["all", "unpaid", "paid", "overdue"] as const;
type Tab = (typeof tabs)[number];

const tabLabels: Record<Tab, string> = {
  all: "All",
  unpaid: "Unpaid",
  paid: "Paid",
  overdue: "Overdue",
};

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("all");
  const [sendInvoiceId, setSendInvoiceId] = useState<string | null>(null);
  const [confirmPaidId, setConfirmPaidId] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    fetch("/api/invoices")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setInvoices(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  const sendInvoice = sendInvoiceId ? invoices.find((i) => i.id === sendInvoiceId) ?? null : null;

  async function confirmTogglePaid() {
    const inv = confirmPaidId ? invoices.find((i) => i.id === confirmPaidId) : null;
    if (!inv) return;
    setToggling(true);
    const newStatus = inv.status === "unpaid" ? "paid" : "unpaid";
    await fetch(`/api/invoices/${inv.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setInvoices(invoices.map((i) => (i.id === inv.id ? { ...i, status: newStatus } : i)));
    setToggling(false);
    setConfirmPaidId(null);
  }

  const confirmInvoice = confirmPaidId ? invoices.find((i) => i.id === confirmPaidId) ?? null : null;

  const statusBadge: Record<string, string> = {
    unpaid: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    paid: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    overdue: "bg-red-500/15 text-red-400 border-red-500/20",
  };

  // Compute display statuses for all invoices
  const invoicesWithDisplay = useMemo(
    () =>
      invoices.map((inv) => ({
        ...inv,
        displayStatus: getDisplayStatus(inv.dueDate, inv.status),
      })),
    [invoices]
  );

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts: Record<Tab, number> = { all: invoices.length, unpaid: 0, paid: 0, overdue: 0 };
    invoicesWithDisplay.forEach((inv) => {
      if (inv.displayStatus === "paid") counts.paid++;
      else if (inv.displayStatus === "overdue") counts.overdue++;
      else if (inv.displayStatus === "unpaid") counts.unpaid++;
    });
    return counts;
  }, [invoices, invoicesWithDisplay]);

  // Filtered results
  const results = useMemo(() => {
    if (tab === "all") return invoicesWithDisplay;
    return invoicesWithDisplay.filter((inv) => inv.displayStatus === tab);
  }, [invoicesWithDisplay, tab]);

  // Summary stats
  const totalRevenue = invoicesWithDisplay
    .filter((i) => i.displayStatus === "paid")
    .reduce((sum, i) => sum + i.total, 0);
  const outstandingAmount = invoicesWithDisplay
    .filter((i) => i.displayStatus === "unpaid" || i.displayStatus === "overdue")
    .reduce((sum, i) => sum + i.total, 0);
  const overdueAmount = invoicesWithDisplay
    .filter((i) => i.displayStatus === "overdue")
    .reduce((sum, i) => sum + i.total, 0);

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
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
        <h1 className="text-2xl font-bold text-white">Invoices</h1>
        <p className="mt-1 text-sm text-slate-500">
          {invoices.length} invoice{invoices.length !== 1 ? "s" : ""} total
        </p>

        {/* Outstanding Summary */}
        {invoices.length > 0 && (
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/[0.08] border-l-2 border-l-amber-500 bg-gradient-to-r from-white/[0.05] to-white/[0.02] p-4">
              <p className="text-xs font-medium text-slate-400">Outstanding</p>
              <p className="mt-1 text-xl font-bold text-amber-400">
                ${outstandingAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-600">
                {tabCounts.unpaid + tabCounts.overdue} unpaid invoice{tabCounts.unpaid + tabCounts.overdue !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.08] border-l-2 border-l-red-500 bg-gradient-to-r from-white/[0.05] to-white/[0.02] p-4">
              <p className="text-xs font-medium text-slate-400">Overdue</p>
              <p className="mt-1 text-xl font-bold text-red-400">
                ${overdueAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-600">
                {tabCounts.overdue} overdue invoice{tabCounts.overdue !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.08] border-l-2 border-l-emerald-500 bg-gradient-to-r from-white/[0.05] to-white/[0.02] p-4">
              <p className="text-xs font-medium text-slate-400">Revenue</p>
              <p className="mt-1 text-xl font-bold text-emerald-400">
                ${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-600">
                {tabCounts.paid} paid invoice{tabCounts.paid !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        {invoices.length > 0 && (
          <div className="mt-5 flex gap-1.5 overflow-x-auto">
            {tabs.map((t) => (
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
                <span className="ml-1.5 text-[10px] opacity-60">{tabCounts[t]}</span>
              </button>
            ))}
          </div>
        )}

        {invoices.length === 0 ? (
          <div className="mt-16 flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.08]">
              <svg className="h-8 w-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
              </svg>
            </div>
            <h2 className="mt-5 text-lg font-semibold text-white">No invoices yet</h2>
            <p className="mt-1.5 max-w-xs text-sm text-slate-500">
              Create an estimate first, then convert it to an invoice after your customer approves.
            </p>
            <Link
              href="/estimates"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-500"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Go to Estimates
            </Link>
          </div>
        ) : results.length === 0 ? (
          <div className="mt-6 rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-12 text-center">
            <svg className="mx-auto h-10 w-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
            </svg>
            <p className="mt-3 text-sm text-slate-500">
              No {tabLabels[tab].toLowerCase()} invoices
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {results.map((inv) => (
              <div
                key={inv.id}
                onClick={() => router.push(`/invoice/${inv.id}`)}
                className="cursor-pointer rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] p-4 transition-all duration-200 hover:bg-white/[0.06] hover:border-white/[0.12]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold ${inv.customer.name ? "text-white" : "italic text-slate-500"}`}>
                      {inv.customer.name || "Unnamed Customer"}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {inv.invoiceNumber} &middot; Due {formatDisplayDate(inv.dueDate)}
                    </p>
                    {inv.estimateNumber && (
                      <Link
                        href={`/estimates/${inv.estimateId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-slate-300 transition-colors hover:text-white"
                      >
                        {inv.estimateNumber}
                      </Link>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2.5">
                    <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${statusBadge[inv.displayStatus]}`}>
                      {inv.displayStatus.charAt(0).toUpperCase() + inv.displayStatus.slice(1)}
                    </span>
                    <span className="text-sm font-bold text-white">
                      ${inv.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setSendInvoiceId(inv.id); }}
                    className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:bg-emerald-500"
                  >
                    Send
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); generateInvoicePDF(inv); }}
                    className="rounded-xl bg-white/[0.06] border border-white/[0.1] px-3 py-1.5 text-xs font-medium text-slate-300 transition-all duration-200 hover:bg-white/[0.1]"
                  >
                    Download PDF
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmPaidId(inv.id); }}
                    className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                      inv.status === "unpaid"
                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-500"
                        : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
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

      {/* Confirm Mark as Paid/Unpaid Modal */}
      {confirmInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !toggling && setConfirmPaidId(null)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-[#12131A] border border-white/[0.1] p-6 shadow-2xl mx-4">
            <h3 className="text-lg font-bold text-white">
              {confirmInvoice.status === "unpaid" ? "Mark invoice as paid?" : "Mark invoice as unpaid?"}
            </h3>
            <div className="mt-3 rounded-xl bg-white/[0.04] border border-white/[0.06] p-4">
              <p className="text-sm font-semibold text-white">
                {confirmInvoice.customer.name || "Unnamed Customer"}
              </p>
              <p className="mt-1 text-lg font-bold text-white">
                ${confirmInvoice.total.toFixed(2)}
              </p>
            </div>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setConfirmPaidId(null)}
                disabled={toggling}
                className="flex-1 rounded-xl bg-white/[0.06] border border-white/[0.08] py-2.5 text-sm font-medium text-slate-400 transition-all hover:bg-white/[0.1] hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmTogglePaid}
                disabled={toggling}
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white shadow-lg transition-all disabled:opacity-50 ${
                  confirmInvoice.status === "unpaid"
                    ? "bg-emerald-600 shadow-emerald-500/25 hover:bg-emerald-500"
                    : "bg-emerald-600 shadow-emerald-500/25 hover:bg-emerald-500"
                }`}
              >
                {toggling ? "Updating..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Modal */}
      {sendInvoice && (
        <SendModal
          type="invoice"
          id={sendInvoice.id}
          customerName={sendInvoice.customer.name}
          customerPhone={sendInvoice.customer.phone}
          customerEmail={sendInvoice.customer.email}
          businessName={sendInvoice.profile?.businessName}
          onClose={() => setSendInvoiceId(null)}
        />
      )}
    </AppShell>
  );
}
