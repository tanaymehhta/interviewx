"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/server";
import type { ResumeAnalysis } from "@/lib/schemas";
import { MAX_ROLES, parseRoles } from "./shared";

type Result = { ok: true } | { error: string };
const FAILED: Result = { error: "We could not save that. Try again." };
const SIGNED_OUT: Result = { error: "Sign in first." };
const cut = (s: unknown, n: number) => String(s ?? "").trim().slice(0, n);

/** Saves the profile fields. An empty name never overwrites a saved one. */
export async function saveProfile(input: { name: string; program: string; roles: string }): Promise<Result> {
  const { supabase, user } = await getUser();
  if (!user) return SIGNED_OUT;
  const name = cut(input.name, 120);
  const { error } = await supabase.from("profiles").update({
    ...(name ? { name } : {}),
    program: cut(input.program, 120) || null,
    target_roles: parseRoles(cut(input.roles, 600)).slice(0, MAX_ROLES),
  }).eq("id", user.id);
  return error ? FAILED : { ok: true };
}

/** Renames stories by position. The rest of the analysis comes from the database, not the browser. */
export async function saveStoryNames(names: string[]): Promise<Result> {
  const { supabase, user } = await getUser();
  if (!user) return SIGNED_OUT;
  const { data: profile } = await supabase.from("profiles").select("resume_analysis").eq("id", user.id).maybeSingle();
  const analysis = profile?.resume_analysis as ResumeAnalysis | null;
  if (!analysis || !Array.isArray(names)) return FAILED;
  const stories = analysis.stories.map((s, i) => ({ ...s, name: cut(names[i], 60) || s.name }));
  const { error } = await supabase.from("profiles").update({ resume_analysis: { ...analysis, stories } }).eq("id", user.id);
  return error ? FAILED : { ok: true };
}

export async function setTheme(theme: "light" | "dark"): Promise<Result> {
  const { supabase, user } = await getUser();
  if (!user) return SIGNED_OUT;
  if (theme !== "light" && theme !== "dark") return FAILED;
  const { error } = await supabase.from("profiles").update({ theme }).eq("id", user.id);
  if (error) return FAILED;
  (await cookies()).set("theme", theme, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  return { ok: true };
}

/** Ends onboarding and opens My Jobs. Name and resume are required. */
export async function finishOnboarding(): Promise<Result> {
  const { supabase, user } = await getUser();
  if (!user) return SIGNED_OUT;
  const { data: profile } = await supabase.from("profiles").select("name, resume_path, resume_text").eq("id", user.id).maybeSingle();
  if (!profile?.name) return { error: "Add your name first." };
  if (!profile.resume_path && !profile.resume_text) return { error: "Add your resume first." };
  const { error } = await supabase.from("profiles").update({ onboarded: true }).eq("id", user.id);
  if (error) return FAILED;
  redirect("/jobs");
}

export async function signOut() {
  const { supabase } = await getUser();
  await supabase.auth.signOut();
  (await cookies()).delete("theme");
  redirect("/");
}
