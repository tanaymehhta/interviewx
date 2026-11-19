// POST /api/feedback: scores one answer with the shared feedback schema (Call and Single questions).
// Body: { jobId, roundId, tool: "single" | "call", question, questionType?, skillId?, text, seconds?, sessionId? }
//   or  { answerId } to retry scoring an answer that was saved unscored.
// 200 { answerId, sessionId, feedback, change } | 200 { answerId, sessionId, tooShort: true }
// 502 { answerId, sessionId, error } when the model fails: the answer stays saved and unscored.
import { z } from "zod";
import { LIMITS, type Feedback } from "@/lib/schemas";
import { getUser, json, loadJob, localNow, tooLarge } from "@/lib/server";
import { judgeAnswer, MIN_WORDS, recordScore, sessionFor, wordCount } from "@/lib/score";

export const maxDuration = 60;

const Body = z.union([
  z.object({ answerId: z.string().uuid() }),
  z.object({
    jobId: z.string().uuid(), roundId: z.string().uuid(), tool: z.enum(["single", "call"]),
    question: z.string().min(1).max(1000), questionType: z.string().max(40).nullish(),
    skillId: z.string().uuid().nullish(), text: z.string(), seconds: z.number().int().min(0).max(3600).nullish(),
    sessionId: z.string().uuid().nullish(),
  }),
]);

export async function POST(req: Request) {
  const { supabase, user } = await getUser();
  if (!user) return json({ error: "Sign in first." }, 401);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Invalid request." }, 400);
  const body = parsed.data;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) return json({ error: "Finish onboarding first." }, 400);

  // Load or create the answer row first, so nothing the person said is lost if scoring fails.
  let answer, tool: "single" | "call" | "full";
  if ("answerId" in body) {
    const { data } = await supabase.from("answers").select("*, sessions(round_id, tool)").eq("id", body.answerId).maybeSingle();
    if (!data) return json({ error: "Not found." }, 404);
    answer = data;
    tool = (data as unknown as { sessions: { tool: "single" | "call" | "full" } }).sessions.tool;
  } else {
    if (body.text.length > LIMITS.answer) return tooLarge("Your answer");
    const ctx = await loadJob(supabase, body.jobId, body.roundId);
    if (!ctx?.round) return json({ error: "Not found." }, 404);
    const sessionId = body.sessionId ?? (await sessionFor(supabase, ctx, body.tool)).id;
    const { data, error } = await supabase.from("answers").insert({
      job_id: ctx.job.id, session_id: sessionId, skill_id: body.skillId ?? ctx.weakest?.id ?? null,
      question: body.question, question_type: body.questionType ?? null, text: body.text.trim(),
      seconds: body.seconds ?? null, word_count: wordCount(body.text),
    }).select("*").single();
    if (error) return json({ error: "Could not save your answer." }, 500);
    answer = data;
    tool = body.tool;
  }
  const out = { answerId: answer.id, sessionId: answer.session_id };
  if (wordCount(answer.text) < MIN_WORDS) return json({ ...out, tooShort: true });

  const roundId = "answerId" in body
    ? (answer as unknown as { sessions: { round_id: string } }).sessions.round_id
    : body.roundId;
  const ctx = await loadJob(supabase, answer.job_id, roundId);
  if (!ctx) return json({ error: "Not found." }, 404);

  let feedback: Feedback;
  try {
    feedback = await judgeAnswer(profile, ctx, {
      question: answer.question, questionType: answer.question_type, text: answer.text, seconds: answer.seconds,
    });
  } catch (e) {
    console.error(e);
    return json({ ...out, error: "We saved your answer but could not score it." }, 502);
  }
  const change = await recordScore(supabase, ctx, answer.id, feedback, { skillId: answer.skill_id, tool, today: (await localNow()).today });
  return json({ ...out, feedback, change });
}
