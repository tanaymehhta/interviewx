import type { Json } from "@/lib/database.types";
import type { Card } from "@/lib/schemas";
import { difficultyBand } from "@/lib/coach";
import { requireJob } from "@/lib/server";
import { TopBar } from "@/components/TopBar";
import { Accent, TextLink } from "@/components/ui";
import { PracticeThread } from "@/components/practice/PracticeThread";
import { pendingQuestion, suggestions, type Msg } from "@/components/practice/thread";
import { singleThread, threadMessages } from "@/app/api/single/thread";

export const metadata = { title: "Single questions · InterviewX" };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim();

export default async function Page({ params, searchParams }: {
  params: Promise<{ job: string; round: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { job: jobId, round: roundId } = await params;
  const sp = await searchParams;
  const { supabase, job, rounds, skills, weakest, ...ctx } = await requireJob(jobId, roundId);
  const round = ctx.round!;

  const threadId = await singleThread(supabase, round.id);
  // ponytail: shows the latest 200 messages; add "show earlier" paging if threads grow past that.
  const msgs: Msg[] = await threadMessages(supabase, threadId, 200);

  const answerIds = msgs.flatMap((m) => (m.role === "user" && m.answerId ? [m.answerId] : []));
  if (answerIds.length) {
    const { data } = await supabase.from("answers").select("id, seconds").in("id", answerIds);
    const seconds = new Map((data ?? []).map((a) => [a.id, a.seconds]));
    for (const m of msgs) if (m.role === "user" && m.answerId) m.seconds = seconds.get(m.answerId);
  }

  // ?q=<question> opens with that question as a card. No model call. A reload does not post it twice.
  const q = first(sp.q)?.slice(0, 1000);
  if (q && pendingQuestion(msgs)?.text !== q) {
    const real = rounds.some((r) => r.asked_questions.includes(q));
    const card: Card = { type: "question", question: {
      text: q,
      type: /\bcase\b|estimate|market siz/i.test(q) ? "Case" : "Behavioral",
      difficulty: weakest ? difficultyBand(weakest.score) : "standard",
      why: real ? "you were asked this in a real round." : `you chose it to practice for the ${round.name}.`,
      skill: weakest?.name ?? "",
    } };
    const { data } = await supabase.from("messages")
      .insert({ thread_id: threadId, role: "assistant", card: card as unknown as Json }).select("id").single();
    if (data) msgs.push({ id: data.id, role: "assistant", content: "", card });
  }

  const skill = skills.find((s) => s.id === first(sp.skill));
  const asked = [...new Set([...round.asked_questions, ...rounds.filter((r) => r.id !== round.id).flatMap((r) => r.asked_questions)])];

  return (
    <div className="wrap" style={{ maxWidth: 920 }}>
      <TopBar active="jobs" roundId={round.id} />
      <section style={{ padding: "40px 0 24px", display: "flex", flexDirection: "column", gap: 10 }}>
        <TextLink href={`/jobs/${job.id}/${round.id}`} style={{ alignSelf: "flex-start", fontSize: 14 }}>← {round.name}</TextLink>
        <h1 className="serif rise d1" style={{ fontSize: "clamp(40px, 9vw, 56px)", lineHeight: 1.02 }}>Single <Accent>questions</Accent></h1>
        <p className="rise d2">Ask for a question in your own words, answer it, and get scored. Your answers count toward your scorecard.</p>
      </section>
      <PracticeThread
        jobId={job.id}
        roundId={round.id}
        roundName={round.name}
        initial={msgs}
        suggestions={suggestions(weakest?.name ?? null, round.asks, asked)}
        skills={skills.map((s) => ({ id: s.id, name: s.name }))}
        autoSend={skill && !q ? `Ask me a question on ${skill.name}.` : undefined}
      />
    </div>
  );
}
