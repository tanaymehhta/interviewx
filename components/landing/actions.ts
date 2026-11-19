"use server";
import { createClient } from "@/lib/supabase/server";
import { EMAIL } from "@/components/account/shared";

/** Stores one career-center lead. Public: anyone may add a row, nobody may read them back. */
export async function addLead(input: { name: string; school: string; email: string }): Promise<{ ok: true } | { error: string }> {
  const name = String(input?.name ?? "").trim(), school = String(input?.school ?? "").trim(), email = String(input?.email ?? "").trim();
  if (!name || !school || !EMAIL.test(email) || name.length > 120 || school.length > 200 || email.length > 254) {
    return { error: "Check your name, school, and email, then try again." };
  }
  // No .select(): reading leads is not allowed, so asking for the row back would fail.
  const { error } = await (await createClient()).from("leads").insert({ name, school, email });
  return error ? { error: "We could not save that. Try again." } : { ok: true };
}
