"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { actionHref } from "@/components/chat/actionHref";
import { SuggestActions, type SuggestedAction } from "@/components/chat/actions";
import { Button, TextLink, Turn } from "@/components/ui";
import { LIMITS } from "@/lib/schemas";

export type SavedMessage = { id: string; role: "user" | "assistant"; content: string; actions: SuggestedAction[] };

/** Buttons for one reply: saved ones come as metadata, live ones as the input of the suggest_actions tool call. */
function actionsOf(m: UIMessage): SuggestedAction[] {
  const saved = (m.metadata as { actions?: SuggestedAction[] } | undefined)?.actions;
  if (saved) return saved;
  for (const p of m.parts) {
    if (p.type !== "tool-suggest_actions") continue;
    const input = SuggestActions.safeParse(p.input);
    if (input.success) return input.data.actions.slice(0, 3);
  }
  return [];
}

export function ChatThread({ id, initial, rounds, focus }: {
  id: string;
  initial: SavedMessage[];
  /** round id → job id, for every round the person owns */
  rounds: Record<string, string>;
  focus: { jobId: string; roundId: string | null } | null;
}) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const { messages, sendMessage, regenerate, status, error } = useChat({
    id,
    messages: initial.map((m): UIMessage => ({ id: m.id, role: m.role, parts: [{ type: "text", text: m.content }], metadata: { actions: m.actions } })),
    transport: new DefaultChatTransport({
      api: "/api/chat",
      // The server keeps the history; send only the new message and which job and round are in focus.
      prepareSendMessagesRequest: ({ id, messages }) => ({
        body: { id, message: messages.findLast((m) => m.role === "user"), jobId: focus?.jobId, roundId: focus?.roundId },
      }),
    }),
    onFinish: () => router.refresh(), // the history list picks up a new thread
  });
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => { end.current?.scrollIntoView({ block: "nearest" }); }, [messages]);

  const send = () => {
    const text = input.trim();
    if (!text || busy) return;
    // Put the thread in the address before the first reply, so a reload opens this conversation.
    const url = new URL(window.location.href);
    url.searchParams.set("thread", id);
    window.history.replaceState(null, "", url);
    sendMessage({ text });
    setInput("");
  };

  return (
    <>
      {messages.length === 0 && (
        <p className="rise d2" style={{ padding: "22px 0", borderTop: "1px solid var(--hair)" }}>
          Ask what to fix before your next round, what the company cares about, or how to use the days you have left.
        </p>
      )}
      {messages.map((m, i) => {
        const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
        const streaming = busy && i === messages.length - 1 && m.role === "assistant";
        const actions = streaming || m.role !== "assistant" ? [] : actionsOf(m);
        return (
          <Turn key={m.id} who={m.role === "user" ? "You" : "InterviewX"}>
            <p className="ink" style={{ fontSize: 17, lineHeight: 1.85, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
              {text}{streaming && <span className="caret" />}
            </p>
            {actions.length > 0 && (
              <div className="rise" style={{ display: "flex", gap: 10, flexWrap: "wrap", paddingTop: 14 }}>
                {actions.map((a, n) => {
                  const href = actionHref(a, rounds, focus?.roundId ?? null);
                  return href && <Button key={n} small href={href} variant={n ? "secondary" : "primary"} arrow={!n}>{a.label}</Button>;
                })}
              </div>
            )}
          </Turn>
        );
      })}
      {status === "submitted" && (
        <Turn who="InterviewX"><p className="ink" style={{ fontSize: 17, lineHeight: 1.85 }} role="status" aria-label="Writing a reply"><span className="caret" /></p></Turn>
      )}
      {error && (
        <p role="alert" className="garnet" style={{ padding: "14px 0" }}>
          The assistant did not answer. <TextLink onClick={() => regenerate()}>Try again</TextLink>
        </p>
      )}
      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        style={{ borderTop: "1px solid var(--ink)", paddingTop: 18, marginTop: 24, display: "flex", gap: 12, alignItems: "end" }}
      >
        <label htmlFor="chat-in" style={{ position: "absolute", left: -9999 }}>Message</label>
        <textarea
          id="chat-in" className="inp" rows={2} maxLength={LIMITS.message} style={{ flex: 1 }}
          placeholder="Ask anything about your jobs, rounds or answers"
          value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }}
        />
        <button className="btn sm" type="submit" disabled={busy || !input.trim()}>Send</button>
      </form>
      <div ref={end} />
    </>
  );
}
