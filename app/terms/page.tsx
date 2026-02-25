import Link from "next/link";
import LandingNav from "@/app/components/LandingNav";

export default function TermsPage() {
  return (
    <div className="bg-mesh min-h-screen">
      <LandingNav />

      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-2xl font-bold text-white">Terms of Service</h1>
        <p className="text-sm text-slate-500 mt-1">
          Last updated: February 23, 2026
        </p>

        <h2 className="text-lg font-semibold text-white mt-10 mb-3">
          Our Service
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed mb-4">
          Preciso provides estimate and invoice management tools for home
          service contractors.
        </p>

        <h2 className="text-lg font-semibold text-white mt-10 mb-3">
          Plans and Pricing
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed mb-4">
          The Free plan includes 3 estimates per month. The Pro plan is
          $9.99/month or $79.99/year and includes unlimited estimates,
          invoicing, and templates.
        </p>

        <h2 className="text-lg font-semibold text-white mt-10 mb-3">
          Your Data
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed mb-4">
          You own all data you create in Preciso, including estimates, invoices,
          and client information.
        </p>

        <h2 className="text-lg font-semibold text-white mt-10 mb-3">
          Liability
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed mb-4">
          Preciso is not responsible for disputes between contractors and their
          customers. Our service is provided as-is without warranty.
        </p>

        <h2 className="text-lg font-semibold text-white mt-10 mb-3">
          Account Termination
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed mb-4">
          We reserve the right to terminate accounts that violate these terms or
          engage in fraudulent activity.
        </p>

        <Link
          href="/"
          className="text-sm text-emerald-400 hover:text-emerald-300 mt-10 inline-block"
        >
          &larr; Back to home
        </Link>
      </div>
    </div>
  );
}
