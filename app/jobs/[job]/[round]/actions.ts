"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { buildPlan, jobStatusAfter } from "@/lib/coach";
import { getUser, loadJob, localNow } from "@/lib/server";

const Questions = z.array(z.string().trim().min(1).max(500)).max(30);

/** Sets or changes the round date and rebuilds the plan days that are still open. Done days stay. */
export async function setRoundDate(jobId: string, roundId: string, form: FormData): Promise<void> {
  const { supabase, user } = await getUser();
  if (!user) return;
  const ctx = await loadJob(supabase, jobId, roundId);
  const date = String(form.get("date") ?? "");
  if (!ctx?.round || (date && !/^\d{4}-\d{2}-\d{2}$/.test(date))) return;
  const { today } = await localNow();

  await supabase.from("rounds").update({ date: date || null }).eq("id", roundId);
  await supabase.from("plan_days").delete().eq("round_id", roundId).eq("done", false);
  if (date) {
    const { data: kept } = await supabase.from("plan_days").select("day").eq("round_id", roundId);
    const taken = new Set((kept ?? []).map((d) => d.day));
    const days = buildPlan(today, date, ctx.roundSkills).filter((d) => !taken.has(d.day));
    if (days.length) await supabase.from("plan_days").insert(days.map((d) => ({ ...d, round_id: roundId })));
  }
  revalidatePath(`/jobs/${jobId}`, "layout");
}

/** Keeps the questions from the real round, so "Practice this" never loses one. */
export async function saveAsked(jobId: string, roundId: string, questions: string[]): Promise<{ error?: string }> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Sign in first." };
  const parsed = Questions.safeParse(questions);
  if (!parsed.success) return { error: "A question is too long." };
  const { error } = await supabase.from("rounds").update({ asked_questions: parsed.data }).eq("id", roundId).eq("job_id", jobId);
  return error ? { error: "Could not save. Try again." } : {};
}

const Outcome = z.object({
  outcome: z.enum(["waiting", "advanced", "offer", "rejected", "withdrew"]),
  went_well: z.string().trim().max(4000),
  went_wrong: z.string().trim().max(4000),
  asked_questions: Questions,
});
export type OutcomeInput = z.infer<typeof Outcome>;

/** Logs the outcome with a readiness snapshot, then moves the job on: next round, or Past jobs. */
export async function saveOutcome(jobId: string, roundId: string, input: OutcomeInput): Promise<{ error?: string }> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Sign in first." };
  const parsed = Outcome.safeParse(input);
  const ctx = await loadJob(supabase, jobId, roundId);
  if (!parsed.success || !ctx?.round) return { error: "Choose an outcome, then save." };
  const d = parsed.data;

  // The snapshot is taken the first time an outcome is logged and is not rewritten by later edits.
  const snapshot = ctx.round.snapshot ?? {
    readiness: ctx.readiness, skills: ctx.skills.map((s) => ({ name: s.name, score: s.score })),
    answers: ctx.scoredCount, at: new Date().toISOString(),
  };
  const { error } = await supabase.from("rounds").update({
    outcome: d.outcome, went_well: d.went_well || null, went_wrong: d.went_wrong || null,
    asked_questions: d.asked_questions, snapshot,
  }).eq("id", roundId);
  if (error) return { error: "Could not save. Try again." };
  // Only a closing outcome, or reopening a round that had one, changes the job. Editing an earlier
  // round of a closed job leaves it closed.
  const closes = (o: string | null) => o === "offer" || o === "rejected" || o === "withdrew";
  const { error: jobError } = closes(d.outcome) || closes(ctx.round.outcome)
    ? await supabase.from("jobs").update({ status: jobStatusAfter(d.outcome) }).eq("id", jobId)
    : { error: null };
  if (jobError) return { error: "Saved the outcome, but could not update the job. Save again." };
  revalidatePath("/jobs", "layout");
  return {};
}
