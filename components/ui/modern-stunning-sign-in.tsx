"use client";

/*
 * Adapted from "Modern & Stunning sign in" by Preet Suthar (HextaUI), via 21st.dev.
 * https://21st.dev/@preetsuthar17/components/modern-stunning-sign-in — MIT licence.
 *
 * Changes for Treasure Planet: signs in with Supabase and routes to the right
 * dashboard; Treasure Planet branding; the Google button and the sample user
 * avatars are removed (Google sign-in is not set up yet).
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import type { ProfileRole } from "@/types/database";

const SignIn1 = () => {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setError("");
    setSubmitting(true);

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError || !data.user) {
      setError(signInError?.message ?? "Unable to sign in.");
      setSubmitting(false);
      return;
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
    const role = (profile?.role ?? data.user.user_metadata.role ?? "buyer") as ProfileRole;
    router.push(role === "seller" ? "/dashboard/seller" : "/dashboard/buyer");
    router.refresh();
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#121212] px-4">
      {/* Centered glass card */}
      <div className="relative z-10 flex w-full max-w-sm flex-col items-center rounded-3xl bg-gradient-to-r from-[#ffffff10] to-[#121212] p-8 shadow-2xl backdrop-blur-sm">
        {/* Logo */}
        <div
          className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-sm font-semibold tracking-tight text-white shadow-lg"
          aria-hidden="true"
        >
          TP
        </div>
        {/* Title */}
        <h1 className="mb-6 text-center text-2xl font-semibold text-white">Treasure Planet</h1>
        {/* Form */}
        <form className="flex w-full flex-col gap-4" onSubmit={handleSignIn} noValidate>
          <div className="flex w-full flex-col gap-3">
            <label className="sr-only" htmlFor="signin-email">
              Email
            </label>
            <input
              id="signin-email"
              placeholder="Email"
              type="email"
              autoComplete="email"
              value={email}
              className="w-full rounded-[12px] bg-white/10 px-5 py-3 text-sm text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
              onChange={(e) => setEmail(e.target.value)}
            />
            <label className="sr-only" htmlFor="signin-password">
              Password
            </label>
            <input
              id="signin-password"
              placeholder="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              className="w-full rounded-[12px] bg-white/10 px-5 py-3 text-sm text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && (
              <div className="text-left text-sm text-[#f87171]" role="alert">
                {error}
              </div>
            )}
          </div>
          <hr className="border-white opacity-10" />
          <div>
            <button
              type="submit"
              disabled={submitting}
              className="mb-3 w-full rounded-full bg-white/10 px-5 py-3 text-sm font-medium text-white shadow transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
            <div className="mt-2 w-full text-center">
              <span className="text-xs text-gray-400">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-white/80 underline hover:text-white">
                  Sign up, it&apos;s free!
                </Link>
              </span>
            </div>
          </div>
        </form>
      </div>
      {/* Brand fine print */}
      <p className="relative z-10 mt-12 text-center font-mono text-[9.5px] tracking-[0.08em] text-[rgba(200,168,75,0.4)]">
        Every deal protected by our mutual NDA
      </p>
    </div>
  );
};

export { SignIn1 };

export default SignIn1;
