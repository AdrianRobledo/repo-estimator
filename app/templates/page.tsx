"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/app/components/AppShell";
import type { LineItem, TemplateData } from "@/lib/types";

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "form">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { id: 1, description: "", quantity: "1", price: "" },
  ]);
  const [nextId, setNextId] = useState(2);
  const [clientMessage, setClientMessage] = useState("");
  const [disclaimer, setDisclaimer] = useState("");

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setTemplates(data);
        setLoading(false);
      });
  }, []);

  function resetForm() {
    setName("");
    setJobTitle("");
    setItems([{ id: 1, description: "", quantity: "1", price: "" }]);
    setNextId(2);
    setClientMessage("");
    setDisclaimer("");
    setEditingId(null);
  }

  function startCreate() {
    resetForm();
    setView("form");
  }

  function startEdit(tmpl: TemplateData) {
    setName(tmpl.name);
    setJobTitle(tmpl.jobTitle || "");
    const loaded = tmpl.items.map((item, i) => ({ ...item, id: i + 1 }));
    setItems(loaded);
    setNextId(loaded.length + 1);
    setClientMessage(tmpl.clientMessage || "");
    setDisclaimer(tmpl.disclaimer || "");
    setEditingId(tmpl.id);
    setView("form");
  }

  function handleItemChange(id: number, field: keyof LineItem, value: string) {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  }

  function addItem() {
    setItems([...items, { id: nextId, description: "", quantity: "1", price: "" }]);
    setNextId(nextId + 1);
  }

  function addTextNote() {
    setItems([...items, { id: nextId, description: "", quantity: "0", price: "0" }]);
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

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);

    const payload = {
      name,
      jobTitle,
      items,
      clientMessage,
      disclaimer,
    };

    try {
      if (editingId) {
        const res = await fetch(`/api/templates/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setTemplates(
            templates.map((t) =>
              t.id === editingId ? { ...t, ...payload } : t
            )
          );
          resetForm();
          setView("list");
        }
      } else {
        const res = await fetch("/api/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          setTemplates([{ id: data.id, ...payload }, ...templates]);
          resetForm();
          setView("list");
        }
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
    if (res.ok) {
      setTemplates(templates.filter((t) => t.id !== id));
    }
    setDeletingId(null);
  }

  const inputClass =
    "block w-full rounded-xl bg-white/[0.05] border border-white/[0.1] px-3 py-2.5 text-white placeholder:text-slate-500 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10";

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
      <div className="mx-auto max-w-[800px] px-4 py-8">
        {view === "list" ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-white">Templates</h1>
              <button
                type="button"
                onClick={startCreate}
                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-500"
              >
                Create New Template
              </button>
            </div>

            {/* Empty state */}
            {templates.length === 0 ? (
              <div className="mt-8 rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-10 text-center">
                <svg
                  className="mx-auto h-10 w-10 text-slate-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
                  />
                </svg>
                <p className="mt-3 text-sm text-slate-400">
                  No templates yet. Save your common jobs as templates to reuse
                  them.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {templates.map((tmpl) => {
                  const tmplTotal = tmpl.items.reduce((sum, item) => {
                    const qty = parseFloat(item.quantity) || 0;
                    const price = parseFloat(item.price) || 0;
                    return sum + qty * price;
                  }, 0);

                  return (
                    <div
                      key={tmpl.id}
                      className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-4 transition-all duration-200 hover:bg-white/[0.06] hover:border-white/[0.12]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">
                            {tmpl.name}
                          </p>
                          {tmpl.jobTitle && (
                            <p className="mt-0.5 text-xs text-slate-400 truncate">
                              {tmpl.jobTitle}
                            </p>
                          )}
                          <p className="mt-0.5 text-xs text-slate-500">
                            {tmpl.items.length} item
                            {tmpl.items.length !== 1 ? "s" : ""} &middot; $
                            {tmplTotal.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            router.push(`/estimate?template=${tmpl.id}`)
                          }
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-500"
                        >
                          Use
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(tmpl)}
                          className="rounded-lg bg-white/[0.06] border border-white/[0.1] px-3 py-1.5 text-xs font-medium text-slate-300 transition-all hover:bg-white/[0.1]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(tmpl.id)}
                          disabled={deletingId === tmpl.id}
                          className="rounded-lg bg-white/[0.06] border border-white/[0.1] px-3 py-1.5 text-xs font-medium text-slate-400 transition-all hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingId === tmpl.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Form view */}
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-white">
                {editingId ? "Edit Template" : "Create Template"}
              </h1>
            </div>

            {/* Template name + job title */}
            <div className="mt-6 space-y-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Template name"
                className={inputClass}
              />
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Job title (e.g. Kitchen Remodel)"
                className={inputClass}
              />
            </div>

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
                        {item.quantity === "0" && item.price === "0"
                          ? "Text Note"
                          : `Item ${index + 1}`}
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
                        onChange={(e) =>
                          handleItemChange(item.id, "description", e.target.value)
                        }
                        placeholder={
                          item.quantity === "0" && item.price === "0"
                            ? "Note text..."
                            : "Description"
                        }
                        className="block w-full lg:flex-1 rounded-xl bg-white/[0.05] border border-white/[0.1] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10"
                      />
                      {!(item.quantity === "0" && item.price === "0") && (
                        <div className="grid grid-cols-2 gap-3 lg:flex lg:gap-3 lg:shrink-0">
                          <div className="lg:w-20">
                            <label className="text-xs text-slate-500">Qty</label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleItemChange(item.id, "quantity", e.target.value)
                              }
                              className="mt-0.5 block w-full rounded-xl bg-white/[0.05] border border-white/[0.1] px-3 py-2 text-sm text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10"
                            />
                          </div>
                          <div className="lg:w-40">
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
                              className="mt-0.5 block w-full rounded-xl bg-white/[0.05] border border-white/[0.1] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    {!(item.quantity === "0" && item.price === "0") && (
                      <div className="mt-1.5 text-right text-xs text-slate-500">
                        Subtotal: $
                        {(
                          (parseFloat(item.quantity) || 0) *
                          (parseFloat(item.price) || 0)
                        ).toFixed(2)}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  onClick={addItem}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/[0.1] py-2.5 text-sm font-medium text-slate-400 transition-all duration-200 hover:border-white/[0.2] hover:text-white"
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
                <button
                  type="button"
                  onClick={addTextNote}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/[0.1] py-2.5 text-sm font-medium text-slate-400 transition-all duration-200 hover:border-white/[0.2] hover:text-white"
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
                      d="M4 6h16M4 12h16m-7 6h7"
                    />
                  </svg>
                  Add Text Note
                </button>
              </div>
            </fieldset>

            {/* Total */}
            <div className="mt-6 flex items-baseline justify-between rounded-2xl bg-gradient-to-r from-emerald-600/60 to-emerald-500/40 px-4 py-3 shadow-lg shadow-emerald-500/20">
              <span className="text-sm font-medium text-white/70">Total</span>
              <span className="text-xl font-bold text-white">
                ${total.toFixed(2)}
              </span>
            </div>

            {/* Client Message */}
            <fieldset className="mt-6">
              <legend className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Client Message
              </legend>
              <textarea
                value={clientMessage}
                onChange={(e) => setClientMessage(e.target.value)}
                placeholder="Default message for estimates using this template..."
                rows={3}
                className="mt-2 block w-full rounded-xl bg-white/[0.05] border border-white/[0.1] px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10 resize-none"
              />
            </fieldset>

            {/* Disclaimer */}
            <fieldset className="mt-6">
              <legend className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Contract / Disclaimer
              </legend>
              <textarea
                value={disclaimer}
                onChange={(e) => setDisclaimer(e.target.value)}
                placeholder="Terms, conditions, or disclaimers to include..."
                rows={3}
                className="mt-2 block w-full rounded-xl bg-white/[0.05] border border-white/[0.1] px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10 resize-none"
              />
            </fieldset>

            {/* Save / Cancel */}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !name.trim()}
                className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/10 border-t-white" />
                )}
                {editingId ? "Update Template" : "Save Template"}
              </button>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setView("list");
                }}
                className="rounded-xl bg-white/[0.06] border border-white/[0.1] px-6 py-3 text-sm text-slate-400 transition-all hover:bg-white/[0.1]"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
