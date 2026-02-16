import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-slate-100">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold text-[#1A365D]">QuickEstimate</span>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-[#1A365D] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2B4E7C]"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 pt-20 pb-16 text-center">
        <h1 className="text-4xl font-bold leading-tight tracking-tight text-[#1A365D] sm:text-5xl">
          Professional estimates
          <br />
          in 60 seconds
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-slate-600">
          Create, send, and track estimates and invoices for your home service
          business. Get paid faster with shareable links and online payments.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-xl bg-[#1A365D] px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#1A365D]/20 transition-all hover:bg-[#2B4E7C] hover:shadow-xl hover:shadow-[#1A365D]/25"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-slate-100 bg-slate-50 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-sm font-bold uppercase tracking-widest text-slate-400">
            Everything you need
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1A365D]/10">
                <svg className="h-5 w-5 text-[#1A365D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-800">
                Quick Estimates
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Build professional estimates with line items, customer info, and
                your branding. Send via shareable link.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1A365D]/10">
                <svg className="h-5 w-5 text-[#1A365D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-800">
                Customer Approval
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Customers approve or decline right from the link. Convert
                approved estimates to invoices in one click.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1A365D]/10">
                <svg className="h-5 w-5 text-[#1A365D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-800">
                Online Payments
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Accept credit card payments through Stripe. Customers pay
                directly from the invoice link.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20">
        <div className="mx-auto max-w-md px-6 text-center">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">
            Simple Pricing
          </h2>
          <div className="mt-8 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <p className="text-4xl font-bold text-[#1A365D]">$1</p>
            <p className="mt-1 text-sm text-slate-500">per estimate</p>
            <p className="mt-4 text-sm text-slate-600">
              Your first 3 estimates are free. No subscription, no hidden fees.
              Pay only for what you use.
            </p>
            <Link
              href="/signup"
              className="mt-6 inline-block rounded-lg bg-[#1A365D] px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2B4E7C]"
            >
              Start Free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-slate-50 py-8">
        <p className="text-center text-sm text-slate-400">
          QuickEstimate &mdash; Professional estimates for home service
          businesses.
        </p>
      </footer>
    </div>
  );
}
