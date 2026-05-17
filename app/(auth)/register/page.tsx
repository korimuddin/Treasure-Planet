"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";

const countries = [
  "United Kingdom",
  "United States",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Ireland",
  "Netherlands",
  "Singapore",
  "United Arab Emirates",
];

const platforms = [
  "SaaS",
  "Mobile App",
  "Marketplace",
  "Developer Tool",
  "AI Product",
  "E-commerce",
  "Content Platform",
  "Other",
];

const registerSchema = z
  .object({
    role: z.enum(["buyer", "seller"]),
    fullName: z.string().min(2, "Enter your full legal name."),
    email: z.string().email("Enter a valid email address."),
    country: z.string().min(1, "Select your country."),
    primaryPlatform: z.string().optional(),
    password: z.string().min(12, "Password must be at least 12 characters."),
    agree: z.boolean().refine((value) => value, "You must agree before continuing."),
  })
  .refine(
    (data) => data.role === "buyer" || Boolean(data.primaryPlatform),
    {
      path: ["primaryPlatform"],
      message: "Select the primary platform for your project.",
    },
  );

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "buyer",
      fullName: "",
      email: "",
      country: "",
      primaryPlatform: "",
      password: "",
      agree: false,
    },
  });

  const role = watch("role");
  const roleCopy =
    role === "buyer"
      ? "Explore vetted opportunities, save listings, and build a verified acquisition profile."
      : "Prepare an anonymous seller profile and get ready to list a project in a later phase.";

  async function onSubmit(values: RegisterForm) {
    setSubmitError(null);
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          role: values.role,
          full_name: values.fullName,
          country: values.country,
          primary_platform: values.role === "seller" ? values.primaryPlatform : null,
        },
      },
    });

    if (error) {
      setSubmitError(error.message);
      return;
    }

    await fetch("/api/auth/sanctions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        full_name: values.fullName,
        country: values.country,
      }),
    }).catch(() => undefined);

    router.push(values.role === "buyer" ? "/marketplace" : "/dashboard/seller");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <section className="relative w-full max-w-xl overflow-hidden border border-border bg-[rgba(7,15,26,0.96)] p-6 shadow-2xl backdrop-blur-3xl sm:p-8">
        <div className="absolute left-0 top-0 h-0.5 w-full bg-[linear-gradient(90deg,transparent,var(--gold),transparent)]" />
        <div className="mb-8 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-gold">
            Anonymous project marketplace
          </p>
          <h1 className="mt-2 font-display text-display-md uppercase text-cream">
            Treasure Planet
          </h1>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted">
            Create your account
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-3">
            {(["buyer", "seller"] as const).map((item) => (
              <button
                key={item}
                type="button"
                className={`border px-4 py-3 font-mono text-xs uppercase tracking-[0.16em] transition ${
                  role === item
                    ? "border-border2 bg-gold-dim text-gold"
                    : "border-border bg-[rgba(4,9,15,0.8)] text-cream2 hover:border-border2"
                }`}
                onClick={() => setValue("role", item, { shouldValidate: true })}
              >
                {item === "buyer" ? "I want to Buy" : "I want to Sell"}
              </button>
            ))}
          </div>

          <input type="hidden" {...register("role")} />

          <div className="border border-teal-dim bg-teal-dim px-4 py-3 text-sm leading-6 text-cream2">
            {roleCopy}
          </div>

          <label className="block">
            <span className="mb-2 block font-mono text-xs uppercase tracking-[0.14em] text-muted">
              Full Legal Name
            </span>
            <input className="auth-input" {...register("fullName")} />
            {errors.fullName && <FormError message={errors.fullName.message} />}
          </label>

          <label className="block">
            <span className="mb-2 block font-mono text-xs uppercase tracking-[0.14em] text-muted">
              Email Address
            </span>
            <input className="auth-input" type="email" {...register("email")} />
            {errors.email && <FormError message={errors.email.message} />}
          </label>

          <label className="block">
            <span className="mb-2 block font-mono text-xs uppercase tracking-[0.14em] text-muted">
              Country
            </span>
            <select className="auth-input" {...register("country")}>
              <option value="">Select country</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
            {errors.country && <FormError message={errors.country.message} />}
          </label>

          {role === "seller" && (
            <label className="block">
              <span className="mb-2 block font-mono text-xs uppercase tracking-[0.14em] text-muted">
                Primary Platform
              </span>
              <select className="auth-input" {...register("primaryPlatform")}>
                <option value="">Select platform</option>
                {platforms.map((platform) => (
                  <option key={platform} value={platform}>
                    {platform}
                  </option>
                ))}
              </select>
              {errors.primaryPlatform && <FormError message={errors.primaryPlatform.message} />}
            </label>
          )}

          <label className="block">
            <span className="mb-2 block font-mono text-xs uppercase tracking-[0.14em] text-muted">
              Password
            </span>
            <input className="auth-input" type="password" {...register("password")} />
            {errors.password && <FormError message={errors.password.message} />}
          </label>

          <label className="flex items-start gap-3 text-sm text-cream2">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 border border-border bg-ink accent-gold"
              {...register("agree")}
            />
            <span>
              I agree to the{" "}
              <Link className="text-gold hover:text-gold2" href="/legal#terms">
                Terms
              </Link>{" "}
              and{" "}
              <Link className="text-gold hover:text-gold2" href="/legal#privacy">
                Privacy
              </Link>
              .
            </span>
          </label>
          {errors.agree && <FormError message={errors.agree.message} />}

          {submitError && <FormError message={submitError} />}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-liquid w-full px-5 py-4 font-mono text-xs uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Opening Account..." : "Begin the Voyage"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already aboard?{" "}
          <Link className="text-gold hover:text-gold2" href="/login">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}

function FormError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-2 font-mono text-xs uppercase tracking-[0.14em] text-red">{message}</p>;
}
