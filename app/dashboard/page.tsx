"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { jsPDF } from "jspdf";
import AppShell from "@/app/components/AppShell";
import type { LineItem, BusinessProfile, EstimateData, InvoiceData } from "@/lib/types";

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
    doc.text(`${profile.businessName}  •  Powered by Preciso AI`, pageWidth / 2, pageHeight - 8, { align: "center" });
  }

  doc.save(`${inv.invoiceNumber}.pdf`);
}

const tradeQuickLinks = [
  { slug: "plumbing", label: "Plumbing" },
  { slug: "landscaping", label: "Landscaping" },
  { slug: "electrical", label: "Electrical" },
  { slug: "painting", label: "Painting" },
  { slug: "handyman", label: "Handyman" },
];

export default function DashboardPage() {
  const router = useRouter();
  const [estimates, setEstimates] = useState<EstimateData[]>([]);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [templateExpanded, setTemplateExpanded] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/estimates").then((r) => r.ok ? r.json() : []),
      fetch("/api/invoices").then((r) => r.ok ? r.json() : []),
      fetch("/api/profile").then((r) => r.ok ? r.json() : null),
    ]).then(([est, inv, prof]) => {
      setEstimates(Array.isArray(est) ? est : []);
      setInvoices(Array.isArray(inv) ? inv : []);
      if (prof && !prof.error) setProfile(prof);
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
      const [estData, invData] = await Promise.all([
        fetch("/api/estimates").then((r) => r.ok ? r.json() : []),
        fetch("/api/invoices").then((r) => r.ok ? r.json() : []),
      ]);
      setEstimates(Array.isArray(estData) ? estData : []);
      setInvoices(Array.isArray(invData) ? invData : []);
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

  const statusDot: Record<string, string> = {
    sent: "bg-blue-400",
    approved: "bg-emerald-400",
    declined: "bg-rose-400",
    unpaid: "bg-amber-400",
    paid: "bg-emerald-400",
  };

  const statusText: Record<string, string> = {
    sent: "text-blue-400",
    approved: "text-emerald-400",
    declined: "text-rose-400",
    unpaid: "text-amber-400",
    paid: "text-emerald-400",
  };

  // Computed values
  const totalEstimates = estimates.length;
  const approved = estimates.filter((e) => e.status === "approved").length;
  const declined = estimates.filter((e) => e.status === "declined").length;
  const totalRevenue = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + i.total, 0);

  // Onboarding checklist
  const profileSetUp = !!(profile?.businessName && profile?.ownerName);
  const hasEstimates = estimates.length > 0;
  const hasSentEstimate = estimates.some((e) => e.status === "sent" || e.status === "approved" || e.status === "declined");
  const hasApprovedOrPaid = estimates.some((e) => e.status === "approved") || invoices.some((i) => i.status === "paid");

  // Recent activity
  const recentActivity = [
    ...estimates.map((e) => ({
      type: "estimate" as const,
      id: e.id,
      label: e.customer.name || "Unnamed",
      number: e.estimateNumber,
      status: e.status,
      amount: e.total,
      date: e.date,
    })),
    ...invoices.map((i) => ({
      type: "invoice" as const,
      id: i.id,
      label: i.customer.name || "Unnamed",
      number: i.invoiceNumber,
      status: i.status,
      amount: i.total,
      date: i.date,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const hasActivity = recentActivity.length > 0;

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-indigo-500" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        {/* Welcome Header */}
        <div className="animate-fade-in-up">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Welcome back{profile?.ownerName ? `, ${profile.ownerName}` : ""}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{today}</p>
        </div>

        {/* Stats Bar */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 animate-fade-in-up delay-100">
          <div className="rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] p-4">
            <p className="text-xs font-medium text-slate-500">Total Estimates</p>
            <p className="mt-1 text-2xl font-bold text-white">{totalEstimates}</p>
          </div>
          <div className="rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] p-4">
            <p className="text-xs font-medium text-slate-500">Approved</p>
            <p className="mt-1 text-2xl font-bold text-emerald-400">{approved}</p>
          </div>
          <div className="rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] p-4">
            <p className="text-xs font-medium text-slate-500">Declined</p>
            <p className="mt-1 text-2xl font-bold text-rose-400">{declined}</p>
          </div>
          <div className="rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] p-4">
            <p className="text-xs font-medium text-slate-500">Total Revenue</p>
            <p className="mt-1 text-2xl font-bold text-white">${totalRevenue.toFixed(2)}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3 animate-fade-in-up delay-200">
          {/* New Estimate */}
          <Link
            href="/estimate"
            className="group rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] p-4 transition-all duration-200 hover:bg-white/[0.08] hover:border-indigo-500/30"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20">
              <svg className="h-5 w-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className="mt-3 text-sm font-semibold text-white">New Estimate</p>
            <p className="mt-0.5 text-xs text-slate-500">Create a new estimate from scratch</p>
          </Link>

          {/* Use Template */}
          <div
            className="rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] p-4 transition-all duration-200 hover:bg-white/[0.08] hover:border-violet-500/30 cursor-pointer"
            onClick={() => setTemplateExpanded(!templateExpanded)}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20">
              <svg className="h-5 w-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
            </div>
            <p className="mt-3 text-sm font-semibold text-white">Use Template</p>
            <p className="mt-0.5 text-xs text-slate-500">Start from a trade template</p>
            {templateExpanded && (
              <div className="mt-3 space-y-1" onClick={(e) => e.stopPropagation()}>
                {tradeQuickLinks.map((t) => (
                  <Link
                    key={t.slug}
                    href={`/estimate?trade=${t.slug}`}
                    className="block rounded-lg px-2 py-1.5 text-xs font-medium text-violet-300 transition-colors hover:bg-violet-500/10"
                  >
                    {t.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* View Invoices */}
          <a
            href="#invoices"
            className="group rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] p-4 transition-all duration-200 hover:bg-white/[0.08] hover:border-emerald-500/30"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
              <svg className="h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
              </svg>
            </div>
            <p className="mt-3 text-sm font-semibold text-white">View Invoices</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}
            </p>
          </a>
        </div>

        {/* Recent Activity / Onboarding */}
        <div className="mt-6 animate-fade-in-up delay-300">
          {!hasActivity ? (
            /* Onboarding Checklist */
            <div className="rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] p-5">
              <h3 className="text-sm font-semibold text-white">Getting Started</h3>
              <p className="mt-1 text-xs text-slate-500">Complete these steps to get the most out of Preciso</p>
              <div className="mt-4 space-y-3">
                {[
                  { done: profileSetUp, label: "Set up your business profile", href: "/setup" },
                  { done: hasEstimates, label: "Create your first estimate", href: "/estimate" },
                  { done: hasSentEstimate, label: "Send an estimate to a customer" },
                  { done: hasApprovedOrPaid, label: "Get an estimate approved or invoice paid" },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      step.done
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-white/[0.08] text-slate-500"
                    }`}>
                      {step.done ? (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </div>
                    {step.href ? (
                      <Link href={step.href} className={`text-sm ${step.done ? "text-slate-500 line-through" : "text-slate-300 hover:text-white"}`}>
                        {step.label}
                      </Link>
                    ) : (
                      <span className={`text-sm ${step.done ? "text-slate-500 line-through" : "text-slate-400"}`}>
                        {step.label}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Activity Timeline */
            <div className="rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] p-5">
              <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
              <div className="mt-4 space-y-3">
                {recentActivity.map((item) => (
                  <div key={`${item.type}-${item.id}`} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${statusDot[item.status] || "bg-slate-500"}`} />
                      <div className="min-w-0">
                        <p className="truncate text-sm text-white">
                          {item.label}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.number} &middot; {item.type === "estimate" ? "Estimate" : "Invoice"}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-white">
                      ${item.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Estimates Section */}
        <div id="estimates" className="scroll-mt-6 mt-8 animate-fade-in-up delay-400">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Estimates
          </h2>

          {estimates.length === 0 ? (
            <div className="mt-3 rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] p-6 text-center text-sm text-slate-500">
              No estimates yet. Create your first one!
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {estimates.map((est) => (
                <div
                  key={est.id}
                  className="rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] p-4 transition-all duration-200 hover:bg-white/[0.03]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">
                        {est.customer.name || "No customer name"}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {est.estimateNumber} &middot; {est.date}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${statusDot[est.status] || "bg-slate-500"}`} />
                        <span className={`text-xs font-medium ${statusText[est.status] || "text-slate-400"}`}>
                          {est.status.charAt(0).toUpperCase() + est.status.slice(1)}
                        </span>
                      </span>
                      <span className="text-sm font-bold text-white">
                        ${est.total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => copyLink(`/view/${est.id}`, `est-${est.id}`)}
                      className="rounded-xl bg-white/[0.06] border border-white/[0.1] px-3 py-1.5 text-xs font-medium text-slate-300 transition-all duration-200 hover:bg-white/[0.1]"
                    >
                      {copiedId === `est-${est.id}` ? "Copied!" : "Copy Link"}
                    </button>

                    {est.status === "approved" && !est.invoiceId && (
                      <button
                        onClick={() => convertToInvoice(est)}
                        className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-500"
                      >
                        Convert to Invoice
                      </button>
                    )}

                    {est.invoiceId && (
                      <span className="self-center text-xs text-slate-500">
                        Invoiced
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invoices Section */}
        <div id="invoices" className="scroll-mt-6 mt-8 animate-fade-in-up delay-500">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Invoices
          </h2>

          {invoices.length === 0 ? (
            <div className="mt-3 rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] p-6 text-center text-sm text-slate-500">
              No invoices yet. Approve an estimate to create one.
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] p-4 transition-all duration-200 hover:bg-white/[0.03]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">
                        {inv.customer.name || "No customer name"}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {inv.invoiceNumber} &middot; Due{" "}
                        {formatDisplayDate(inv.dueDate)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${statusDot[inv.status]}`} />
                        <span className={`text-xs font-medium ${statusText[inv.status]}`}>
                          {inv.status === "unpaid" ? "Unpaid" : "Paid"}
                        </span>
                      </span>
                      <span className="text-sm font-bold text-white">
                        ${inv.total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => copyLink(`/invoice/${inv.id}`, `inv-${inv.id}`)}
                      className="rounded-xl bg-white/[0.06] border border-white/[0.1] px-3 py-1.5 text-xs font-medium text-slate-300 transition-all duration-200 hover:bg-white/[0.1]"
                    >
                      {copiedId === `inv-${inv.id}` ? "Copied!" : "Copy Link"}
                    </button>
                    <button
                      onClick={() => generateInvoicePDF(inv)}
                      className="rounded-xl bg-white/[0.06] border border-white/[0.1] px-3 py-1.5 text-xs font-medium text-slate-300 transition-all duration-200 hover:bg-white/[0.1]"
                    >
                      Download PDF
                    </button>
                    <button
                      onClick={() => togglePaid(inv)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                        inv.status === "unpaid"
                          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-500"
                          : "bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20"
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
    </AppShell>
  );
}
