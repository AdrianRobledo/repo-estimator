"use client";

import { useState, useRef } from "react";
import type { BusinessProfile } from "@/lib/types";
import { formatPhone, isValidEmail } from "@/lib/format";

interface OnboardingWizardProps {
  initialProfile: BusinessProfile | null;
  onComplete: () => void;
}

export default function OnboardingWizard({ initialProfile, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [businessName, setBusinessName] = useState(initialProfile?.businessName || "");
  const [ownerName, setOwnerName] = useState(initialProfile?.ownerName || "");
  const [phone, setPhone] = useState(initialProfile?.phone || "");
  const [email, setEmail] = useState(initialProfile?.email || "");
  const [address, setAddress] = useState(initialProfile?.address || "");
  const [logoPreview, setLogoPreview] = useState<string | null>(initialProfile?.logo || null);
  const [emailError, setEmailError] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const step1Valid = businessName.trim() && ownerName.trim();
  const step2Valid = phone.trim() && email.trim() && isValidEmail(email);

  function handleNext() {
    if (step === 1 && step1Valid) setStep(2);
    if (step === 2) {
      if (!isValidEmail(email)) { setEmailError(true); return; }
      if (step2Valid) setStep(3);
    }
  }

  async function saveProfile(includeOptional: boolean) {
    setSaving(true);
    try {
      const body: Record<string, string | null> = {
        businessName,
        ownerName,
        phone,
        email,
      };
      if (includeOptional) {
        body.address = address;
        body.logo = logoPreview;
      }
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      onComplete();
    } finally {
      setSaving(false);
    }
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  const inputClass = "mt-1 block w-full rounded-xl bg-white/[0.05] border border-white/[0.1] px-3 py-2.5 text-white placeholder:text-slate-500 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10";

  const stepTitles = [
    "Welcome to Preciso!",
    "How can customers reach you?",
    "Final touches",
  ];
  const stepSubtitles = [
    "Let\u2019s start with your business basics.",
    "So customers can get in touch.",
    "Optional \u2014 you can always update these later.",
  ];

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] p-8">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  s === step
                    ? "w-8 bg-emerald-500"
                    : s < step
                      ? "w-2 bg-emerald-500/40"
                      : "w-2 bg-white/[0.1]"
                }`}
              />
            ))}
          </div>

          <div key={step} className="animate-slide-in-right">
            <h1 className="text-2xl font-bold text-white text-center">
              {stepTitles[step - 1]}
            </h1>
            <p className="mt-2 text-sm text-slate-400 text-center">
              {stepSubtitles[step - 1]}
            </p>

            {/* Step 1: Business Name + Owner Name */}
            {step === 1 && (
              <div className="mt-8 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400">
                    Business Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Mike's Plumbing"
                    autoFocus
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400">
                    Owner Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. Mike Johnson"
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Phone + Email */}
            {step === 2 && (
              <div className="mt-8 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400">
                    Phone Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    placeholder="(555) 123-4567"
                    autoFocus
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(false); }}
                    placeholder="mike@example.com"
                    className={`${inputClass} ${emailError ? "!border-red-500/50 !ring-1 !ring-red-500/30" : ""}`}
                  />
                  {emailError && (
                    <p className="mt-1 text-xs text-red-400">Please enter a valid email</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Address + Logo (optional) */}
            {step === 3 && (
              <div className="mt-8 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400">
                    Business Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Main St, City, ST 12345"
                    autoFocus
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-white/[0.15] bg-white/[0.05] transition-all duration-200 hover:border-white/[0.25]"
                  >
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
                    ) : (
                      <svg className="h-7 w-7 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                      </svg>
                    )}
                  </button>
                  <span className="text-xs text-slate-500">Upload logo (optional)</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="mt-8 flex flex-col gap-3">
            {step < 3 && (
              <button
                onClick={handleNext}
                disabled={step === 1 ? !step1Valid : !step2Valid}
                className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            )}
            {step === 3 && (
              <button
                onClick={() => saveProfile(true)}
                disabled={saving}
                className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/10 border-t-white" />
                )}
                Complete Setup
              </button>
            )}
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="w-full rounded-xl bg-white/[0.06] py-3 text-sm font-medium text-slate-400 transition-all hover:bg-white/[0.1] hover:text-white"
              >
                Back
              </button>
            )}
            {step === 3 && (
              <button
                onClick={() => saveProfile(false)}
                disabled={saving}
                className="text-xs text-slate-500 transition-colors hover:text-slate-300"
              >
                Skip for now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
