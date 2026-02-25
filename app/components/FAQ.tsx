"use client";

import { useState } from "react";

const faqs = [
  { q: "Is Preciso really free?", a: "Yes. Create up to 3 estimates per month for free, forever. No credit card required." },
  { q: "How do my customers receive estimates?", a: "You get a shareable link. Send it via text or email. Your customer taps Approve or Decline right from their phone." },
  { q: "Can I cancel Pro anytime?", a: "Yes. Cancel anytime from your billing page. No contracts, no cancellation fees." },
  { q: "Do my customers need to download anything?", a: "No. They open the estimate link in their phone browser. No app download, no sign-up required." },
  { q: "Is my data secure?", a: "Yes. Your business data is encrypted and stored securely. Only you can access your estimates and client information." },
  { q: "Can I use Preciso on my phone?", a: "Yes. Preciso works on any device — phone, tablet, or computer. No app download needed." },
  { q: "What happens when I hit the free limit?", a: "You can upgrade to Pro for $9.99/month for unlimited estimates, invoicing, and templates. Or wait until next month for 3 more free estimates." },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="mx-auto max-w-2xl space-y-2">
      {faqs.map((faq, i) => (
        <button
          key={i}
          onClick={() => setOpen(open === i ? null : i)}
          className="w-full text-left rounded-xl bg-white/[0.04] border border-white/[0.08] px-5 py-4 transition-colors hover:bg-white/[0.06]"
        >
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium text-white">{faq.q}</span>
            <svg
              className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${open === i ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          {open === i && (
            <p className="mt-3 text-sm text-slate-400 leading-relaxed">{faq.a}</p>
          )}
        </button>
      ))}
    </div>
  );
}
