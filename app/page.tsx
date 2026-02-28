import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import LandingNav from "@/app/components/LandingNav";
import FAQ from "@/app/components/FAQ";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <div id="top" className="min-h-screen bg-mesh scroll-smooth">
      <LandingNav />

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 pt-20 pb-16 text-center">
        <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
          Professional <span className="text-emerald-400">estimates</span>
          <br />
          in 60 seconds
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-gray-400">
          Create, send, and track estimates and invoices for your home service
          business. Get paid faster with shareable links and payment tracking.
        </p>
        <div className="mt-10 flex justify-center">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-500 hover:shadow-xl hover:shadow-emerald-500/25"
          >
            Get Started Free
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Product Screenshot */}
      <section className="pb-16 pt-4">
        <div className="mx-auto max-w-3xl px-6">
          <div className="sm:rotate-1 sm:hover:rotate-0 transition-transform duration-500">
            <div className="rounded-2xl bg-[#12131A] border border-white/[0.1] shadow-2xl shadow-black/50 overflow-hidden">
              {/* Browser chrome */}
              <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-4 py-2.5">
                <div className="h-2.5 w-2.5 rounded-full bg-white/[0.1]" />
                <div className="h-2.5 w-2.5 rounded-full bg-white/[0.1]" />
                <div className="h-2.5 w-2.5 rounded-full bg-white/[0.1]" />
                <div className="ml-3 flex-1 rounded-md bg-white/[0.05] px-3 py-1">
                  <p className="text-[10px] text-slate-500">precisopro.com/view/est-260225</p>
                </div>
              </div>
              {/* Estimate content */}
              <div className="px-5 py-6 sm:px-8 sm:py-8">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-bold text-white sm:text-xl">Mike&apos;s Plumbing</p>
                    <p className="mt-0.5 text-xs text-slate-500">EST-260225-847 &middot; February 25, 2026</p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-amber-500/15 border border-amber-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-amber-400">
                    Sent
                  </span>
                </div>
                {/* Customer */}
                <div className="mt-5 rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Prepared For</p>
                  <p className="mt-1 text-sm font-medium text-white">Sarah Johnson</p>
                  <p className="text-xs text-slate-500">1847 Oak Avenue, Sacramento, CA</p>
                </div>
                {/* Line items */}
                <div className="mt-5 space-y-0">
                  <div className="flex items-center justify-between rounded-t-lg bg-emerald-600/20 px-4 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Description</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Amount</p>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
                    <div>
                      <p className="text-sm text-white">Kitchen faucet replacement</p>
                      <p className="text-[11px] text-slate-500">1 &times; $350.00</p>
                    </div>
                    <p className="text-sm font-semibold text-white">$350.00</p>
                  </div>
                  <div className="flex items-center justify-between bg-white/[0.02] px-4 py-3">
                    <div>
                      <p className="text-sm text-white">Garbage disposal install</p>
                      <p className="text-[11px] text-slate-500">1 &times; $175.00</p>
                    </div>
                    <p className="text-sm font-semibold text-white">$175.00</p>
                  </div>
                </div>
                {/* Total */}
                <div className="mt-4 flex items-baseline justify-between rounded-xl bg-gradient-to-r from-emerald-600/50 to-emerald-600/30 px-4 py-3">
                  <span className="text-sm font-medium text-white">Total</span>
                  <span className="text-xl font-bold text-white">$525.00</span>
                </div>
                {/* Approve / Decline buttons */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-emerald-600 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-emerald-500/25">
                    Approve
                  </div>
                  <div className="rounded-xl bg-white/[0.06] border border-white/[0.1] py-3 text-center text-sm font-medium text-slate-400">
                    Decline
                  </div>
                </div>
                {/* Download PDF */}
                <div className="mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] py-2.5 text-xs font-medium text-slate-500">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </div>
              </div>
            </div>
          </div>
          <p className="mt-5 text-center text-xs text-slate-500">What your customers see — approve, decline, or save a PDF copy</p>
        </div>
      </section>

      {/* Social Proof */}
      <section className="pb-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="text-sm text-slate-500">Trusted by contractors across the United States</p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
            <span className="text-xs text-slate-600">10k+ Estimates Created</span>
            <span className="hidden sm:inline text-slate-700">&middot;</span>
            <span className="text-xs text-slate-600">4.9/5 Rating</span>
            <span className="hidden sm:inline text-slate-700">&middot;</span>
            <span className="text-xs text-slate-600">60 Second Setup</span>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="border-t border-white/[0.06] py-20 scroll-mt-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-xs font-semibold uppercase tracking-widest text-slate-500">
            How It Works
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {/* Step 1 */}
            <div className="rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] p-6 transition-all duration-200 hover:bg-white/[0.08]">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <svg className="h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-emerald-400">Step 1</p>
              <h3 className="mt-2 text-base font-semibold text-white">
                Create Your Estimate
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                Build professional estimates with line items, your branding, and
                customer info in seconds.
              </p>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] p-6 transition-all duration-200 hover:bg-white/[0.08]">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <svg className="h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-emerald-400">Step 2</p>
              <h3 className="mt-2 text-base font-semibold text-white">
                Send & Get Approved
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                Share a professional link via text or email. Customers approve or
                decline with one tap.
              </p>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] p-6 transition-all duration-200 hover:bg-white/[0.08]">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <svg className="h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-emerald-400">Step 3</p>
              <h3 className="mt-2 text-base font-semibold text-white">
                Invoice & Get Paid
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                Convert approved estimates to invoices and track
                payments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trades */}
      <section id="templates" className="border-t border-white/[0.06] py-20 scroll-mt-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-xs font-semibold uppercase tracking-widest text-slate-500">
            Built for Contractors Like You
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-5">
            {[
              { trade: "Plumbing", icon: "M4 20v-8a4 4 0 014-4h0a4 4 0 014 4v4a4 4 0 004 4h0a4 4 0 004-4V4", tagline: "Send professional plumbing estimates from your truck in 60 seconds", example: "Kitchen faucet replacement", price: "$350" },
              { trade: "Electrical", icon: "M13 10V3L4 14h7v7l9-11h-7z", tagline: "Quote panel upgrades and rewiring jobs on the spot", example: "Outdoor lighting install", price: "$475" },
              { trade: "Landscaping", icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z", tagline: "Price out lawn care and hardscaping while you walk the yard", example: "Paver patio 12x12", price: "$2,800" },
              { trade: "Painting", icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01", tagline: "Estimate interior and exterior paint jobs room by room", example: "Living room repaint", price: "$600" },
              { trade: "Handyman", icon: "M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z", tagline: "Handle any repair call with a clean, branded estimate", example: "Drywall patch + paint", price: "$225" },
            ].map((t) => (
              <div
                key={t.trade}
                className="rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] p-5 transition-all duration-200 hover:bg-white/[0.08]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                  {t.trade === "Plumbing" ? (
                    <svg className="h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path strokeWidth={2.5} d="M5 5v8a4 4 0 008 0V7a4 4 0 018 0v8" />
                      <path strokeWidth={4.5} d="M11.5 10h3" />
                    </svg>
                  ) : t.trade === "Landscaping" ? (
                    <svg className="h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M12 3C8 3 4 6 4 10s3 6 8 6 8-2 8-6-4-7-8-7z" />
                      <path d="M12 16v5" />
                      <path d="M8 21h8" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d={t.icon} />
                    </svg>
                  )}
                </div>
                <h3 className="mt-4 text-base font-semibold text-white">{t.trade}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{t.tagline}</p>
                <div className="mt-4 rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Example</p>
                  <div className="mt-1 flex items-baseline justify-between gap-2">
                    <p className="text-xs text-slate-300 truncate">{t.example}</p>
                    <p className="shrink-0 text-sm font-semibold text-white">{t.price}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-slate-400">
            Create custom templates for your most common jobs and reuse them with one tap.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-white/[0.06] py-20 scroll-mt-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-xs font-semibold uppercase tracking-widest text-slate-500">
            Simple Pricing
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-sm text-slate-400">
            Start free, upgrade when you need to. No hidden fees, cancel anytime.
          </p>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {/* Free */}
            <div className="flex flex-col rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] p-8 transition-all duration-200 hover:bg-white/[0.08]">
              <div>
                <h3 className="text-lg font-bold text-white">Free</h3>
                <p className="mt-1 text-sm text-slate-500">Perfect for getting started</p>
              </div>
              <div className="mt-6">
                <span className="text-4xl font-bold text-white">$0</span>
                <span className="text-sm text-slate-500">/month</span>
              </div>
              <ul className="mt-8 flex-1 space-y-3">
                {["3 estimates per month", "PDF generation", "Shareable approval links", "Basic templates"].map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-8 block rounded-xl bg-white/[0.06] border border-white/[0.1] py-3.5 text-center text-sm font-semibold text-slate-300 transition-all hover:bg-white/[0.1] hover:text-white"
              >
                Get Started Free
              </Link>
            </div>

            {/* Pro Monthly */}
            <div className="relative flex flex-col rounded-2xl bg-white/[0.08] backdrop-blur-xl border border-emerald-500/30 ring-1 ring-emerald-500/20 p-8 shadow-lg shadow-emerald-500/10 scale-[1.02]">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-emerald-600 px-4 py-1 text-xs font-bold text-white shadow-lg shadow-emerald-500/25">
                  Recommended
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Pro Monthly</h3>
                <p className="mt-1 text-sm text-slate-500">Everything you need to grow</p>
              </div>
              <div className="mt-6">
                <span className="text-4xl font-bold text-white">$9.99</span>
                <span className="text-sm text-slate-500">/month</span>
              </div>
              <ul className="mt-8 flex-1 space-y-3">
                {["Unlimited estimates", "Invoicing and payment tracking", "Unlimited templates and clients", "Priority support"].map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-8 block rounded-xl bg-emerald-600 py-3.5 text-center text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-500 hover:shadow-xl hover:shadow-emerald-500/30"
              >
                Upgrade to Pro
              </Link>
            </div>

            {/* Pro Annual */}
            <div className="relative flex flex-col rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] p-8 transition-all duration-200 hover:bg-white/[0.08]">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-1 text-xs font-bold text-emerald-400">
                  Save 33%
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Pro Annual</h3>
                <p className="mt-1 text-sm text-slate-500">Best value for your business</p>
              </div>
              <div className="mt-6">
                <span className="text-4xl font-bold text-white">$79.99</span>
                <span className="text-sm text-slate-500">/year</span>
              </div>
              <ul className="mt-8 flex-1 space-y-3">
                {["Unlimited estimates", "Invoicing and payment tracking", "Unlimited templates and clients", "Priority support"].map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-8 block rounded-xl bg-white/[0.06] border border-white/[0.1] py-3.5 text-center text-sm font-semibold text-slate-300 transition-all hover:bg-white/[0.1] hover:text-white"
              >
                Upgrade to Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-white/[0.06] py-20 scroll-mt-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-xs font-semibold uppercase tracking-widest text-slate-500">
            Frequently Asked Questions
          </h2>
          <div className="mt-10">
            <FAQ />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] px-6 py-10">
        <div className="mx-auto max-w-4xl grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div>
            <h4 className="text-[14px] font-semibold text-white">Product</h4>
            <ul className="mt-3 flex flex-col gap-2">
              <li><a href="#how-it-works" className="text-[13px] text-[#9CA3AF] no-underline transition-colors hover:text-emerald-400">Features</a></li>
              <li><a href="#pricing" className="text-[13px] text-[#9CA3AF] no-underline transition-colors hover:text-emerald-400">Pricing</a></li>
              <li><a href="#templates" className="text-[13px] text-[#9CA3AF] no-underline transition-colors hover:text-emerald-400">Templates</a></li>
              <li><Link href="/login" className="text-[13px] text-[#9CA3AF] no-underline transition-colors hover:text-emerald-400">Sign In</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[14px] font-semibold text-white">Legal</h4>
            <ul className="mt-3 flex flex-col gap-2">
              <li><Link href="/privacy" className="text-[13px] text-[#9CA3AF] no-underline transition-colors hover:text-emerald-400">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-[13px] text-[#9CA3AF] no-underline transition-colors hover:text-emerald-400">Terms of Service</Link></li>
              <li><Link href="/refund" className="text-[13px] text-[#9CA3AF] no-underline transition-colors hover:text-emerald-400">Refund Policy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[14px] font-semibold text-white">Support</h4>
            <ul className="mt-3 flex flex-col gap-2">
              <li><a href="mailto:adrianrobledo0260@gmail.com" className="text-[13px] text-[#9CA3AF] no-underline transition-colors hover:text-emerald-400">Contact Us</a></li>
              <li><a href="#faq" className="text-[13px] text-[#9CA3AF] no-underline transition-colors hover:text-emerald-400">FAQ</a></li>
            </ul>
          </div>
        </div>
        <div className="mx-auto max-w-4xl mt-6 border-t border-white/[0.08] pt-5">
          <p className="text-center text-[12px] text-[#9CA3AF]">&copy; 2026 Preciso. All rights reserved.</p>
          <p className="mt-1.5 text-center text-[11px] text-slate-600">Built with care in California</p>
        </div>
      </footer>
    </div>
  );
}
