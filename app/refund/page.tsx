import Link from "next/link";
import LandingNav from "@/app/components/LandingNav";

export default function RefundPage() {
  return (
    <div className="bg-mesh min-h-screen">
      <LandingNav />

      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-2xl font-bold text-white">Refund Policy</h1>
        <p className="text-sm text-slate-500 mt-1">
          Last updated: February 23, 2026
        </p>

        <h2 className="text-lg font-semibold text-white mt-10 mb-3">
          Cancellation
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed mb-4">
          You can cancel your Pro subscription anytime from the billing page.
          Your cancellation takes effect at the end of your current billing
          period. You'll continue to have Pro access until then.
        </p>

        <h2 className="text-lg font-semibold text-white mt-10 mb-3">
          7-Day Guarantee
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed mb-4">
          We offer a full refund within the first 7 days of your initial Pro
          subscription if you're not satisfied. No questions asked.
        </p>

        <h2 className="text-lg font-semibold text-white mt-10 mb-3">
          Annual Plan Refunds
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed mb-4">
          Annual plan refunds after the 7-day window are prorated based on the
          remaining months in your subscription.
        </p>

        <h2 className="text-lg font-semibold text-white mt-10 mb-3">
          How to Request a Refund
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed mb-4">
          Contact us at adrianrobledo0260@gmail.com with your account email and
          we'll process your refund within 3-5 business days.
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
