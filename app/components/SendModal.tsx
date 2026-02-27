"use client";

import { useState } from "react";
import { formatPhone } from "@/lib/format";

interface SendModalProps {
  type: "estimate" | "invoice";
  id: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  businessName?: string;
  onClose: () => void;
}

export default function SendModal({
  type,
  id,
  customerName,
  customerPhone,
  customerEmail,
  businessName,
  onClose,
}: SendModalProps) {
  const [copied, setCopied] = useState(false);
  const [phone, setPhone] = useState(customerPhone || "");
  const [email, setEmail] = useState(customerEmail || "");

  const label = type === "estimate" ? "Estimate" : "Invoice";
  const path = type === "estimate" ? `/view/${id}` : `/invoice/${id}`;
  const link = typeof window !== "undefined" ? `${window.location.origin}${path}` : path;
  const name = customerName || "";
  const biz = businessName || "us";

  const smsBody = `Hi ${name}, here is your ${type} from ${biz}: ${link}`.trim();
  const emailSubject = `${label} from ${biz}`;
  const emailBody = `Hi ${name},\n\nPlease find your ${type} here: ${link}\n\nThank you!`;

  function copyLink() {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const smsHref = phone
    ? `sms:${phone}?body=${encodeURIComponent(smsBody)}`
    : undefined;
  const mailHref = email
    ? `mailto:${email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
    : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm rounded-2xl bg-[#12131A] border border-white/[0.1] p-6 shadow-2xl mx-4">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h3 className="text-lg font-bold text-white">Send {label}</h3>
        <p className="mt-1 text-sm text-slate-400">
          Share this {type} with {name || "your customer"}.
        </p>

        <div className="mt-5 space-y-2.5">
          {/* Copy Link */}
          <button
            onClick={copyLink}
            className="flex w-full items-center gap-3 rounded-xl bg-white/[0.05] border border-white/[0.1] px-4 py-3 text-left transition-all hover:bg-white/[0.1]"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
              <svg className="h-4.5 w-4.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">
                {copied ? "Copied!" : "Copy Link"}
              </p>
              <p className="text-xs text-slate-500">Copy shareable link to clipboard</p>
            </div>
          </button>

          {/* Send via Text */}
          {customerPhone ? (
            <a
              href={smsHref}
              className="flex w-full items-center gap-3 rounded-xl bg-white/[0.05] border border-white/[0.1] px-4 py-3 text-left transition-all hover:bg-white/[0.1]"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
                <svg className="h-4.5 w-4.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">Send via Text</p>
                <p className="text-xs text-slate-500 truncate">{customerPhone}</p>
              </div>
            </a>
          ) : (
            <div className="rounded-xl bg-white/[0.05] border border-white/[0.1] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
                  <svg className="h-4.5 w-4.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-white">Send via Text</p>
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="(555) 123-4567"
                  className="block w-full rounded-lg bg-white/[0.05] border border-white/[0.1] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-white/20 focus:outline-none"
                />
                <a
                  href={smsHref}
                  onClick={(e) => { if (!phone) e.preventDefault(); }}
                  className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-all ${phone ? "bg-cyan-600 text-white hover:bg-cyan-500" : "bg-white/[0.06] text-slate-500 cursor-not-allowed"}`}
                >
                  Send
                </a>
              </div>
            </div>
          )}

          {/* Send via Email */}
          {customerEmail ? (
            <a
              href={mailHref}
              className="flex w-full items-center gap-3 rounded-xl bg-white/[0.05] border border-white/[0.1] px-4 py-3 text-left transition-all hover:bg-white/[0.1]"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
                <svg className="h-4.5 w-4.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">Send via Email</p>
                <p className="text-xs text-slate-500 truncate">{customerEmail}</p>
              </div>
            </a>
          ) : (
            <div className="rounded-xl bg-white/[0.05] border border-white/[0.1] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
                  <svg className="h-4.5 w-4.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-white">Send via Email</p>
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="block w-full rounded-lg bg-white/[0.05] border border-white/[0.1] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-white/20 focus:outline-none"
                />
                <a
                  href={mailHref}
                  onClick={(e) => { if (!email) e.preventDefault(); }}
                  className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-all ${email ? "bg-cyan-600 text-white hover:bg-cyan-500" : "bg-white/[0.06] text-slate-500 cursor-not-allowed"}`}
                >
                  Send
                </a>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-white/[0.06] border border-white/[0.08] py-2.5 text-sm font-medium text-slate-400 transition-all hover:bg-white/[0.1] hover:text-white"
        >
          Done
        </button>
      </div>
    </div>
  );
}
