import "server-only";
import type { createClient } from "@/lib/supabase/server";
import type { Card } from "@/lib/schemas";
import type { Msg } from "@/components/practice/thread";

type DB = Awaited<ReturnType<typeof createClient>>;

/** The round's one Single questions thread. Created on first use. */
export async function singleThread(supabase: DB, roundId: string): Promise<string> {
  const { data } = await supabase.from("threads").select("id").eq("kind", "single").eq("round_id", roundId)
    .order("created_at").limit(1).maybeSingle();
  if (data) return data.id;
  const { data: made, error } = await supabase.from("threads").insert({ kind: "single", round_id: roundId }).select("id").single();
  if (error) throw error;
  return made.id;
}

/** Latest messages, oldest first. */
export async function threadMessages(supabase: DB, threadId: string, limit: number): Promise<Msg[]> {
  const { data } = await supabase.from("messages").select("id, role, content, card, answer_id")
    .eq("thread_id", threadId).order("created_at", { ascending: false }).limit(limit);
  return (data ?? []).reverse().map((m) => ({
    id: m.id, role: m.role as Msg["role"], content: m.content, card: m.card as Card | null, answerId: m.answer_id,
  }));
}
