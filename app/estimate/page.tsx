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

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <div className="mx-auto max-w-lg px-4 py-8">
        {/* Business Header */}
        {profile && (
          <div className="mb-6 flex items-center gap-3">
            {profile.logo && (
              <img
                src={profile.logo}
                alt="Logo"
                className="h-10 w-10 rounded-full object-cover"
              />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {profile.businessName}
              </p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {profile.phone}
                {profile.phone && profile.email ? " · " : ""}
                {profile.email}
              </p>
            </div>
          </div>
        )}

        {/* Estimate Info */}
        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            New Estimate
          </h1>
        </div>
        <div className="mt-1 flex gap-4 text-sm text-zinc-500 dark:text-zinc-400">
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
              className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
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
          <legend className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Customer Info
          </legend>
          <div className="mt-2 space-y-3">
            <input
              type="text"
              name="name"
              value={customer.name}
              onChange={handleCustomerChange}
              placeholder="Customer name"
              className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-50 dark:focus:ring-zinc-50"
            />
            <input
              type="text"
              name="address"
              value={customer.address}
              onChange={handleCustomerChange}
              placeholder="Address"
              className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-50 dark:focus:ring-zinc-50"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="tel"
                name="phone"
                value={customer.phone}
                onChange={handleCustomerChange}
                placeholder="Phone"
                className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-50 dark:focus:ring-zinc-50"
              />
              <input
                type="email"
                name="email"
                value={customer.email}
                onChange={handleCustomerChange}
                placeholder="Email"
                className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-50 dark:focus:ring-zinc-50"
              />
            </div>
          </div>
        </fieldset>

        {/* Line Items */}
        <fieldset className="mt-6">
          <legend className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Line Items
          </legend>
          <div className="mt-2 space-y-3">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
                    Item {index + 1}
                  </span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-xs text-red-500 hover:text-red-600"
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
                  className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-50 dark:focus:ring-zinc-50"
                />
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-zinc-500 dark:text-zinc-400">
                      Qty
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(item.id, "quantity", e.target.value)
                      }
                      className="mt-0.5 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-50 dark:focus:ring-zinc-50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 dark:text-zinc-400">
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
                      className="mt-0.5 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-50 dark:focus:ring-zinc-50"
                    />
                  </div>
                </div>
                <div className="mt-1.5 text-right text-xs text-zinc-500 dark:text-zinc-400">
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
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-300 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-200"
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
              className="text-sm font-medium text-[#1A365D] hover:underline dark:text-blue-400"
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
                className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              />
              <button
                type="button"
                onClick={saveAsTemplate}
                className="shrink-0 rounded-lg bg-[#1A365D] px-4 py-2 text-sm font-medium text-white hover:bg-[#2B4E7C]"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => { setShowTemplateSave(false); setTemplateName(""); }}
                className="shrink-0 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Total */}
        <div className="mt-6 flex items-baseline justify-between rounded-lg bg-zinc-900 px-4 py-3 dark:bg-zinc-800">
          <span className="text-sm font-medium text-zinc-300">Total</span>
          <span className="text-xl font-bold text-white">
            ${total.toFixed(2)}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={generatePDF}
            className="rounded-lg border border-zinc-300 bg-white py-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
          >
            Download PDF
          </button>
          <button
            type="button"
            onClick={handleSend}
            className="rounded-lg bg-zinc-900 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Send to Customer
          </button>
        </div>

        {/* Share Link */}
        {shareLink && (
          <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Share this link with your customer:
            </p>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                readOnly
                value={shareLink}
                className="block w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
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
