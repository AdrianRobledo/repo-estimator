"use client";

import { useState, useEffect, useRef } from "react";
import AppShell from "@/app/components/AppShell";

export default function SetupPage() {
  const [form, setForm] = useState({
    businessName: "",
    ownerName: "",
    phone: "",
    email: "",
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data && !data.error) {
          setForm({
            businessName: data.businessName || "",
            ownerName: data.ownerName || "",
            phone: data.phone || "",
            email: data.email || "",
          });
          if (data.logo) setLogoPreview(data.logo);
        }
        setLoading(false);
      });
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSaved(false);
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
      setSaved(false);
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, logo: logoPreview }),
    });
    setSaved(true);
  }

  const inputClass = "mt-1 block w-full rounded-xl bg-white/[0.05] border border-white/[0.1] px-3 py-2.5 text-white placeholder:text-slate-500 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30";

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
      <div className="mx-auto max-w-lg px-4 py-8">
        <h1 className="text-2xl font-bold text-white">
          Business Profile
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Set up your business info for estimates.
        </p>

        <div className="mt-8 rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] p-6 space-y-5">
          {/* Logo Upload */}
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-white/[0.15] bg-white/[0.05] transition-all duration-200 hover:border-white/[0.25]"
            >
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo"
                  className="h-full w-full object-cover"
                />
              ) : (
                <svg
                  className="h-8 w-8 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              )}
            </button>
            <span className="text-xs text-slate-500">
              Tap to upload logo
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="hidden"
            />
          </div>

          {/* Form Fields */}
          <div>
            <label className="block text-sm font-medium text-slate-400">
              Business Name
            </label>
            <input
              type="text"
              name="businessName"
              value={form.businessName}
              onChange={handleChange}
              placeholder="e.g. Mike's Plumbing"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400">
              Owner Name
            </label>
            <input
              type="text"
              name="ownerName"
              value={form.ownerName}
              onChange={handleChange}
              placeholder="e.g. Mike Johnson"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="(555) 123-4567"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="mike@example.com"
              className={inputClass}
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="mt-4 w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-500"
          >
            Save Profile
          </button>

          {saved && (
            <p className="text-center text-sm text-emerald-400">
              Profile saved!
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
