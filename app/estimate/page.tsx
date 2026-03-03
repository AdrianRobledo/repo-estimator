"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { jsPDF } from "jspdf";
import AppShell from "@/app/components/AppShell";
import SendModal from "@/app/components/SendModal";
import type { LineItem, BusinessProfile, TemplateData, ClientData } from "@/lib/types";
import { formatPhone, isValidEmail } from "@/lib/format";
import { todayDisplayDate } from "@/lib/utils";
import { sampleEstimates } from "@/lib/sample-estimates";

function generateEstimateNumber() {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 900 + 100);
  return `EST-${y}${m}${d}-${rand}`;
}

export default function EstimatePage() {
  return (
    <Suspense>
      <EstimatePageInner />
    </Suspense>
  );
}

function EstimatePageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [editId, setEditId] = useState<string | null>(null);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [estimateNumber, setEstimateNumber] = useState("");
  const [date, setDate] = useState("");
  const [clients, setClients] = useState<ClientData[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientSearch, setClientSearch] = useState("");
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [savedStatus, setSavedStatus] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const [usage, setUsage] = useState<{ plan: string; estimatesUsed: number; estimateLimit: number | null } | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [jobDate, setJobDate] = useState("");
  const [nameError, setNameError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateSaved, setTemplateSaved] = useState(false);

  const [isSampleMode, setIsSampleMode] = useState(false);
  const [showCongratsToast, setShowCongratsToast] = useState(false);
  const [profileWarningDismissed, setProfileWarningDismissed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("profile_warning_dismissed") === "true";
    }
    return false;
  });

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
  const jobDatePickerRef = useRef<HTMLInputElement>(null);
  const clientDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(e.target as Node)) {
        setClientDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data && !data.error) setProfile(data); });
    fetch("/api/usage")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data && !data.error) setUsage(data); });
    fetch("/api/clients")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { if (Array.isArray(data)) setClients(data); });

    setEstimateNumber(generateEstimateNumber());
    setDate(todayDisplayDate());

    const jobDateParam = searchParams.get("jobDate");
    if (jobDateParam) setJobDate(jobDateParam);

    const templateId = searchParams.get("template");
    if (templateId) {
      fetch(`/api/templates/${templateId}`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (data && data.items) {
            applyTemplateData(data);
          }
        });
    }

    const editParam = searchParams.get("edit");
    if (editParam) {
      fetch(`/api/estimates/${editParam}`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (data) {
            setEditId(editParam);
            setEstimateNumber(data.estimateNumber);
            setDate(data.date);
            setCustomer(data.customer);
            setNotes(data.notes || "");
            if (data.jobDate) setJobDate(data.jobDate);
            if (data.jobTitle) setJobTitle(data.jobTitle);
            const loaded = data.items.map((item: LineItem, i: number) => ({ ...item, id: i + 1 }));
            setItems(loaded);
            setNextId(loaded.length + 1);
          }
        });
    }

    const sampleParam = searchParams.get("sample");
    if (sampleParam) {
      const sample = sampleEstimates[sampleParam] || sampleEstimates["Other"];
      if (sample) {
        setCustomer(sample.customer);
        setNotes(sample.notes);
        const loaded = sample.items.map((item, i) => ({ ...item, id: i + 1 }));
        setItems(loaded);
        setNextId(loaded.length + 1);
        setIsSampleMode(true);
      }
    }
  }, [searchParams]);

  function applyTemplateData(data: TemplateData) {
    const loaded = data.items.map((item: LineItem, i: number) => ({ ...item, id: i + 1 }));
    setItems(loaded);
    setNextId(loaded.length + 1);
    if (data.jobTitle) setJobTitle(data.jobTitle);
    if (data.clientMessage) {
      setNotes(data.clientMessage);
    }
    if (data.disclaimer) {
      setNotes((prev) => {
        const base = prev || data.clientMessage || "";
        return base ? `${base}\n\n${data.disclaimer}` : data.disclaimer!;
      });
    }
  }

  function handleCustomerChange(e: React.ChangeEvent<HTMLInputElement>) {
    let value = e.target.value;
    if (e.target.name === "phone") value = formatPhone(value);
    if (e.target.name === "email") setEmailError(false);
    setCustomer({ ...customer, [e.target.name]: value });
    setSelectedClientId(null);
    if (e.target.name === "name" && value.trim()) setNameError(false);
  }

  function handleClientSelect(client: ClientData) {
    setSelectedClientId(client.id);
    setNameError(false);
    setCustomer({
      name: client.name,
      address: client.address || "",
      phone: client.phone || "",
      email: client.email || "",
    });
    setClientSearch("");
    setClientDropdownOpen(false);
  }

  const filteredClients = clientSearch
    ? clients.filter(
        (c) =>
          c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
          (c.email && c.email.toLowerCase().includes(clientSearch.toLowerCase())) ||
          (c.phone && c.phone.includes(clientSearch))
      )
    : clients;

  function handleItemChange(id: number, field: keyof LineItem, value: string) {
    if (field === "quantity") value = value.replace(/\D/g, "");
    if (field === "price") value = value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  }

  function addItem() {
    setItems([...items, { id: nextId, description: "", quantity: "1", price: "" }]);
    setNextId(nextId + 1);
  }

  function removeItem(id: number) {
    if (items.length === 1) return;
    setItems(items.filter((item) => item.id !== id));
  }

  const total = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.price) || 0;
    return sum + qty * price;
  }, 0);

  async function handleSaveAsTemplate() {
    if (!templateName.trim()) return;
    setSavingTemplate(true);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateName.trim(),
          items: items.map(({ description, quantity, price }) => ({ description, quantity, price })),
          jobTitle: jobTitle || undefined,
          clientMessage: notes || undefined,
        }),
      });
      if (res.ok) {
        setTemplateSaved(true);
        setShowSaveTemplate(false);
        setTemplateName("");
        setTimeout(() => setTemplateSaved(false), 3000);
      }
    } catch {
      // silent
    } finally {
      setSavingTemplate(false);
    }
  }

  // Stripe checkout temporarily disabled for launch

  async function saveEstimate(status: "draft" | "sent"): Promise<string | null> {
    // Edit mode — PUT to update existing estimate
    if (editId) {
      const res = await fetch(`/api/estimates/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estimateNumber, date, jobDate: jobDate || undefined, jobTitle: jobTitle || undefined, customer, items, total, notes: notes || undefined, status }),
      });
      if (!res.ok) return null;
      return editId;
    }

    if (savedId) {
      // Already saved — if upgrading from draft to sent, update status
      if (status === "sent" && savedStatus === "draft") {
        const res = await fetch(`/api/estimates/${savedId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "sent" }),
        });
        if (res.ok) setSavedStatus("sent");
      }
      return savedId;
    }
    const res = await fetch("/api/estimates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estimateNumber, date, jobDate: jobDate || undefined, jobTitle: jobTitle || undefined, customer, items, total, notes: notes || undefined, status }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      if (res.status === 403 && errData.error === "limit_reached") {
        setShowUpgradeModal(true);
        return null;
      }
      return null;
    }
    const data = await res.json();
    setSavedId(data.id);
    setSavedStatus(status);

    // Show congrats toast for first estimate
    if (usage && usage.estimatesUsed === 0) {
      setShowCongratsToast(true);
      setTimeout(() => setShowCongratsToast(false), 8000);
    }

    // Auto-save new client if no existing client was selected
    if (!selectedClientId && customer.name.trim()) {
      fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customer.name,
          email: customer.email || undefined,
          phone: customer.phone || undefined,
          address: customer.address || undefined,
        }),
      }).catch(() => {});
    }

    return data.id;
  }

  async function handleSaveDraft() {
    if (!customer.name.trim()) { setNameError(true); return; }
    if (customer.email && !isValidEmail(customer.email)) { setEmailError(true); return; }
    setNameError(false);
    setSaving(true);
    setError(null);
    try {
      const id = await saveEstimate("draft");
      if (!id) throw new Error("Save failed");
      if (editId) { router.push(`/estimates/${editId}`); return; }
    } catch {
      setError("Could not save estimate. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSend() {
    if (!customer.name.trim()) { setNameError(true); return; }
    if (customer.email && !isValidEmail(customer.email)) { setEmailError(true); return; }
    setNameError(false);
    setSaving(true);
    setError(null);
    try {
      const id = await saveEstimate("sent");
      if (!id) throw new Error("Save failed");
      const link = `${window.location.origin}/view/${id}`;
      setShareLink(link);
      setShowSendModal(true);
    } catch {
      setError("Could not save estimate. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function generatePDF() {
    if (!customer.name.trim()) { setNameError(true); return; }
    if (customer.email && !isValidEmail(customer.email)) { setEmailError(true); return; }
    setNameError(false);
    setSaving(true);
    setError(null);
    try {
      const id = await saveEstimate("sent");
      if (!id) throw new Error("Save failed");

      const doc = new jsPDF({ unit: "pt", format: "letter" });
      const pw = doc.internal.pageSize.getWidth();
      const ph = doc.internal.pageSize.getHeight();
      const m = 48;
      const cw = pw - m * 2;
      let y = 0;

      // Brand colors
      const green = { r: 5, g: 150, b: 105 }; // emerald-600
      const darkGreen = { r: 4, g: 120, b: 87 }; // emerald-700
      const navy = { r: 15, g: 23, b: 42 }; // slate-900
      const dark = { r: 30, g: 41, b: 59 }; // slate-800
      const slate = { r: 100, g: 116, b: 139 };
      const lightSlate = { r: 148, g: 163, b: 184 };
      const grayBg = { r: 248, g: 250, b: 252 }; // slate-50
      const grayLine = { r: 226, g: 232, b: 240 }; // slate-200

      // ===== HEADER SECTION =====
      // White background header with logo + business info
      y = m;
      let logoEndX = m;
      if (profile?.logo) {
        try {
          doc.addImage(profile.logo, "JPEG", m, y - 8, 52, 52);
          logoEndX = m + 62;
        } catch { /* logo failed */ }
      }

      if (profile) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.setTextColor(navy.r, navy.g, navy.b);
        doc.text(profile.businessName || "", logoEndX, y + 12);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(slate.r, slate.g, slate.b);
        const contactLeft = [profile.ownerName, profile.phone].filter(Boolean).join("  \u00B7  ");
        if (contactLeft) doc.text(contactLeft, logoEndX, y + 28);
        if (profile.email) doc.text(profile.email, logoEndX, y + 40);
        if (profile.address) doc.text(profile.address, logoEndX, y + 52);

      }

      y += 56;

      // ===== GREEN ACCENT BAR =====
      doc.setFillColor(green.r, green.g, green.b);
      doc.rect(0, y, pw, 4, "F");
      y += 40;

      // ===== ESTIMATE TITLE ROW =====
      doc.setFont("helvetica", "bold");
      doc.setFontSize(28);
      doc.setTextColor(navy.r, navy.g, navy.b);
      doc.text("ESTIMATE", m, y);

      if (jobTitle) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(13);
        doc.setTextColor(slate.r, slate.g, slate.b);
        doc.text(jobTitle, m, y + 18);
      }

      // Right side: number + date (labels further left to avoid overlap)
      const metaLabelX = pw - m - 190;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(slate.r, slate.g, slate.b);
      doc.text("Estimate No.", metaLabelX, y - 10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(dark.r, dark.g, dark.b);
      doc.text(estimateNumber, pw - m, y - 10, { align: "right" });

      doc.setFont("helvetica", "normal");
      doc.setTextColor(slate.r, slate.g, slate.b);
      doc.text("Date", metaLabelX, y + 6);
      doc.setTextColor(dark.r, dark.g, dark.b);
      doc.text(date, pw - m, y + 6, { align: "right" });

      if (jobDate) {
        doc.setTextColor(slate.r, slate.g, slate.b);
        doc.text("Scheduled Date", metaLabelX, y + 22);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(green.r, green.g, green.b);
        const jd = new Date(jobDate + "T00:00:00");
        doc.text(jd.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), pw - m, y + 22, { align: "right" });
      }

      y += jobDate ? 48 : 36;
      if (jobTitle) y += 18;

      // ===== PREPARED FOR BOX =====
      // Calculate dynamic box height based on content
      doc.setFontSize(10);
      let custContentH = 0;
      const addrWrapped = customer.address ? doc.splitTextToSize(customer.address, cw - 28) : [];
      if (customer.name) custContentH += 14;
      custContentH += addrWrapped.length * 14;
      if (customer.phone || customer.email) custContentH += 14;
      const boxH = Math.max(60, 36 + custContentH + 8);

      doc.setFillColor(grayBg.r, grayBg.g, grayBg.b);
      doc.setDrawColor(grayLine.r, grayLine.g, grayLine.b);
      doc.setLineWidth(0.75);
      doc.roundedRect(m, y, cw, boxH, 6, 6, "FD");

      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(green.r, green.g, green.b);
      doc.text("PREPARED FOR", m + 14, y + 16);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(dark.r, dark.g, dark.b);
      doc.setFontSize(10);
      let cy = y + 32;
      if (customer.name) {
        doc.setFont("helvetica", "bold");
        doc.text(customer.name, m + 14, cy);
        doc.setFont("helvetica", "normal");
        cy += 14;
      }
      if (addrWrapped.length > 0) {
        doc.setTextColor(slate.r, slate.g, slate.b);
        addrWrapped.forEach((line: string) => {
          doc.text(line, m + 14, cy);
          cy += 14;
        });
      }
      const custContact = [customer.phone, customer.email].filter(Boolean).join("  \u00B7  ");
      if (custContact) {
        doc.setTextColor(slate.r, slate.g, slate.b);
        doc.setFontSize(9);
        doc.text(custContact, m + 14, cy);
      }

      y += boxH + 20;

      // ===== LINE ITEMS TABLE =====
      const colDesc = m;
      const colQty = m + cw * 0.52;
      const colPrice = m + cw * 0.72;
      const colAmount = pw - m;
      const rowH = 30;

      // Table header with green background
      doc.setFillColor(darkGreen.r, darkGreen.g, darkGreen.b);
      doc.roundedRect(m, y, cw, rowH, 4, 4, "F");
      // Cover bottom corners so only top is rounded
      doc.setFillColor(darkGreen.r, darkGreen.g, darkGreen.b);
      doc.rect(m, y + rowH - 6, cw, 6, "F");

      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("DESCRIPTION", colDesc + 12, y + 19);
      doc.text("QTY", colQty, y + 19, { align: "right" });
      doc.text("UNIT PRICE", colPrice, y + 19, { align: "right" });
      doc.text("AMOUNT", colAmount - 12, y + 19, { align: "right" });
      y += rowH;

      // Table rows
      doc.setFontSize(9);
      const descMaxW = colQty - colDesc - 24;
      items.forEach((item, i) => {
        const qty = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.price) || 0;
        const amount = qty * price;

        // Wrap description text
        const descLines: string[] = doc.splitTextToSize(item.description || "\u2014", descMaxW);
        const currentRowH = Math.max(rowH, descLines.length * 13 + 16);

        if (y > ph - 150) { doc.addPage(); y = m; }

        if (i % 2 === 0) {
          doc.setFillColor(grayBg.r, grayBg.g, grayBg.b);
          doc.rect(m, y, cw, currentRowH, "F");
        }

        // Left border accent on every row
        doc.setFillColor(green.r, green.g, green.b);
        doc.rect(m, y, 2, currentRowH, "F");

        doc.setFont("helvetica", "normal");
        doc.setTextColor(dark.r, dark.g, dark.b);
        let descY = y + 14;
        descLines.forEach((line: string) => {
          doc.text(line, colDesc + 12, descY);
          descY += 13;
        });
        const midY = y + currentRowH / 2 + 3;
        doc.setTextColor(slate.r, slate.g, slate.b);
        doc.text(qty.toString(), colQty, midY, { align: "right" });
        doc.text(`$${price.toFixed(2)}`, colPrice, midY, { align: "right" });
        doc.setFont("helvetica", "bold");
        doc.setTextColor(dark.r, dark.g, dark.b);
        doc.text(`$${amount.toFixed(2)}`, colAmount - 12, midY, { align: "right" });
        y += currentRowH;

        // Row separator
        doc.setDrawColor(grayLine.r, grayLine.g, grayLine.b);
        doc.setLineWidth(0.5);
        doc.line(m, y, pw - m, y);
      });

      y += 12;

      // ===== TOTALS =====
      const totalsX = pw - m - 200;
      const totalsValX = pw - m - 12;

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(slate.r, slate.g, slate.b);
      doc.text("Subtotal", totalsX, y + 14);
      doc.setTextColor(dark.r, dark.g, dark.b);
      doc.text(`$${total.toFixed(2)}`, totalsValX, y + 14, { align: "right" });
      y += 24;

      doc.setDrawColor(grayLine.r, grayLine.g, grayLine.b);
      doc.setLineWidth(0.5);
      doc.line(totalsX, y, pw - m, y);
      y += 4;

      // Total due box with green gradient feel
      doc.setFillColor(green.r, green.g, green.b);
      doc.roundedRect(totalsX - 10, y, 222, 38, 6, 6, "F");
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("TOTAL DUE", totalsX + 6, y + 24);
      doc.setFontSize(16);
      doc.text(`$${total.toFixed(2)}`, totalsValX, y + 24, { align: "right" });
      y += 56;

      // ===== NOTES =====
      if (notes) {
        if (y > ph - 140) { doc.addPage(); y = m; }

        doc.setFillColor(grayBg.r, grayBg.g, grayBg.b);
        doc.setDrawColor(grayLine.r, grayLine.g, grayLine.b);
        doc.setLineWidth(0.5);
        const noteLines = doc.splitTextToSize(notes, cw - 28);
        const notesBoxH = 34 + noteLines.length * 12;
        doc.roundedRect(m, y, cw, notesBoxH, 4, 4, "FD");

        // Green left accent
        doc.setFillColor(green.r, green.g, green.b);
        doc.rect(m, y + 4, 3, notesBoxH - 8, "F");

        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(green.r, green.g, green.b);
        doc.text("NOTES", m + 14, y + 16);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(slate.r, slate.g, slate.b);
        doc.setFontSize(8.5);
        let ny = y + 30;
        noteLines.forEach((line: string) => {
          doc.text(line, m + 14, ny);
          ny += 12;
        });
        y += notesBoxH + 16;
      }

      // ===== TERMS & CONDITIONS =====
      if (y > ph - 120) { doc.addPage(); y = m; }

      doc.setDrawColor(grayLine.r, grayLine.g, grayLine.b);
      doc.setLineWidth(0.5);
      doc.line(m, y, pw - m, y);
      y += 16;

      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(navy.r, navy.g, navy.b);
      doc.text("TERMS & CONDITIONS", m, y);
      y += 14;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(slate.r, slate.g, slate.b);
      doc.setFontSize(8);
      const terms = [
        "This estimate is valid for 30 days from the date of issue.",
        "Payment is due upon completion unless otherwise agreed in writing.",
        "Prices are subject to change if scope of work changes.",
      ];
      terms.forEach((line) => { doc.text(`\u2022  ${line}`, m, y); y += 13; });

      // ===== FOOTER =====
      const footY = ph - 44;
      doc.setFillColor(navy.r, navy.g, navy.b);
      doc.rect(0, footY, pw, 44, "F");
      // Green accent line at top of footer
      doc.setFillColor(green.r, green.g, green.b);
      doc.rect(0, footY, pw, 2, "F");

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(200, 215, 235);
      doc.text("This estimate is valid for 30 days  \u00B7  Powered by Preciso", pw / 2, footY + 26, { align: "center" });

      doc.save(`${estimateNumber}.pdf`);
    } catch {
      setError("Could not save estimate. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "block w-full rounded-xl bg-white/[0.05] border border-white/[0.1] px-3 py-2.5 text-white placeholder:text-slate-500 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10";
  return (
    <AppShell>
      <div className="mx-auto max-w-[800px] px-4 py-8">
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
                {profile.phone && profile.email ? " \u00b7 " : ""}
                {profile.email}
              </p>
            </div>
          </div>
        )}

        {/* Profile incomplete warning */}
        {profile && !profile.businessName && !profileWarningDismissed && (
          <div className="mb-6 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 flex items-start gap-3">
            <svg className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-400">Complete your business profile</p>
              <p className="mt-0.5 text-xs text-amber-400/70">Your estimates need a business name, phone, and email to look professional.</p>
            </div>
            <a
              href="/setup"
              className="shrink-0 rounded-lg bg-amber-500/15 border border-amber-500/25 px-3 py-1.5 text-xs font-medium text-amber-400 transition-all hover:bg-amber-500/25"
            >
              Set Up Profile
            </a>
            <button
              onClick={() => {
                setProfileWarningDismissed(true);
                localStorage.setItem("profile_warning_dismissed", "true");
              }}
              className="shrink-0 text-amber-400/50 hover:text-amber-400 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Sample Mode Banner */}
        {isSampleMode && (
          <div className="mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-1.5 w-12 rounded-full bg-emerald-500" />
              <div className="h-1.5 w-12 rounded-full bg-emerald-500" />
            </div>
            <p className="text-xs text-emerald-400/70 mb-2">Step 2 of 2: Your first estimate</p>
            <p className="text-sm text-emerald-300">
              This is a sample estimate for your trade. Edit it to match a real job, or start fresh!
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setIsSampleMode(false)}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-500"
              >
                Edit This Estimate
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomer({ name: "", address: "", phone: "", email: "" });
                  setItems([{ id: 1, description: "", quantity: "1", price: "" }]);
                  setNextId(2);
                  setNotes("");
                  setIsSampleMode(false);
                }}
                className="rounded-lg bg-white/[0.06] border border-white/[0.1] px-4 py-2 text-xs font-medium text-slate-300 transition-all hover:bg-white/[0.1]"
              >
                Start Fresh
              </button>
            </div>
          </div>
        )}

        <h1 className="text-2xl font-bold text-white">{editId ? "Edit Estimate" : "New Estimate"}</h1>
        <div className="mt-1 flex items-center gap-4 text-sm text-slate-500">
          <span>{estimateNumber}</span>
          <span>{date}</span>
          {usage && usage.plan === "free" && usage.estimateLimit && (
            <span className="ml-auto rounded-full bg-white/[0.06] border border-white/[0.1] px-3 py-0.5 text-xs text-slate-400">
              {usage.estimatesUsed} of {usage.estimateLimit} estimates used
            </span>
          )}
        </div>

        {/* Job Title */}
        <div className="mt-3">
          <label className="text-xs font-medium text-slate-500">Job Title (optional)</label>
          <input
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="e.g. Backyard Patio, Kitchen Remodel..."
            className="mt-1 block w-full rounded-xl bg-white/[0.05] border border-white/[0.1] px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10"
          />
        </div>

        {/* Job Date */}
        <div className="mt-3">
          <label className="text-xs font-medium text-slate-500">Job Date (optional)</label>
          <div className="mt-1 flex items-center gap-2 max-w-[280px]">
            <input
              type="text"
              readOnly
              value={jobDate ? new Date(jobDate + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : ""}
              onClick={() => jobDatePickerRef.current?.showPicker()}
              placeholder="No date selected"
              className="block w-full rounded-xl bg-white/[0.05] border border-white/[0.1] px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10 cursor-pointer"
            />
            <input
              ref={jobDatePickerRef}
              type="date"
              value={jobDate}
              onChange={(e) => setJobDate(e.target.value)}
              className="sr-only"
              tabIndex={-1}
            />
            {jobDate && (
              <button
                type="button"
                onClick={() => setJobDate("")}
                className="shrink-0 text-slate-500 transition-colors hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Saved badge */}
        {savedId && (
          <div className="mt-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 text-sm text-emerald-400 flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Estimate saved{savedStatus === "draft" ? " as draft" : ""}
          </div>
        )}

        {/* Customer Info */}
        <fieldset className="mt-6">
          <legend className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Customer Info
          </legend>
          <div className="mt-2 space-y-3">
            {/* Client selector */}
            {clients.length > 0 && (
              <div className="relative" ref={clientDropdownRef}>
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <input
                    type="text"
                    value={clientSearch}
                    onChange={(e) => {
                      setClientSearch(e.target.value);
                      setClientDropdownOpen(true);
                    }}
                    onFocus={() => setClientDropdownOpen(true)}
                    placeholder="Select existing client..."
                    className="block w-full rounded-xl bg-white/[0.05] border border-white/[0.1] pl-10 pr-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10"
                  />
                </div>
                {clientDropdownOpen && filteredClients.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-xl bg-[#141826] border border-white/[0.1] shadow-xl max-h-48 overflow-y-auto">
                    {filteredClients.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleClientSelect(c)}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-300 hover:bg-white/[0.06] first:rounded-t-xl last:rounded-b-xl transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-white truncate">{c.name}</p>
                          {(c.email || c.phone) && (
                            <p className="text-xs text-slate-500 truncate">
                              {[c.phone, c.email].filter(Boolean).join(" \u00b7 ")}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {clientDropdownOpen && filteredClients.length === 0 && clientSearch && (
                  <div className="absolute z-10 mt-1 w-full rounded-xl bg-[#141826] border border-white/[0.1] shadow-xl px-4 py-3">
                    <p className="text-sm text-slate-500">No matching clients</p>
                  </div>
                )}
                <p className="mt-1 text-xs text-slate-600">or enter new client details below</p>
              </div>
            )}
            <div>
              <input
                type="text"
                name="name"
                value={customer.name}
                onChange={handleCustomerChange}
                placeholder="Customer name *"
                className={`${inputClass} ${nameError ? "!border-red-500/50 !ring-1 !ring-red-500/30" : ""}`}
              />
              {nameError && (
                <p className="mt-1 text-xs text-red-400">Customer name is required</p>
              )}
            </div>
            <input
              type="text"
              name="address"
              value={customer.address}
              onChange={handleCustomerChange}
              placeholder="Address"
              className={inputClass}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                type="tel"
                inputMode="tel"
                name="phone"
                value={customer.phone}
                onChange={handleCustomerChange}
                placeholder="(555) 123-4567"
                className={inputClass}
              />
              <div>
                <input
                  type="email"
                  name="email"
                  value={customer.email}
                  onChange={handleCustomerChange}
                  placeholder="Email"
                  className={`${inputClass} ${emailError ? "!border-red-500/50 !ring-1 !ring-red-500/30" : ""}`}
                />
                {emailError && (
                  <p className="mt-1 text-xs text-red-400">Please enter a valid email</p>
                )}
              </div>
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
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="mt-2 flex flex-col gap-2 lg:flex-row lg:items-end lg:gap-3">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                    placeholder="Description"
                    className="block w-full lg:flex-1 rounded-xl bg-white/[0.05] border border-white/[0.1] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10"
                  />
                  <div className="grid grid-cols-2 gap-3 lg:flex lg:gap-3 lg:shrink-0">
                    <div className="lg:w-20">
                      <label className="text-xs text-slate-500">Qty</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, "quantity", e.target.value)}
                        className="mt-0.5 block w-full rounded-xl bg-white/[0.05] border border-white/[0.1] px-3 py-2 text-sm text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10"
                      />
                    </div>
                    <div className="lg:w-40">
                      <label className="text-xs text-slate-500">Price ($)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={item.price}
                        onChange={(e) => handleItemChange(item.id, "price", e.target.value)}
                        placeholder="0.00"
                        className="mt-0.5 block w-full rounded-xl bg-white/[0.05] border border-white/[0.1] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-1.5 text-right text-xs text-slate-500">
                  Subtotal: ${((parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0)).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addItem}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/[0.1] py-2.5 text-sm font-medium text-slate-400 transition-all duration-200 hover:border-white/[0.2] hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Line Item
          </button>
        </fieldset>

        {/* Notes */}
        <fieldset className="mt-6">
          <legend className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Notes
          </legend>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes, terms, or special instructions..."
            rows={3}
            className="mt-2 block w-full rounded-xl bg-white/[0.05] border border-white/[0.1] px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10 resize-none"
          />
        </fieldset>

        {/* Total */}
        <div className="mt-6 flex items-baseline justify-between rounded-2xl bg-gradient-to-r from-emerald-600/50 to-emerald-600/30 px-4 py-3 shadow-lg shadow-emerald-500/20">
          <span className="text-sm font-medium text-white">Total</span>
          <span className="text-xl font-bold text-white">${total.toFixed(2)}</span>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 space-y-2">
          <button
            type="button"
            onClick={handleSend}
            disabled={saving}
            className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/10 border-t-white" />
            )}
            Send to Customer
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving || (!!savedId && !editId)}
              className="rounded-xl bg-white/[0.06] py-3 text-sm font-medium text-slate-400 transition-all duration-200 hover:bg-white/[0.1] hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving && !showSendModal && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/10 border-t-white" />
              )}
              {editId ? "Save Changes" : "Save Draft"}
            </button>
            <button
              type="button"
              onClick={generatePDF}
              disabled={saving}
              className="rounded-xl bg-white/[0.06] border border-white/[0.1] py-3 text-sm font-medium text-slate-300 transition-all duration-200 hover:bg-white/[0.1] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Download PDF
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mt-3 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Template Saved Banner */}
        {templateSaved && (
          <div className="mt-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 text-sm text-emerald-400 flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Template saved
          </div>
        )}

        {/* Save as Template */}
        <div className="mt-4 border-t border-white/[0.06] pt-4">
          {!showSaveTemplate ? (
            <button
              type="button"
              onClick={() => setShowSaveTemplate(true)}
              className="flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-300"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
              Save as Template
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Template name"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") handleSaveAsTemplate(); if (e.key === "Escape") { setShowSaveTemplate(false); setTemplateName(""); } }}
                className="block w-full rounded-xl bg-white/[0.05] border border-white/[0.1] px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10"
              />
              <button
                type="button"
                onClick={handleSaveAsTemplate}
                disabled={savingTemplate || !templateName.trim()}
                className="shrink-0 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingTemplate ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => { setShowSaveTemplate(false); setTemplateName(""); }}
                className="shrink-0 rounded-xl bg-white/[0.06] px-3 py-2.5 text-sm text-slate-400 transition-all hover:bg-white/[0.1] hover:text-white"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Congrats Toast — first estimate */}
      {showCongratsToast && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in-up">
          <div className="flex items-center gap-3 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-emerald-500/25">
            <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Nice! Now send it to your customer.
            <button
              onClick={() => { setShowCongratsToast(false); handleSend(); }}
              className="ml-2 rounded-lg bg-white/20 px-3 py-1 text-xs font-bold text-white transition-all hover:bg-white/30"
            >
              Send
            </button>
            <button onClick={() => setShowCongratsToast(false)} className="ml-1 text-white/70 hover:text-white">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Send Modal */}
      {showSendModal && shareLink && (
        <SendModal
          type="estimate"
          id={shareLink.split("/view/")[1] || ""}
          customerName={customer.name}
          customerPhone={customer.phone}
          customerEmail={customer.email}
          businessName={profile?.businessName}
          onClose={() => router.push(`/estimates/${savedId || editId}`)}
        />
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowUpgradeModal(false)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-[#12131A] border border-white/[0.1] p-8 shadow-2xl mx-4">

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                <svg className="h-6 w-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">
                You&apos;ve reached your 3 free estimates this month
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                Upgrade to Pro for unlimited estimates, invoicing, and payment tracking.
              </p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={async () => {
                  const res = await fetch("/api/stripe/checkout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ type: "subscription", interval: "monthly" }),
                  });
                  const data = await res.json();
                  if (data.url) window.location.href = data.url;
                }}
                className="rounded-xl bg-white/[0.08] border border-white/[0.1] py-3 text-center text-sm font-medium text-white transition-all hover:bg-white/[0.12]"
              >
                <span className="block text-lg font-bold">$9.99</span>
                <span className="text-xs text-slate-400">per month</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  const res = await fetch("/api/stripe/checkout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ type: "subscription", interval: "annual" }),
                  });
                  const data = await res.json();
                  if (data.url) window.location.href = data.url;
                }}
                className="rounded-xl bg-emerald-600 py-3 text-center text-sm font-medium text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-500"
              >
                <span className="block text-lg font-bold">$79.99</span>
                <span className="text-xs text-emerald-200">per year — save 33%</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowUpgradeModal(false)}
              className="mt-3 w-full py-2 text-center text-xs text-slate-500 hover:text-slate-400 transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
