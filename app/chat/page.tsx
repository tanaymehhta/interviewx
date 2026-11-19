import Link from "next/link";
import { loadChatData } from "@/app/chat/context";
import { TopBar } from "@/components/TopBar";
import { ChatThread, type SavedMessage } from "@/components/chat/ChatThread";
import { addDays } from "@/lib/coach";
import type { Card } from "@/lib/schemas";
import { localNow, requireProfile } from "@/lib/server";

const UUID = /^[0-9a-f-]{36}$/i;
const one = (v: string | string[] | undefined) => (typeof v === "string" && UUID.test(v) ? v : null);

/**
 * Groups threads by the person's calendar day. Their UTC offset comes from the clock cookies.
 * ponytail: whole hours only, so a half-hour time zone can misfile a thread made within 30 minutes
 * of midnight; store the offset in minutes in a cookie if that matters.
 */
function groupByDay<T extends { created_at: string }>(threads: T[], today: string, hour: number) {
  const offset = Date.parse(`${today}T${String(hour).padStart(2, "0")}:00:00Z`) - Math.floor(Date.now() / 3600_000) * 3600_000;
  const dayOf = (iso: string) => new Date(Date.parse(iso) + offset).toISOString().slice(0, 10);
  const yesterday = addDays(today, -1);
  const label = (t: T) => (dayOf(t.created_at) >= today ? "Today" : dayOf(t.created_at) === yesterday ? "Yesterday" : "Earlier");
  return ["Today", "Yesterday", "Earlier"].map((name) => ({ name, threads: threads.filter((t) => label(t) === name) })).filter((g) => g.threads.length);
}

export default async function ChatPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const threadId = one(sp.thread), jobId = one(sp.job), roundId = one(sp.round);
  const { supabase } = await requireProfile();
  const { today, hour } = await localNow();
  const [data, { data: threads }, { data: thread }, { data: rows }] = await Promise.all([
    loadChatData(supabase, { jobId, roundId }),
    supabase.from("threads").select("id, title, created_at").eq("kind", "chat").order("created_at", { ascending: false }).limit(50),
    threadId ? supabase.from("threads").select("kind").eq("id", threadId).maybeSingle() : Promise.resolve({ data: null }),
    threadId ? supabase.from("messages").select("id, role, content, card").eq("thread_id", threadId).order("created_at") : Promise.resolve({ data: null }),
  ]);

  // A thread id that is not saved yet is a conversation whose first message is on its way; keep the id.
  const open = threadId && thread?.kind !== "single" ? threadId : null;
  const id = open ?? crypto.randomUUID();
  const initial: SavedMessage[] = (open ? rows ?? [] : []).map((m) => {
    const card = m.card as unknown as Card | null;
    return { id: m.id, role: m.role as "user" | "assistant", content: m.content, actions: card?.type === "actions" ? card.actions.map((a) => ({ round_id: null, ...a })) : [] };
  });
  const focus = data.focusJob ? { jobId: data.focusJob.id, roundId: data.focusRound?.id ?? null } : null;
  const keep = jobId ? `&job=${jobId}${roundId ? `&round=${roundId}` : ""}` : "";
  const n = data.jobs.length;

  return (
    <div className="wrap">
      <style href="ix-chat" precedence="default">{`.hist{transition:background-color 150ms ease-out}.hist:hover{background:var(--ivory)}`}</style>
      <TopBar active="chat" roundId={data.focusRound?.id} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 48, padding: "40px 0 72px" }}>
        <aside className="rise" style={{ flex: "1 1 220px", maxWidth: 280, display: "flex", flexDirection: "column", gap: 6 }}>
          <Link className="btn ghost sm" href={`/chat${keep ? `?${keep.slice(1)}` : ""}`} style={{ marginBottom: 18 }}>New chat</Link>
          {groupByDay(threads ?? [], today, hour).map((g, i) => (
            <div key={g.name} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span className="eyebrow" style={{ padding: i ? "16px 0 8px" : "8px 0" }}>{g.name}</span>
              {g.threads.map((t) => (
                <Link key={t.id} className="hist" href={`/chat?thread=${t.id}${keep}`} aria-current={t.id === open ? "page" : undefined}
                  style={{ padding: "10px 12px", textDecoration: "none", fontSize: 15, overflowWrap: "anywhere", color: t.id === open ? "var(--ink)" : "var(--stone)", background: t.id === open ? "var(--ivory)" : undefined }}>
                  {t.title || "Untitled chat"}
                </Link>
              ))}
            </div>
          ))}
        </aside>

        <main style={{ flex: "999 1 560px", minWidth: 0, display: "flex", flexDirection: "column" }}>
          <div className="rise d1" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", paddingBottom: 18 }}>
            <h1 className="serif" style={{ fontSize: 44, lineHeight: 1.05 }}>Chat</h1>
            <span style={{ fontSize: 13 }}>Knows your resume, {n} {n === 1 ? "job" : "jobs"}, research, scores and past answers · never scored</span>
          </div>
          <ChatThread key={id} id={id} initial={initial} focus={focus} rounds={Object.fromEntries(data.rounds.map((r) => [r.id, r.job_id]))} />
        </main>
      </div>
    </div>
  );
}
