// POST /api/chat: streaming chat grounded in the person's own data. Never scored: this route does
// not call judgeAnswer, recordScore or /api/feedback, and writes only to threads and messages.
// Body: { id: thread uuid, message: the new user message from useChat, jobId?, roundId? }
// The reply streams as a UI message stream. History and context come from the database, not the client.
import { consumeStream, createUIMessageStreamResponse, streamText, toUIMessageStream, type ModelMessage } from "ai";
import { z } from "zod";
import { chatSystem, loadChatData } from "@/app/chat/context";
import { SuggestActions } from "@/components/chat/actions";
import type { Json } from "@/lib/database.types";
import { LIMITS, type Card } from "@/lib/schemas";
import { getUser, json, localNow, MODEL, tooLarge } from "@/lib/server";

export const maxDuration = 120;

const Body = z.object({
  id: z.string().uuid(),
  message: z.object({ parts: z.array(z.object({ type: z.string(), text: z.string().optional() })) }),
  jobId: z.string().uuid().nullish(),
  roundId: z.string().uuid().nullish(),
});

export async function POST(req: Request) {
  const { supabase, user } = await getUser();
  if (!user) return json({ error: "Sign in first." }, 401);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Invalid request." }, 400);
  const { id, jobId, roundId } = parsed.data;
  const text = parsed.data.message.parts.filter((p) => p.type === "text").map((p) => p.text ?? "").join("\n").trim();
  if (!text) return json({ error: "Write a message first." }, 400);
  if (text.length > LIMITS.message) return tooLarge("Your message");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) return json({ error: "Finish onboarding first." }, 400);

  // The thread is created on the first message. An id that belongs to someone else fails the insert.
  const { data: thread } = await supabase.from("threads").select("kind").eq("id", id).maybeSingle();
  if (thread ? thread.kind !== "chat" : (await supabase.from("threads").insert({ id, kind: "chat", title: text.slice(0, 60) })).error)
    return json({ error: "Not found." }, 404);

  const { data: stored } = await supabase.from("messages").select("role, content").eq("thread_id", id)
    .order("created_at", { ascending: false }).limit(30);
  const history = (stored ?? []).reverse();
  // A retry after a failed reply sends the same message again; save it once.
  const last = history.at(-1);
  if (last?.role === "user" && last.content === text) history.pop();
  else if ((await supabase.from("messages").insert({ thread_id: id, role: "user", content: text })).error)
    return json({ error: "Could not save your message." }, 500);

  const data = await loadChatData(supabase, { jobId, roundId });
  const messages: ModelMessage[] = [
    ...history.filter((m) => m.content.trim()).map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user", content: text },
  ];

  const result = streamText({
    model: MODEL,
    system: chatSystem(profile, data, (await localNow()).today),
    messages,
    tools: { suggest_actions: { description: "Show up to three buttons under the reply that open a practice tool. Changes nothing.", inputSchema: SuggestActions } },
    onError: ({ error }) => console.error(error),
    onEnd: async ({ text: reply, toolCalls }) => {
      const input = SuggestActions.safeParse(toolCalls.find((c) => c.toolName === "suggest_actions")?.input);
      const actions = input.success ? input.data.actions.slice(0, 3) : [];
      if (!reply.trim() && !actions.length) return;
      const card: Card | null = actions.length ? { type: "actions", actions } : null;
      await supabase.from("messages").insert({ thread_id: id, role: "assistant", content: reply, card: card as Json });
    },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream, onError: () => "The assistant did not answer. Try again." }),
    consumeSseStream: consumeStream, // the reply is saved even when the browser disconnects
  });
}
