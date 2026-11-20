"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Criterion, Fact, Requirement, type StoredBrief } from "@/lib/schemas";
import { getUser, loadJob } from "@/lib/server";

const Facts = z.array(Fact.extend({ text: z.string().trim().min(1).max(400) })).max(20);
const Save = z.object({
  company_wants: Facts,
  rounds: z.array(z.object({ id: z.string().uuid(), asks: Facts, expects: Facts, scorecard: z.array(Criterion).max(10).optional() })).max(12),
  /** Present when the lists come from a research re-run. */
  research: z.object({ summary: z.string().max(1000), missing: z.array(z.string().max(400)).max(10), requirements: z.array(Requirement).max(20) }).optional(),
});
export type BriefSave = z.infer<typeof Save>;

/** Saves the person's edits to the brief, or the result of a re-run they reviewed. */
export async function saveBrief(jobId: string, input: BriefSave): Promise<{ error?: string }> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Sign in first." };
  const parsed = Save.safeParse(input);
  const ctx = await loadJob(supabase, jobId);
  if (!parsed.success || !ctx) return { error: "Could not save. Check that no item is empty." };
  const d = parsed.data;
  const old = ctx.job.brief as StoredBrief;
  const brief: StoredBrief = {
    ...old, company_wants: d.company_wants,
    ...(d.research ? { summary: d.research.summary || old.summary, missing: d.research.missing, requirements: d.research.requirements.length ? d.research.requirements : old.requirements, researched_at: new Date().toISOString() } : {}),
  };
  const results = await Promise.all([
    supabase.from("jobs").update({ brief }).eq("id", jobId),
    ...d.rounds.map((r) => supabase.from("rounds").update({ asks: r.asks, expects: r.expects, ...(r.scorecard?.length ? { scorecard: r.scorecard } : {}) }).eq("id", r.id).eq("job_id", jobId)),
  ]);
  if (results.some((r) => r.error)) return { error: "Could not save. Try again." };
  revalidatePath(`/jobs/${jobId}`, "layout");
  return {};
}
