"use server";
import { z } from "zod";
import { LIMITS, type InterviewScript } from "@/lib/schemas";
import { wordCount } from "@/lib/score";
import { getUser } from "@/lib/server";

const Input = z.object({
  sessionId: z.string().uuid(),
  index: z.number().int().min(0).max(20),
  text: z.string(),
  seconds: z.number().int().min(0).max(3600).nullable(),
  followUp: z.object({ parentId: z.string().uuid(), question: z.string().min(1).max(1000) }).optional(),
});

/**
 * Saves one interview answer the moment it ends, so nothing is lost if the tab closes.
 * The question, its type, and its skill come from the session's saved script, not from the client.
 */
export async function saveAnswer(input: z.infer<typeof Input>): Promise<{ id: string } | { error: string }> {
  const failed = { error: "We could not save that answer. Press Done to try again." };
  const { supabase, user } = await getUser();
  if (!user) return { error: "Sign in again to continue." };
  const parsed = Input.safeParse(input);
  if (!parsed.success) return failed;
  const { sessionId, index, seconds, followUp } = parsed.data;
  const text = parsed.data.text.trim().slice(0, LIMITS.answer);

  const { data: session } = await supabase.from("sessions").select("id, job_id, script").eq("id", sessionId).eq("tool", "full").maybeSingle();
  const q = (session?.script as InterviewScript | null)?.questions[index];
  if (!session || !q) return failed;

  const [{ data: skill }, { data: parent }] = await Promise.all([
    supabase.from("skills").select("id").eq("job_id", session.job_id).eq("name", q.skill).limit(1).maybeSingle(),
    followUp
      ? supabase.from("answers").select("id").eq("id", followUp.parentId).eq("session_id", session.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  if (followUp && !parent) return failed;

  const { data, error } = await supabase.from("answers").insert({
    session_id: session.id, job_id: session.job_id, skill_id: skill?.id ?? null,
    question: followUp?.question ?? q.text, question_type: q.type, parent_answer_id: parent?.id ?? null,
    text, seconds, word_count: wordCount(text),
  }).select("id").single();
  return error ? failed : { id: data.id };
}
