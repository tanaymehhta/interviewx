import "server-only";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/database.types";
import type { Criterion, Fact, ResumeAnalysis, StoredBrief } from "@/lib/schemas";
import { activeRound, roundReadiness, weakestSkill } from "@/lib/coach";

/** Model for every AI call, through OpenRouter. Reads OPENROUTER_API_KEY. */
export const openrouter = createOpenRouter();
// AI_MODEL swaps the model without a code change. AI_PROVIDER is OpenRouter routing as JSON, for example
// {"zdr":true,"sort":"throughput"}: only providers that keep no prompt data, fastest first.
export const MODEL = openrouter(process.env.AI_MODEL ?? "anthropic/claude-haiku-5.5",
  process.env.AI_PROVIDER ? { provider: JSON.parse(process.env.AI_PROVIDER) } : {});

export const json = (body: unknown, status = 200) => Response.json(body, { status });
/** 502 with a message the UI can show next to a retry button. */
export const aiFailed = (e: unknown) => {
  console.error(e);
  return json({ error: "The assistant did not answer. Try again." }, 502);
};
export const tooLarge = (what: string) => json({ error: `${what} is too long.` }, 413);

/** Signed-in user for Server Components and Route Handlers. Redirects pages; handlers check `user` themselves. */
export async function getUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user };
}

export async function requireUser() {
  const { supabase, user } = await getUser();
  if (!user) redirect("/signin");
  return { supabase, user };
}

export async function requireProfile() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!profile?.onboarded) redirect("/start");
  return { supabase, user, profile };
}

export type JobContext = {
  job: Tables<"jobs"> & { brief: StoredBrief };
  rounds: (Tables<"rounds"> & { asks: Fact[]; expects: Fact[]; scorecard: Criterion[] })[];
  skills: Tables<"skills">[];
  round: (Tables<"rounds"> & { asks: Fact[]; expects: Fact[]; scorecard: Criterion[] }) | null;
  /** Skills the selected round tests (all job skills when the round lists none). */
  roundSkills: Tables<"skills">[];
  readiness: number;
  weakest: Tables<"skills"> | null;
  scoredCount: number;
};

/**
 * Loads a job with its rounds and skills from the database. RLS returns nothing for another
 * person's id, which becomes a 404 (pages) or null (handlers).
 */
export async function loadJob(
  supabase: Awaited<ReturnType<typeof createClient>>,
  jobId: string,
  roundId?: string | null,
): Promise<JobContext | null> {
  const uuid = /^[0-9a-f-]{36}$/i;
  if (!uuid.test(jobId) || (roundId && !uuid.test(roundId))) return null;
  const [{ data: job }, { data: rounds }, { data: skills }, { count }] = await Promise.all([
    supabase.from("jobs").select("*").eq("id", jobId).maybeSingle(),
    supabase.from("rounds").select("*").eq("job_id", jobId).order("position"),
    supabase.from("skills").select("*").eq("job_id", jobId).order("created_at"),
    supabase.from("answers").select("id", { count: "exact", head: true }).eq("job_id", jobId).not("overall", "is", null),
  ]);
  if (!job) return null;
  const rs = (rounds ?? []) as JobContext["rounds"];
  const round = roundId ? rs.find((r) => r.id === roundId) ?? null : activeRound(rs);
  if (roundId && !round) return null;
  const all = skills ?? [];
  const tested = round ? all.filter((s) => round.skill_ids.includes(s.id)) : [];
  const roundSkills = tested.length ? tested : all;
  return {
    job: job as JobContext["job"], rounds: rs, skills: all, round, roundSkills,
    readiness: roundReadiness(roundSkills.map((s) => s.score)),
    weakest: weakestSkill(roundSkills),
    scoredCount: count ?? 0,
  };
}

/** For pages: 404 when the job or round is missing or belongs to someone else. */
export async function requireJob(jobId: string, roundId?: string | null) {
  const { supabase, user, profile } = await requireProfile();
  const ctx = await loadJob(supabase, jobId, roundId);
  if (!ctx) notFound();
  return { supabase, user, profile, ...ctx };
}

const facts = (xs: Fact[]) => xs.map((f) => `- ${f.text}`).join("\n") || "- (none found)";

/** Prompt text describing the candidate, the job, and the selected round. Built server-side only. */
export function describeContext(profile: Tables<"profiles">, ctx: JobContext): string {
  const analysis = profile.resume_analysis as ResumeAnalysis | null;
  const r = ctx.round;
  return [
    `CANDIDATE: ${profile.name ?? "the candidate"}${profile.program ? `, ${profile.program}` : ""}. Target roles: ${profile.target_roles.join(", ") || "not given"}.`,
    analysis ? `Named stories: ${analysis.stories.map((s) => `"${s.name}" (${s.summary})`).join("; ")}` : "",
    profile.resume_text ? `RESUME:\n${profile.resume_text.slice(0, 6000)}` : "",
    `JOB: ${ctx.job.role} at ${ctx.job.company}. ${ctx.job.brief.summary ?? ""}`,
    `WHAT ${ctx.job.company.toUpperCase()} WANTS:\n${facts(ctx.job.brief.company_wants ?? [])}`,
    ctx.job.brief.requirements?.length
      ? `JOB REQUIREMENTS (against the resume):\n${ctx.job.brief.requirements.map((q) => `- ${q.text} [${q.status}${q.note ? `: ${q.note}` : ""}]`).join("\n")}`
      : "",
    `JOB SKILLS (score 0-100): ${ctx.skills.map((s) => `${s.name} ${s.score}`).join(", ")}`,
    r
      ? `ROUND: ${r.name} (${[r.format, r.length_minutes && `${r.length_minutes} min`, r.interviewer_type].filter(Boolean).join(", ")}).` +
        (r.interviewer_notes ? ` Interviewer notes from the candidate: ${r.interviewer_notes}.` : "") +
        `\nWHAT THIS ROUND ASKS:\n${facts(r.asks)}\nWHAT THIS ROUND EXPECTS:\n${facts(r.expects)}` +
        (r.scorecard.length ? `\nROUND SCORECARD:\n${r.scorecard.map((c) => `- ${c.criterion}: ${c.strong}`).join("\n")}` : "") +
        (r.asked_questions.length ? `\nQuestions asked in the real round: ${r.asked_questions.join(" | ")}` : "")
      : "",
    ctx.weakest ? `Weakest skill for this round: ${ctx.weakest.name} (${ctx.weakest.score}).` : "",
  ].filter(Boolean).join("\n\n");
}

export const STYLE = `Write short, plain sentences in the second person. Be specific and kind, never flattering. No emojis. Never use the words "AI-powered", "unlock", "supercharge", or "seamless".`;

/**
 * The person's local date and hour, from cookies that components/Clock.tsx keeps current.
 * Falls back to the server clock on the very first request.
 */
export async function localNow(): Promise<{ today: string; hour: number }> {
  const { cookies } = await import("next/headers");
  const store = await cookies();
  const today = store.get("today")?.value;
  const hour = Number(store.get("hour")?.value);
  const { localDate } = await import("@/lib/coach");
  return {
    today: today && /^\d{4}-\d{2}-\d{2}$/.test(today) ? today : localDate(),
    hour: Number.isInteger(hour) && store.has("hour") ? hour : new Date().getHours(),
  };
}
