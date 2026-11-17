import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database, Profile } from "@/types/database";

type Ok = {
  user: User;
  profile: Profile;
  /** Service-role client. Bypasses RLS: every query MUST be scoped by hand. */
  admin: SupabaseClient<Database>;
  error?: undefined;
};

type Failed = { error: NextResponse };

function fail(message: string, status: number): Failed {
  return { error: NextResponse.json({ error: message }, { status }) };
}

/**
 * Resolves the signed-in user for an API route and hands back the service-role
 * client used for all writes and cross-party reads.
 *
 * Rejects when: not signed in, email not confirmed, account suspended, or the
 * server is missing its Supabase credentials.
 */
export async function requireUser(options: { allowUnconfirmed?: boolean } = {}): Promise<Ok | Failed> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return fail("Authentication required.", 401);
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return fail("Authentication required.", 401);
  }

  if (!options.allowUnconfirmed && !user.email_confirmed_at) {
    return fail("Confirm your email address before continuing.", 403);
  }

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("*").eq("id", user.id).single();

  if (!profile) {
    return fail("Profile not found.", 403);
  }

  if (profile.suspended_at) {
    return fail("This account is suspended.", 403);
  }

  return { user, profile, admin };
}

export function clientIp(request: Request) {
  return (
    request.headers.get("x-nf-client-connection-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null
  );
}
