import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import LandingNav from "@/app/components/LandingNav";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <div id="top" className="min-h-screen bg-mesh scroll-smooth">
      <LandingNav />

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 pt-20 pb-16 text-center">
        <h1 className="bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-4xl font-bold leading-tight tracking-tight text-transparent sm:text-5xl">
          Professional estimates
          <br />
          in 60 seconds
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-slate-400">
          Create, send, and track estimates and invoices for your home service
          business. Get paid faster with shareable links and online payments.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/signup"
            className="animate-glow rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-500 hover:shadow-xl hover:shadow-indigo-500/30"
          >
            Get Started Free
          </Link>
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
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/15">
                <svg className="h-5 w-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-indigo-400">Step 1</p>
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
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/15">
                <svg className="h-5 w-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-indigo-400">Step 2</p>
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
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/15">
                <svg className="h-5 w-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-indigo-400">Step 3</p>
              <h3 className="mt-2 text-base font-semibold text-white">
                Invoice & Get Paid
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                Convert approved estimates to invoices. Accept credit card
                payments through Stripe.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Templates */}
      <section id="templates" className="border-t border-white/[0.06] py-20 scroll-mt-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-xs font-semibold uppercase tracking-widest text-slate-500">
            Built for Your Trade
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {/* Plumbing */}
            <div className="rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] p-6 transition-all duration-200 hover:bg-white/[0.08]">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/15">
                <svg className="h-5 w-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h3 className="mt-4 text-base font-semibold text-white">Plumbing</h3>
              <div className="mt-3 space-y-1.5">
                <div className="flex justify-between text-sm"><span className="text-slate-400">Diagnose & repair leak</span><span className="text-slate-500">$185</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-400">Replace supply valve</span><span className="text-slate-500">$45</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-400">Materials & fittings</span><span className="text-slate-500">$65</span></div>
              </div>
              <div className="mt-4 flex justify-between border-t border-white/[0.08] pt-3">
                <span className="text-xs text-slate-500">Total</span>
                <span className="text-sm font-bold text-white">$295</span>
              </div>
            </div>

            {/* Landscaping */}
            <div className="rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] p-6 transition-all duration-200 hover:bg-white/[0.08]">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/15">
                <svg className="h-5 w-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="mt-4 text-base font-semibold text-white">Landscaping</h3>
              <div className="mt-3 space-y-1.5">
                <div className="flex justify-between text-sm"><span className="text-slate-400">Lawn mowing & edging</span><span className="text-slate-500">$75</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-400">Hedge trimming</span><span className="text-slate-500">$120</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-400">Mulch (3 yards)</span><span className="text-slate-500">$255</span></div>
              </div>
              <div className="mt-4 flex justify-between border-t border-white/[0.08] pt-3">
                <span className="text-xs text-slate-500">Total</span>
                <span className="text-sm font-bold text-white">$450</span>
              </div>
            </div>

            {/* Electrical */}
            <div className="rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] p-6 transition-all duration-200 hover:bg-white/[0.08]">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/15">
                <svg className="h-5 w-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="mt-4 text-base font-semibold text-white">Electrical</h3>
              <div className="mt-3 space-y-1.5">
                <div className="flex justify-between text-sm"><span className="text-slate-400">Install new outlet (x2)</span><span className="text-slate-500">$190</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-400">Replace light fixture</span><span className="text-slate-500">$150</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-400">Breaker inspection</span><span className="text-slate-500">$125</span></div>
              </div>
              <div className="mt-4 flex justify-between border-t border-white/[0.08] pt-3">
                <span className="text-xs text-slate-500">Total</span>
                <span className="text-sm font-bold text-white">$465</span>
              </div>
            </div>

            {/* Painting */}
            <div className="rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] p-6 transition-all duration-200 hover:bg-white/[0.08]">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/15">
                <svg className="h-5 w-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <h3 className="mt-4 text-base font-semibold text-white">Painting</h3>
              <div className="mt-3 space-y-1.5">
                <div className="flex justify-between text-sm"><span className="text-slate-400">Interior room (x3)</span><span className="text-slate-500">$1,050</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-400">Trim & baseboards</span><span className="text-slate-500">$200</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-400">Paint & materials</span><span className="text-slate-500">$180</span></div>
              </div>
              <div className="mt-4 flex justify-between border-t border-white/[0.08] pt-3">
                <span className="text-xs text-slate-500">Total</span>
                <span className="text-sm font-bold text-white">$1,430</span>
              </div>
            </div>

            {/* General Handyman */}
            <div className="rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] p-6 transition-all duration-200 hover:bg-white/[0.08]">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/15">
                <svg className="h-5 w-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="mt-4 text-base font-semibold text-white">General Handyman</h3>
              <div className="mt-3 space-y-1.5">
                <div className="flex justify-between text-sm"><span className="text-slate-400">Drywall patch (x2)</span><span className="text-slate-500">$170</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-400">Door hardware replace</span><span className="text-slate-500">$65</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-400">Labor (2 hrs)</span><span className="text-slate-500">$150</span></div>
              </div>
              <div className="mt-4 flex justify-between border-t border-white/[0.08] pt-3">
                <span className="text-xs text-slate-500">Total</span>
                <span className="text-sm font-bold text-white">$385</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-white/[0.06] py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-xs font-semibold uppercase tracking-widest text-slate-500">
            Simple Pricing
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {/* Free */}
            <div className="rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] p-6">
              <h3 className="text-base font-bold text-white">Free</h3>
              <p className="mt-3">
                <span className="text-3xl font-bold text-white">$0</span>
                <span className="text-sm text-slate-500">/month</span>
              </p>
              <p className="mt-3 text-sm text-slate-400">3 estimates per month with PDF generation.</p>
              <Link
                href="/signup"
                className="mt-5 block rounded-xl bg-white/[0.06] border border-white/[0.1] py-2.5 text-center text-sm font-semibold text-slate-300 transition-all hover:bg-white/[0.1] hover:text-white"
              >
                Get Started Free
              </Link>
            </div>

            {/* Pro */}
            <div className="relative rounded-2xl bg-white/[0.08] backdrop-blur-xl border border-indigo-500/30 ring-1 ring-indigo-500/20 p-6 shadow-lg shadow-indigo-500/10 scale-[1.02]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/25">
                  Recommended
                </span>
              </div>
              <h3 className="text-base font-bold text-white">Pro</h3>
              <p className="mt-3">
                <span className="text-3xl font-bold text-white">$9.99</span>
                <span className="text-sm text-slate-500">/month</span>
              </p>
              <p className="mt-3 text-sm text-slate-400">Unlimited estimates, invoicing, and online payments.</p>
              <Link
                href="/signup"
                className="mt-5 block rounded-xl bg-indigo-600 py-2.5 text-center text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-500"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Pay As You Go */}
            <div className="rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] p-6">
              <h3 className="text-base font-bold text-white">Pay As You Go</h3>
              <p className="mt-3">
                <span className="text-3xl font-bold text-white">$0.99</span>
                <span className="text-sm text-slate-500">/estimate</span>
              </p>
              <p className="mt-3 text-sm text-slate-400">Everything in Pro with no monthly commitment.</p>
              <Link
                href="/signup"
                className="mt-5 block rounded-xl bg-white/[0.06] border border-white/[0.1] py-2.5 text-center text-sm font-semibold text-slate-300 transition-all hover:bg-white/[0.1] hover:text-white"
              >
                Get Started
              </Link>
            </div>
          </div>

          <p className="mt-8 text-center">
            <Link
              href="/pricing"
              className="text-sm font-medium text-indigo-400 transition-colors hover:text-indigo-300"
            >
              Compare all plans &rarr;
            </Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8">
        <p className="text-center text-sm text-slate-500">
          Preciso AI &mdash; Professional estimates for home service
          businesses.
        </p>
      </footer>
    </div>
  );
}
