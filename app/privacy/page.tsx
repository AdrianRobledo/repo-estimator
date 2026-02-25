import Link from "next/link";
import LandingNav from "@/app/components/LandingNav";

export default function PrivacyPage() {
  return (
    <div className="bg-mesh min-h-screen">
      <LandingNav />

      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-2xl font-bold text-white">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mt-1">
          Last updated: February 23, 2026
        </p>

        <h2 className="text-lg font-semibold text-white mt-10 mb-3">
          Information We Collect
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed mb-4">
          We collect your name, email address, and business information when you
          create an account. We use Google OAuth for authentication.
        </p>

        <h2 className="text-lg font-semibold text-white mt-10 mb-3">
          How We Use Your Data
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed mb-4">
          We store your estimates, invoices, and client data to provide our
          services. We use Stripe to securely process subscription payments. We
          do not sell your data to third parties.
        </p>

        <h2 className="text-lg font-semibold text-white mt-10 mb-3">
          Cookies
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed mb-4">
          We use cookies solely for authentication and keeping you signed in.
        </p>

        <h2 className="text-lg font-semibold text-white mt-10 mb-3">
          Data Security
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed mb-4">
          Your data is encrypted and stored securely in our database. Only you
          can access your estimates and client information.
        </p>

        <h2 className="text-lg font-semibold text-white mt-10 mb-3">
          Deleting Your Data
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed mb-4">
          You can request deletion of your account and all associated data by
          contacting us at adrianrobledo0260@gmail.com.
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
