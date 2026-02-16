import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Perfect for getting started",
    features: [
      "3 estimates per month",
      "PDF generation",
      "Shareable approval links",
    ],
    cta: "Get Started Free",
    href: "/signup",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$9.99",
    period: "/month",
    description: "Everything you need to grow",
    features: [
      "Unlimited estimates",
      "Invoicing",
      "Online payments",
      "Job templates",
      "Priority support",
    ],
    cta: "Start Free Trial",
    href: "/signup",
    highlighted: true,
  },
  {
    name: "Pay As You Go",
    price: "$0.99",
    period: "/estimate",
    description: "No monthly commitment",
    features: [
      "Everything in Pro",
      "No monthly commitment",
      "Perfect for side businesses",
    ],
    cta: "Get Started",
    href: "/signup",
    highlighted: false,
  },
];

export default async function PricingPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-mesh">
      {/* Nav */}
      <nav className="border-b border-white/[0.06]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold text-white">
            Preciso
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/pricing"
              className="text-sm font-medium text-indigo-400 transition-colors hover:text-white"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-500"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="mx-auto max-w-3xl px-6 pt-20 pb-4 text-center">
        <h1 className="bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
          Simple, transparent pricing
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-slate-400">
          Start free, upgrade when you need to. No hidden fees, cancel anytime.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid gap-8 sm:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-2xl backdrop-blur-xl border p-8 transition-all duration-200 ${
                tier.highlighted
                  ? "bg-white/[0.08] border-indigo-500/30 ring-1 ring-indigo-500/20 shadow-lg shadow-indigo-500/10 scale-[1.02]"
                  : "bg-white/[0.05] border-white/[0.08] hover:bg-white/[0.08]"
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-indigo-600 px-4 py-1 text-xs font-bold text-white shadow-lg shadow-indigo-500/25">
                    Recommended
                  </span>
                </div>
              )}

              <div>
                <h3 className="text-lg font-bold text-white">{tier.name}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {tier.description}
                </p>
              </div>

              <div className="mt-6">
                <span className="text-4xl font-bold text-white">
                  {tier.price}
                </span>
                <span className="text-sm text-slate-500">{tier.period}</span>
              </div>

              <ul className="mt-8 flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <svg
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        tier.highlighted ? "text-indigo-400" : "text-slate-500"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-sm text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={tier.href}
                className={`mt-8 block rounded-xl py-3.5 text-center text-sm font-semibold transition-all ${
                  tier.highlighted
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 hover:shadow-xl hover:shadow-indigo-500/30"
                    : "bg-white/[0.06] border border-white/[0.1] text-slate-300 hover:bg-white/[0.1] hover:text-white"
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ-like section */}
      <section className="border-t border-white/[0.06] py-16">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            No surprises
          </h2>
          <p className="mt-4 text-sm text-slate-400">
            All plans include PDF generation and shareable approval links. The
            Pro plan adds invoicing with online payments via Stripe, job
            templates, and priority support. Pay As You Go gives you everything
            in Pro without the monthly commitment.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8">
        <p className="text-center text-sm text-slate-500">
          Preciso AI &mdash; Professional estimates for home service businesses.
        </p>
      </footer>
    </div>
  );
}
