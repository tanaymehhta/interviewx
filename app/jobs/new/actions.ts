"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { buildPlan } from "@/lib/coach";
import { BriefRound, Fact, LIMITS, Requirement, Source, type StoredBrief } from "@/lib/schemas";
import { getUser, localNow } from "@/lib/server";

const short = z.string().trim().max(400);
const NewJob = z.object({
  company: z.string().trim().min(1).max(120),
  role: z.string().trim().min(1).max(120),
  sourceUrl: z.string().trim().max(2000).regex(/^https?:\/\//i).nullable(),
  postingText: z.string().max(LIMITS.posting).nullable(),
  summary: z.string().max(1000),
  company_wants: z.array(Fact).max(20),
  requirements: z.array(Requirement).max(20),
  missing: z.array(short).max(10),
  skills: z.array(z.object({ name: short.min(1), reason: z.string().max(600), source: Source })).max(12),
  rounds: z.array(BriefRound.extend({
    name: short.min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
    notes: z.string().trim().max(1000),
    done: z.boolean(),
  })).min(1).max(12),
});
export type NewJob = z.infer<typeof NewJob>;

/** Writes the job, its skills, rounds, and plans, then opens the job page. Returns only on failure. */
export async function createJob(input: NewJob): Promise<{ error: string }> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Sign in first." };
  const parsed = NewJob.safeParse(input);
  if (!parsed.success) return { error: "Give the job a company, a role, and at least one named round." };
  const d = parsed.data;
  const { today } = await localNow();

  const brief: StoredBrief = { summary: d.summary, company_wants: d.company_wants, requirements: d.requirements, missing: d.missing, researched_at: new Date().toISOString() };
  const { data: job } = await supabase.from("jobs")
    .insert({ company: d.company, role: d.role, source_url: d.sourceUrl, posting_text: d.postingText, brief })
    .select("id").single();
  if (!job) return { error: "Could not save the job. Try again." };

  const ok = await (async () => {
    const skills = d.skills.length
      ? (await supabase.from("skills").insert(d.skills.map((s) => ({ job_id: job.id, name: s.name, reason: s.reason }))).select("id, name")).data
      : [];
    if (!skills) return false;
    const idOf = new Map(skills.map((s) => [s.name, s.id]));
    const { data: rounds } = await supabase.from("rounds").insert(d.rounds.map((r, i) => ({
      job_id: job.id, position: i + 1, name: r.name, format: r.format, length_minutes: Math.round(r.length_minutes) || null,
      interviewer_type: r.interviewer_type, asks: r.asks, expects: r.expects, scorecard: r.scorecard,
      skill_ids: r.skills.flatMap((n) => idOf.get(n) ?? []), date: r.date, interviewer_notes: r.notes || null,
      outcome: r.done ? "advanced" : null,
    }))).select("id, date, skill_ids, outcome");
    if (!rounds) return false;
    const all = skills.map((s) => ({ id: s.id, score: 50, last_practiced_at: null }));
    const days = rounds.filter((r) => r.date && !r.outcome).flatMap((r) => {
      const tested = all.filter((s) => r.skill_ids.includes(s.id));
      return buildPlan(today, r.date!, tested.length ? tested : all).map((p) => ({ ...p, round_id: r.id }));
    });
    return !days.length || !(await supabase.from("plan_days").insert(days)).error;
  })();
  if (!ok) {
    await supabase.from("jobs").delete().eq("id", job.id); // cascades; no half-built job is left behind
    return { error: "Could not save the job. Try again." };
  }
  redirect(`/jobs/${job.id}`);
}
