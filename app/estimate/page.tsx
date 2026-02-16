"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";
import Navbar from "@/app/components/Navbar";
import type { LineItem, BusinessProfile, TemplateData } from "@/lib/types";

function generateEstimateNumber() {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 900 + 100);
  return `EST-${y}${m}${d}-${rand}`;
}

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function EstimatePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [estimateNumber] = useState(generateEstimateNumber);
  const [date] = useState(formatDate);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [showTemplateSave, setShowTemplateSave] = useState(false);

  const [customer, setCustomer] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
  });

  const [items, setItems] = useState<LineItem[]>([
    { id: 1, description: "", quantity: "1", price: "" },
  ]);

  const [nextId, setNextId] = useState(2);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then(setProfile);
    fetch("/api/templates")
      .then((r) => r.json())
      .then(setTemplates);
  }, []);

  function handleCustomerChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCustomer({ ...customer, [e.target.name]: e.target.value });
  }

  function handleItemChange(
    id: number,
    field: keyof LineItem,
    value: string
  ) {
    setItems(
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  }

  function addItem() {
    setItems([...items, { id: nextId, description: "", quantity: "1", price: "" }]);
    setNextId(nextId + 1);
  }

  function removeItem(id: number) {
    if (items.length === 1) return;
    setItems(items.filter((item) => item.id !== id));
  }

  function loadTemplate(templateId: string) {
    const t = templates.find((t) => t.id === templateId);
    if (!t) return;
    const loaded = t.items.map((item, i) => ({ ...item, id: nextId + i }));
    setItems(loaded);
    setNextId(nextId + loaded.length);
  }

  async function saveAsTemplate() {
    if (!templateName.trim()) return;
    const res = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: templateName, items }),
    });
    if (res.ok) {
      const data = await res.json();
      setTemplates([{ id: data.id, name: templateName, items }, ...templates]);
      setTemplateName("");
      setShowTemplateSave(false);
    }
  }

  const total = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.price) || 0;
    return sum + qty * price;
  }, 0);

  async function handleSend() {
    const res = await fetch("/api/estimates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estimateNumber, date, customer, items, total }),
    });
    if (res.ok) {
      const data = await res.json();
      const link = `${window.location.origin}/view/${data.id}`;
      setShareLink(link);
      setCopied(false);
    }
  }

  function handleCopy() {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function generatePDF() {
    // Save estimate first, then generate PDF
    const res = await fetch("/api/estimates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estimateNumber, date, customer, items, total }),
    });
    if (!res.ok) return;

    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 48;
    const contentWidth = pageWidth - margin * 2;
    let y = 0;

    // Color palette — navy + warm gray
    const navy = { r: 26, g: 54, b: 93 };
    const slate = { r: 100, g: 116, b: 139 };
    const grayBg = { r: 243, g: 244, b: 246 };
    const grayLine = { r: 209, g: 213, b: 219 };

    // ===== NAVY TOP BAR =====
    doc.setFillColor(navy.r, navy.g, navy.b);
    doc.rect(0, 0, pageWidth, 110, "F");

    let headerTextX = margin;
    if (profile?.logo) {
      try {
        doc.addImage(profile.logo, "JPEG", margin, 24, 60, 60);
        headerTextX = margin + 74;
      } catch {
        // logo failed
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
      const contactParts = [profile.ownerName, profile.phone, profile.email].filter(Boolean);
      doc.text(contactParts.join("   |   "), headerTextX, 68);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text("ESTIMATE", pageWidth - margin, 52, { align: "right" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(200, 215, 235);
    doc.text(estimateNumber, pageWidth - margin, 70, { align: "right" });
    doc.text(date, pageWidth - margin, 84, { align: "right" });

    y = 130;

    const colLeft = margin;
    const colRight = pageWidth / 2 + 20;

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(slate.r, slate.g, slate.b);
    doc.text("PREPARED FOR", colLeft, y);
    doc.text("ESTIMATE DETAILS", colRight, y);
    y += 14;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);

    let custY = y;
    if (customer.name) { doc.setFont("helvetica", "bold"); doc.text(customer.name, colLeft, custY); doc.setFont("helvetica", "normal"); custY += 15; }
    if (customer.address) { doc.text(customer.address, colLeft, custY); custY += 15; }
    if (customer.phone) { doc.text(customer.phone, colLeft, custY); custY += 15; }
    if (customer.email) { doc.text(customer.email, colLeft, custY); custY += 15; }

    let detY = y;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(slate.r, slate.g, slate.b);
    doc.setFontSize(9);
    doc.text("Estimate No.", colRight, detY);
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "bold");
    doc.text(estimateNumber, colRight + 80, detY);

    detY += 15;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(slate.r, slate.g, slate.b);
    doc.text("Date", colRight, detY);
    doc.setTextColor(50, 50, 50);
    doc.text(date, colRight + 80, detY);

    detY += 15;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(slate.r, slate.g, slate.b);
    doc.text("Valid Until", colRight, detY);
    doc.setTextColor(50, 50, 50);
    const validDate = new Date();
    validDate.setDate(validDate.getDate() + 30);
    doc.text(validDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), colRight + 80, detY);

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
    items.forEach((item, i) => {
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
    doc.text(`$${total.toFixed(2)}`, totalsValX, y + 14, { align: "right" });
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
    doc.text("TOTAL DUE", totalsX + 4, y + 22);
    doc.setFontSize(14);
    doc.text(`$${total.toFixed(2)}`, totalsValX, y + 22, { align: "right" });
    y += 52;

    if (y > pageHeight - 130) { doc.addPage(); y = margin; }

    doc.setDrawColor(grayLine.r, grayLine.g, grayLine.b);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 16;

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(navy.r, navy.g, navy.b);
    doc.text("TERMS & CONDITIONS", margin, y);
    y += 14;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(slate.r, slate.g, slate.b);
    doc.setFontSize(8);
    const terms = [
      "This estimate is valid for 30 days from the date of issue.",
      "Payment is due upon completion unless otherwise agreed in writing.",
      "Prices are subject to change if scope of work changes.",
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

    doc.save(`${estimateNumber}.pdf`);
  }

  const inputClass = "block w-full rounded-xl bg-white/[0.05] border border-white/[0.1] px-3 py-2.5 text-white placeholder:text-slate-500 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30";

  return (
    <div className="min-h-screen bg-[#0B0F1A]">
      <Navbar />
      <div className="mx-auto max-w-lg px-4 py-8">
        {/* Business Header */}
        {profile && (
          <div className="mb-6 flex items-center gap-3">
            {profile.logo && (
              <img
                src={profile.logo}
                alt="Logo"
                className="h-10 w-10 rounded-full object-cover ring-1 ring-white/10"
              />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {profile.businessName}
              </p>
              <p className="truncate text-xs text-slate-500">
                {profile.phone}
                {profile.phone && profile.email ? " · " : ""}
                {profile.email}
              </p>
            </div>
          </div>
        )}

        {/* Estimate Info */}
        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl font-bold text-white">
            New Estimate
          </h1>
        </div>
        <div className="mt-1 flex gap-4 text-sm text-slate-500">
          <span>{estimateNumber}</span>
          <span>{date}</span>
        </div>

        {/* Load Template */}
        {templates.length > 0 && (
          <div className="mt-4">
            <select
              onChange={(e) => {
                if (e.target.value) loadTemplate(e.target.value);
                e.target.value = "";
              }}
              defaultValue=""
              className="block w-full rounded-xl bg-white/[0.05] border border-white/[0.1] px-3 py-2.5 text-sm text-white focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
            >
              <option value="" disabled>
                Load from template...
              </option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Customer Info */}
        <fieldset className="mt-6">
          <legend className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Customer Info
          </legend>
          <div className="mt-2 space-y-3">
            <input
              type="text"
              name="name"
              value={customer.name}
              onChange={handleCustomerChange}
              placeholder="Customer name"
              className={inputClass}
            />
            <input
              type="text"
              name="address"
              value={customer.address}
              onChange={handleCustomerChange}
              placeholder="Address"
              className={inputClass}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="tel"
                name="phone"
                value={customer.phone}
                onChange={handleCustomerChange}
                placeholder="Phone"
                className={inputClass}
              />
              <input
                type="email"
                name="email"
                value={customer.email}
                onChange={handleCustomerChange}
                placeholder="Email"
                className={inputClass}
              />
            </div>
          </div>
        </fieldset>

        {/* Line Items */}
        <fieldset className="mt-6">
          <legend className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Line Items
          </legend>
          <div className="mt-2 space-y-3">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="rounded-2xl bg-white/[0.05] border border-white/[0.08] p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">
                    Item {index + 1}
                  </span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) =>
                    handleItemChange(item.id, "description", e.target.value)
                  }
                  placeholder="Description"
                  className="mt-2 block w-full rounded-xl bg-white/[0.05] border border-white/[0.1] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                />
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500">
                      Qty
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(item.id, "quantity", e.target.value)
                      }
                      className="mt-0.5 block w-full rounded-xl bg-white/[0.05] border border-white/[0.1] px-3 py-2 text-sm text-white focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">
                      Price ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price}
                      onChange={(e) =>
                        handleItemChange(item.id, "price", e.target.value)
                      }
                      placeholder="0.00"
                      className="mt-0.5 block w-full rounded-xl bg-white/[0.05] border border-white/[0.1] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                    />
                  </div>
                </div>
                <div className="mt-1.5 text-right text-xs text-slate-500">
                  Subtotal: $
                  {(
                    (parseFloat(item.quantity) || 0) *
                    (parseFloat(item.price) || 0)
                  ).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addItem}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/[0.1] py-2.5 text-sm font-medium text-slate-400 transition-all duration-200 hover:border-white/[0.2] hover:text-white"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Line Item
          </button>
        </fieldset>

        {/* Save as Template */}
        <div className="mt-4">
          {!showTemplateSave ? (
            <button
              type="button"
              onClick={() => setShowTemplateSave(true)}
              className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Save as Template
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Template name"
                className="block w-full rounded-xl bg-white/[0.05] border border-white/[0.1] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
              />
              <button
                type="button"
                onClick={saveAsTemplate}
                className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-500"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => { setShowTemplateSave(false); setTemplateName(""); }}
                className="shrink-0 rounded-xl bg-white/[0.06] border border-white/[0.1] px-3 py-2 text-sm text-slate-400 transition-all hover:bg-white/[0.1]"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Total */}
        <div className="mt-6 flex items-baseline justify-between rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 py-3 shadow-lg shadow-indigo-500/20">
          <span className="text-sm font-medium text-indigo-200">Total</span>
          <span className="text-xl font-bold text-white">
            ${total.toFixed(2)}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={generatePDF}
            className="rounded-xl bg-white/[0.06] border border-white/[0.1] py-3 text-sm font-medium text-slate-300 transition-all duration-200 hover:bg-white/[0.1]"
          >
            Download PDF
          </button>
          <button
            type="button"
            onClick={handleSend}
            className="rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-500"
          >
            Send to Customer
          </button>
        </div>

        {/* Share Link */}
        {shareLink && (
          <div className="mt-4 rounded-2xl bg-white/[0.05] border border-white/[0.08] p-4">
            <p className="text-sm font-medium text-slate-300">
              Share this link with your customer:
            </p>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                readOnly
                value={shareLink}
                className="block w-full rounded-xl bg-white/[0.05] border border-white/[0.1] px-3 py-2 text-sm text-slate-300"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-500"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
