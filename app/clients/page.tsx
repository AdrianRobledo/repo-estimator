"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/app/components/AppShell";
import type { ClientData, EstimateData, InvoiceData } from "@/lib/types";

function getInvoiceDisplayStatus(dueDate: string, status: string): string {
  if (status === "paid") return "paid";
  if (status === "unpaid") {
    const due = new Date(dueDate + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (due < today) return "overdue";
  }
  return status;
}

function formatDisplayDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const estStatusBadge: Record<string, string> = {
  draft: "bg-slate-500/10 text-slate-400",
  sent: "bg-amber-500/10 text-amber-400",
  approved: "bg-emerald-500/10 text-emerald-400",
  declined: "bg-red-500/10 text-red-400",
};

const invStatusBadge: Record<string, string> = {
  unpaid: "bg-amber-500/10 text-amber-400",
  paid: "bg-emerald-500/10 text-emerald-400",
  overdue: "bg-red-500/10 text-red-400",
};

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "detail" | "form">("list");
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  // Detail view state
  const [clientEstimates, setClientEstimates] = useState<EstimateData[]>([]);
  const [clientInvoices, setClientInvoices] = useState<InvoiceData[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const fetchClients = useCallback((q?: string) => {
    const url = q ? `/api/clients?q=${encodeURIComponent(q)}` : "/api/clients";
    fetch(url)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setClients(data);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClients(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchClients]);

  function resetForm() {
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setEditingId(null);
  }

  function startCreate() {
    resetForm();
    setView("form");
  }

  function startEdit(client: ClientData) {
    setName(client.name);
    setEmail(client.email || "");
    setPhone(client.phone || "");
    setAddress(client.address || "");
    setEditingId(client.id);
    setView("form");
  }

  async function openDetail(client: ClientData) {
    setSelectedClient(client);
    setView("detail");
    setDetailLoading(true);

    try {
      const [estRes, invRes] = await Promise.all([
        fetch("/api/estimates"),
        fetch("/api/invoices"),
      ]);

      const estimates: EstimateData[] = estRes.ok ? await estRes.json() : [];
      const invoices: InvoiceData[] = invRes.ok ? await invRes.json() : [];

      const matched = estimates.filter(
        (e) =>
          (client.email && e.customer.email?.toLowerCase() === client.email.toLowerCase()) ||
          (client.name && e.customer.name?.toLowerCase() === client.name.toLowerCase())
      );
      setClientEstimates(matched);

      const matchedEstimateIds = new Set(matched.map((e) => e.id));
      const matchedInvoices = invoices.filter((inv) =>
        matchedEstimateIds.has(inv.estimateId)
      );
      setClientInvoices(matchedInvoices);
    } catch {
      setClientEstimates([]);
      setClientInvoices([]);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);

    const payload = { name, email, phone, address };

    try {
      if (editingId) {
        const res = await fetch(`/api/clients/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setClients(
            clients.map((c) =>
              c.id === editingId ? { ...c, ...payload } : c
            )
          );
          resetForm();
          setView("list");
        }
      } else {
        const res = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          if (!data.existing) {
            setClients([...clients, { id: data.id, ...payload }].sort((a, b) => a.name.localeCompare(b.name)));
          }
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
    const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
    if (res.ok) {
      setClients(clients.filter((c) => c.id !== id));
      if (selectedClient?.id === id) {
        setView("list");
        setSelectedClient(null);
      }
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
        {view === "list" && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">Clients</h1>
                <p className="mt-1 text-sm text-slate-500">
                  {clients.length} client{clients.length !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={startCreate}
                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-500"
              >
                Add Client
              </button>
            </div>

            {/* Search */}
            <div className="mt-4">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search clients by name..."
                  className="block w-full rounded-xl bg-white/[0.05] border border-white/[0.1] pl-10 pr-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10"
                />
              </div>
            </div>

            {/* Client list */}
            {clients.length === 0 ? (
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
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <p className="mt-3 text-sm text-slate-400">
                  {search
                    ? "No clients match your search."
                    : "No clients yet. Clients are automatically saved when you create estimates."}
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {clients.map((client) => (
                  <div
                    key={client.id}
                    className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-4 transition-all duration-200 hover:bg-white/[0.06] hover:border-white/[0.12] cursor-pointer"
                    onClick={() => openDetail(client)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {client.name}
                        </p>
                        <div className="mt-1 space-y-0.5">
                          {client.phone && (
                            <p className="text-xs text-slate-400">{client.phone}</p>
                          )}
                          {client.email && (
                            <p className="text-xs text-slate-400">{client.email}</p>
                          )}
                          {client.address && (
                            <p className="text-xs text-slate-500">{client.address}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2.5">
                        {(client.estimateCount ?? 0) > 0 && (
                          <span className="rounded-full bg-white/[0.06] border border-white/[0.1] px-2 py-0.5 text-[11px] font-medium text-slate-400">
                            {client.estimateCount} estimate{client.estimateCount !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => startEdit(client)}
                        className="rounded-lg bg-white/[0.06] border border-white/[0.1] px-3 py-1.5 text-xs font-medium text-slate-300 transition-all hover:bg-white/[0.1]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(client.id)}
                        disabled={deletingId === client.id}
                        className="rounded-lg bg-white/[0.06] border border-white/[0.1] px-3 py-1.5 text-xs font-medium text-slate-400 transition-all hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingId === client.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {view === "detail" && selectedClient && (
          <>
            {/* Back button + header */}
            <button
              type="button"
              onClick={() => {
                setView("list");
                setSelectedClient(null);
              }}
              className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <h1 className="mt-4 text-2xl font-bold text-white">{selectedClient.name}</h1>

            {/* Contact info */}
            <div className="mt-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] p-4 space-y-2">
              {selectedClient.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500">Phone:</span>
                  <span className="text-slate-300">{selectedClient.phone}</span>
                </div>
              )}
              {selectedClient.email && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500">Email:</span>
                  <span className="text-slate-300">{selectedClient.email}</span>
                </div>
              )}
              {selectedClient.address && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500">Address:</span>
                  <span className="text-slate-300">{selectedClient.address}</span>
                </div>
              )}
              {!selectedClient.phone && !selectedClient.email && !selectedClient.address && (
                <p className="text-sm text-slate-500">No contact info on file.</p>
              )}
            </div>

            {/* Actions */}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => startEdit(selectedClient)}
                className="rounded-xl bg-white/[0.06] border border-white/[0.1] px-4 py-2.5 text-sm font-medium text-slate-300 transition-all hover:bg-white/[0.1]"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleDelete(selectedClient.id)}
                disabled={deletingId === selectedClient.id}
                className="rounded-xl bg-white/[0.06] border border-white/[0.1] px-4 py-2.5 text-sm font-medium text-slate-400 transition-all hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingId === selectedClient.id ? "Deleting..." : "Delete"}
              </button>
            </div>

            {/* Estimates */}
            <div className="mt-8">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Estimates
              </h2>
              {detailLoading ? (
                <div className="mt-4 flex justify-center">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-white" />
                </div>
              ) : clientEstimates.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No estimates found for this client.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {clientEstimates.map((est) => (
                    <div
                      key={est.id}
                      onClick={() => router.push(`/view/${est.id}`)}
                      className="flex items-center justify-between rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-3 cursor-pointer transition-all hover:bg-white/[0.06]"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white">{est.estimateNumber}</p>
                        <p className="text-xs text-slate-500">{est.date}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${estStatusBadge[est.status] || "bg-slate-500/10 text-slate-400"}`}>
                          {est.status}
                        </span>
                        <span className="text-sm font-semibold text-white">${est.total.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Invoices */}
            <div className="mt-8">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Invoices
              </h2>
              {detailLoading ? (
                <div className="mt-4 flex justify-center">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-white" />
                </div>
              ) : clientInvoices.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No invoices found for this client.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {clientInvoices.map((inv) => {
                    const displayStatus = getInvoiceDisplayStatus(inv.dueDate, inv.status);
                    return (
                      <div
                        key={inv.id}
                        onClick={() => router.push(`/invoice/${inv.id}`)}
                        className="flex items-center justify-between rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-3 cursor-pointer transition-all hover:bg-white/[0.06]"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white">{inv.invoiceNumber}</p>
                          <p className="text-xs text-slate-500">Due {formatDisplayDate(inv.dueDate)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${invStatusBadge[displayStatus] || "bg-slate-500/10 text-slate-400"}`}>
                            {displayStatus}
                          </span>
                          <span className="text-sm font-semibold text-white">${inv.total.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {view === "form" && (
          <>
            <h1 className="text-2xl font-bold text-white">
              {editingId ? "Edit Client" : "Add Client"}
            </h1>

            <div className="mt-6 space-y-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Client name"
                className={inputClass}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className={inputClass}
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone"
                className={inputClass}
              />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Address"
                className={inputClass}
              />
            </div>

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
                {editingId ? "Update Client" : "Save Client"}
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
