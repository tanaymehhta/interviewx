import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ResumeAnalysis } from "@/lib/schemas";
import { requireUser } from "@/lib/server";
import { Onboarding } from "@/components/account/Onboarding";

export const metadata: Metadata = { title: "About you" };

export default async function Start() {
  const { supabase, user } = await requireUser();
  // The callback creates this row; repeat it here in case that write failed.
  await supabase.from("profiles").upsert({ id: user.id }, { onConflict: "id", ignoreDuplicates: true });
  const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (p?.onboarded) redirect("/jobs");

  return (
    <Onboarding uid={user.id} profile={{
      name: p?.name ?? "", program: p?.program ?? "", roles: p?.target_roles.join(", ") ?? "",
      hasPdf: !!p?.resume_path, resumeText: p?.resume_path ? "" : p?.resume_text ?? "",
      analysis: (p?.resume_analysis as ResumeAnalysis | null) ?? null,
    }} />
  );
}
