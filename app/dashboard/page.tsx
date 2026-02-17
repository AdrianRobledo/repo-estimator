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
  const onboardingSteps = [
    { done: !!(profile?.businessName && profile?.ownerName), label: "Set up your business profile", href: "/setup" },
    { done: estimates.length > 0, label: "Create your first estimate", href: "/estimate" },
    { done: estimates.some((e) => e.status === "sent" || e.status === "approved" || e.status === "declined"), label: "Send an estimate to a customer", href: undefined },
    { done: estimates.some((e) => e.status === "approved") || invoices.some((i) => i.status === "paid"), label: "Get an estimate approved or invoice paid", href: undefined },
  ];
  const completedSteps = onboardingSteps.filter((s) => s.done).length;

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

  const statusBadge: Record<string, string> = {
    sent: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    approved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    declined: "bg-rose-500/15 text-rose-400 border-rose-500/20",
    unpaid: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    paid: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  };

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
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 bg-dashboard-mesh min-h-screen">
        {/* Welcome Header */}
        <div className="animate-fade-in-up">
          <p className="text-sm font-medium text-indigo-400">{today}</p>
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
            Welcome back{profile?.ownerName ? `, ${profile.ownerName}` : ""}
          </h1>
        </div>

        {/* Stats Bar */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 animate-fade-in-up delay-100">
          {/* Total Estimates */}
          <div className="relative overflow-hidden rounded-2xl border border-indigo-500/15 bg-gradient-to-br from-indigo-500/10 via-white/[0.04] to-transparent p-4 shadow-lg shadow-indigo-500/5">
            <div className="flex items-center gap-2">
              <svg className="h-3.5 w-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-xs font-medium text-slate-400">Total Estimates</p>
            </div>
            <p className="mt-2 text-3xl font-extrabold text-white">{totalEstimates}</p>
            <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-indigo-500/5" />
          </div>

          {/* Approved */}
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/15 bg-gradient-to-br from-emerald-500/10 via-white/[0.04] to-transparent p-4 shadow-lg shadow-emerald-500/5">
            <div className="flex items-center gap-2">
              <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-xs font-medium text-slate-400">Approved</p>
            </div>
            <p className="mt-2 text-3xl font-extrabold text-emerald-400">{approved}</p>
            <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-emerald-500/5" />
          </div>

          {/* Declined */}
          <div className="relative overflow-hidden rounded-2xl border border-rose-500/15 bg-gradient-to-br from-rose-500/10 via-white/[0.04] to-transparent p-4 shadow-lg shadow-rose-500/5">
            <div className="flex items-center gap-2">
              <svg className="h-3.5 w-3.5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <p className="text-xs font-medium text-slate-400">Declined</p>
            </div>
            <p className="mt-2 text-3xl font-extrabold text-rose-400">{declined}</p>
            <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-rose-500/5" />
          </div>

          {/* Total Revenue */}
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/15 bg-gradient-to-br from-emerald-500/8 via-white/[0.04] to-transparent p-4 shadow-lg shadow-emerald-500/5">
            <div className="flex items-center gap-2">
              <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs font-medium text-slate-400">Revenue</p>
            </div>
            <p className="mt-2 text-3xl font-extrabold text-white">${totalRevenue.toFixed(2)}</p>
            <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-emerald-500/5" />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3 animate-fade-in-up delay-200">
          {/* New Estimate */}
          <Link
            href="/estimate"
            className="card-hover group rounded-2xl bg-gradient-to-br from-indigo-500/8 to-transparent backdrop-blur-xl border border-white/[0.08] p-5 hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/10"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/25 to-indigo-600/10 shadow-inner">
              <svg className="h-6 w-6 text-indigo-400 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className="mt-4 text-sm font-semibold text-white">New Estimate</p>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">Create a new estimate from scratch</p>
          </Link>

          {/* Use Template */}
          <div
            className="card-hover group rounded-2xl bg-gradient-to-br from-violet-500/8 to-transparent backdrop-blur-xl border border-white/[0.08] p-5 hover:border-violet-500/30 hover:shadow-xl hover:shadow-violet-500/10 cursor-pointer"
            onClick={() => setTemplateExpanded(!templateExpanded)}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/25 to-violet-600/10 shadow-inner">
              <svg className="h-6 w-6 text-violet-400 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
            </div>
            <p className="mt-4 text-sm font-semibold text-white">Use Template</p>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">Start from a trade template</p>
            {templateExpanded && (
              <div className="mt-3 space-y-0.5 border-t border-white/[0.06] pt-3" onClick={(e) => e.stopPropagation()}>
                {tradeQuickLinks.map((t) => (
                  <Link
                    key={t.slug}
                    href={`/estimate?trade=${t.slug}`}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-violet-300 transition-all hover:bg-violet-500/10 hover:text-violet-200"
                  >
                    <span className="h-1 w-1 rounded-full bg-violet-400/50" />
                    {t.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* View Invoices */}
          <a
            href="#invoices"
            className="card-hover group rounded-2xl bg-gradient-to-br from-emerald-500/8 to-transparent backdrop-blur-xl border border-white/[0.08] p-5 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/10"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/25 to-emerald-600/10 shadow-inner">
              <svg className="h-6 w-6 text-emerald-400 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
              </svg>
            </div>
            <p className="mt-4 text-sm font-semibold text-white">View Invoices</p>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              {invoices.length} invoice{invoices.length !== 1 ? "s" : ""} total
            </p>
          </a>
        </div>

        {/* Recent Activity / Onboarding */}
        <div className="mt-8 animate-fade-in-up delay-300">
          {!hasActivity ? (
            /* Onboarding Checklist */
            <div className="rounded-2xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-xl border border-white/[0.08] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Getting Started</h3>
                  <p className="mt-0.5 text-xs text-slate-500">{completedSteps} of {onboardingSteps.length} complete</p>
                </div>
                <span className="text-xs font-bold text-indigo-400">{Math.round((completedSteps / onboardingSteps.length) * 100)}%</span>
              </div>
              {/* Progress bar */}
              <div className="mt-3 h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 animate-progress"
                  style={{ width: `${(completedSteps / onboardingSteps.length) * 100}%` }}
                />
              </div>
              <div className="mt-5 space-y-2">
                {onboardingSteps.map((step, i) => {
                  const inner = (
                    <div className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${
                      step.href && !step.done ? "hover:bg-white/[0.04] cursor-pointer" : ""
                    }`}>
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all ${
                        step.done
                          ? "bg-emerald-500/20 border border-emerald-500/30"
                          : "bg-white/[0.06] border border-white/[0.08]"
                      }`}>
                        {step.done ? (
                          <svg className="h-4 w-4 text-emerald-400 animate-check" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="text-slate-500">{i + 1}</span>
                        )}
                      </div>
                      <span className={`text-sm ${step.done ? "text-slate-500 line-through" : "text-slate-300"}`}>
                        {step.label}
                      </span>
                      {step.href && !step.done && (
                        <svg className="ml-auto h-4 w-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                  );
                  return step.href ? (
                    <Link key={i} href={step.href} className="block">
                      {inner}
                    </Link>
                  ) : (
                    <div key={i}>{inner}</div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Activity Timeline */
            <div className="rounded-2xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-xl border border-white/[0.08] p-6">
              <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
              <div className="mt-4 space-y-1">
                {recentActivity.map((item) => (
                  <div key={`${item.type}-${item.id}`} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.03]">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${statusBadge[item.status] || "bg-slate-500/15 text-slate-400 border-slate-500/20"}`}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">
                          {item.label}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.number} &middot; {item.type === "estimate" ? "Estimate" : "Invoice"}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-white">
                      ${item.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Estimates Section */}
        <div id="estimates" className="scroll-mt-6 mt-10 animate-fade-in-up delay-400">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Estimates
          </h2>

          {estimates.length === 0 ? (
            <div className="mt-3 rounded-2xl bg-gradient-to-br from-white/[0.05] to-transparent backdrop-blur-xl border border-white/[0.08] p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/15">
                <svg className="h-7 w-7 text-indigo-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="mt-4 text-sm font-medium text-slate-400">No estimates yet</p>
              <p className="mt-1 text-xs text-slate-600">Create your first estimate to get started</p>
              <Link href="/estimate" className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Estimate
              </Link>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {estimates.map((est) => (
                <div
                  key={est.id}
                  className="rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] p-4 transition-all duration-200 hover:bg-white/[0.06] hover:border-white/[0.12]"
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
                    <div className="flex shrink-0 items-center gap-2.5">
                      <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${statusBadge[est.status] || "bg-slate-500/15 text-slate-400 border-slate-500/20"}`}>
                        {est.status.charAt(0).toUpperCase() + est.status.slice(1)}
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
        <div id="invoices" className="scroll-mt-6 mt-10 animate-fade-in-up delay-500">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Invoices
          </h2>

          {invoices.length === 0 ? (
            <div className="mt-3 rounded-2xl bg-gradient-to-br from-white/[0.05] to-transparent backdrop-blur-xl border border-white/[0.08] p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/15">
                <svg className="h-7 w-7 text-emerald-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                </svg>
              </div>
              <p className="mt-4 text-sm font-medium text-slate-400">No invoices yet</p>
              <p className="mt-1 text-xs text-slate-600">Approve an estimate to create your first invoice</p>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] p-4 transition-all duration-200 hover:bg-white/[0.06] hover:border-white/[0.12]"
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
                    <div className="flex shrink-0 items-center gap-2.5">
                      <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${statusBadge[inv.status]}`}>
                        {inv.status === "unpaid" ? "Unpaid" : "Paid"}
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
