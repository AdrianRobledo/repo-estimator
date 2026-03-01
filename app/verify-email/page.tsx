"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Logo from "@/app/components/Logo";

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailInner />
    </Suspense>
  );
}

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [status, setStatus] = useState<"loading" | "success" | "signing_in" | "error" | "pending">(
    token ? "loading" : "pending"
  );
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (!token) return;

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }).then(async (res) => {
      if (!res.ok) { setStatus("error"); return; }
      const data = await res.json();
      if (data.signInToken && data.email) {
        setStatus("signing_in");
        const signInRes = await signIn("credentials", {
          email: data.email,
          signInToken: data.signInToken,
          redirect: false,
        });
        if (signInRes?.ok) {
          router.push("/onboarding");
          router.refresh();
          return;
        }
      }
      setStatus("success");
    });
  }, [token, router]);

  async function handleResend() {
    if (!email || resending) return;
    setResending(true);
    await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setResending(false);
    setResent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0F]">
      <div className="w-full max-w-sm px-6">
        <div className="text-center">
          <div className="flex justify-center"><Logo size="large" /></div>
        </div>

        <div className="mt-8 rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] p-6 text-center">
          {(status === "loading" || status === "signing_in") && (
            <div>
              <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-emerald-400" />
              <p className="text-slate-400">
                {status === "signing_in" ? "Signing you in..." : "Verifying your email..."}
              </p>
            </div>
          )}

          {status === "success" && (
            <>
              <div className="text-4xl mb-3">&#10003;</div>
              <h2 className="text-lg font-semibold text-white">Email verified!</h2>
              <p className="mt-2 text-sm text-slate-400">
                Your email has been verified. You can now sign in.
              </p>
              <Link
                href="/login"
                className="mt-4 inline-block rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-500"
              >
                Sign In
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <h2 className="text-lg font-semibold text-white">Invalid or expired link</h2>
              <p className="mt-2 text-sm text-slate-400">
                This verification link is invalid or has expired. Please request a new one.
              </p>
              <Link
                href="/login"
                className="mt-4 inline-block text-sm font-medium text-emerald-400 hover:text-emerald-300"
              >
                Back to Sign In
              </Link>
            </>
          )}

          {status === "pending" && (
            <>
              <h2 className="text-lg font-semibold text-white">Check your email</h2>
              <p className="mt-2 text-sm text-slate-400">
                We sent a verification link to{" "}
                {email ? (
                  <span className="text-white font-medium">{email}</span>
                ) : (
                  "your email"
                )}
                . Click the link to verify your account.
              </p>
              {email && (
                <button
                  onClick={handleResend}
                  disabled={resending || resent}
                  className="mt-4 text-sm font-medium text-emerald-400 hover:text-emerald-300 disabled:text-slate-500"
                >
                  {resent ? "Verification email sent!" : resending ? "Sending..." : "Resend verification email"}
                </button>
              )}
              <div className="mt-3">
                <Link
                  href="/login"
                  className="text-sm text-slate-500 hover:text-slate-400"
                >
                  Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
