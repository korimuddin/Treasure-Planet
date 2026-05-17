"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import type { ProfileRole } from "@/types/database";

const loginSchema = z.object({
  roleLabel: z.enum(["buyer", "seller"]),
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      roleLabel: "buyer",
      email: "",
      password: "",
    },
  });

  const roleLabel = watch("roleLabel");

  async function onSubmit(values: LoginForm) {
    setSubmitError(null);
    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error || !data.user) {
      setSubmitError(error?.message ?? "Unable to sign in.");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    const role = (profile?.role ?? data.user.user_metadata.role ?? roleLabel) as ProfileRole;
    router.push(role === "seller" ? "/dashboard/seller" : "/dashboard/buyer");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <section className="relative w-full max-w-lg overflow-hidden border border-border bg-[rgba(7,15,26,0.96)] p-6 shadow-2xl backdrop-blur-3xl sm:p-8">
        <div className="absolute left-0 top-0 h-0.5 w-full bg-[linear-gradient(90deg,transparent,var(--gold),transparent)]" />
        <div className="mb-8 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-gold">
            Anonymous project marketplace
          </p>
          <h1 className="mt-2 font-display text-display-md uppercase text-cream">
            Treasure Planet
          </h1>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted">
            Sign in
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-3">
            {(["buyer", "seller"] as const).map((item) => (
              <button
                key={item}
                type="button"
                className={`border px-4 py-3 font-mono text-xs uppercase tracking-[0.16em] transition ${
                  roleLabel === item
                    ? "border-border2 bg-gold-dim text-gold"
                    : "border-border bg-[rgba(4,9,15,0.8)] text-cream2 hover:border-border2"
                }`}
                onClick={() => setValue("roleLabel", item, { shouldValidate: true })}
              >
                {item === "buyer" ? "Buyer" : "Seller"}
              </button>
            ))}
          </div>
          <input type="hidden" {...register("roleLabel")} />

          <label className="block">
            <span className="mb-2 block font-mono text-xs uppercase tracking-[0.14em] text-muted">
              Email Address
            </span>
            <input className="auth-input" type="email" {...register("email")} />
            {errors.email && <FormError message={errors.email.message} />}
          </label>

          <label className="block">
            <span className="mb-2 block font-mono text-xs uppercase tracking-[0.14em] text-muted">
              Password
            </span>
            <input className="auth-input" type="password" {...register("password")} />
            {errors.password && <FormError message={errors.password.message} />}
          </label>

          {submitError && <FormError message={submitError} />}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-liquid w-full px-5 py-4 font-mono text-xs uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Signing In..." : "Sign In to the Deep"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Need an account?{" "}
          <Link className="text-gold hover:text-gold2" href="/register">
            Register
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
