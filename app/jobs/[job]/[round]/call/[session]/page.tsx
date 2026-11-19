import { notFound } from "next/navigation";
import { CountUp } from "@/components/CountUp";
import { FeedbackCard } from "@/components/FeedbackCard";
import { TopBar } from "@/components/TopBar";
import { RetryScore } from "@/components/call/RetryScore";
import { Bar, Button, Eyebrow } from "@/components/ui";
import type { Feedback } from "@/lib/schemas";
import { MIN_WORDS } from "@/lib/score";
import { requireJob } from "@/lib/server";

export default async function CallRecap({ params }: { params: Promise<{ job: string; round: string; session: string }> }) {
  const { job: jobId, round: roundId, session: sessionId } = await params;
  const { supabase, job, round, skills } = await requireJob(jobId, roundId);
  if (!/^[0-9a-f-]{36}$/i.test(sessionId)) notFound();
  const [{ data: session }, { data: rows }] = await Promise.all([
    supabase.from("sessions").select("*").eq("id", sessionId).eq("round_id", roundId).eq("tool", "call").maybeSingle(),
    supabase.from("answers").select("*").eq("session_id", sessionId).order("created_at"),
  ]);
  if (!session) notFound();
  const answers = rows ?? [];
  const planned = (session.script as { questions?: unknown[] } | null)?.questions?.length ?? answers.length;

  // Score change per skill: the entry before this call's first scored answer, and this call's last entry.
  const ids = new Set(answers.map((a) => a.id));
  const skillIds = [...new Set(answers.map((a) => a.skill_id).filter((s): s is string => !!s))];
  const { data: history } = skillIds.length
    ? await supabase.from("skill_scores").select("skill_id, answer_id, score").in("skill_id", skillIds).order("created_at")
    : { data: [] };
  const changes = skillIds.flatMap((id) => {
    const all = (history ?? []).filter((h) => h.skill_id === id);
    const first = all.findIndex((h) => h.answer_id && ids.has(h.answer_id));
    const last = all.findLast((h) => h.answer_id && ids.has(h.answer_id));
    const skill = skills.find((s) => s.id === id);
    return first < 0 || !last || !skill ? [] : [{ name: skill.name, before: all[first - 1]?.score ?? 50, after: last.score }];
  });
  const base = `/jobs/${job.id}/${round!.id}`;

  return (
    <div className="wrap">
      <TopBar active="jobs" roundId={round!.id} />
      <main style={{ padding: "48px 0 96px", display: "flex", flexDirection: "column", gap: 40 }}>
        <header className="rise" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Eyebrow>{job.company} · {round!.name} · Call recap</Eyebrow>
          <h1 className="serif" style={{ fontSize: "clamp(40px, 7vw, 57px)", lineHeight: 1.05 }}>Your call, <span className="ital">reviewed.</span></h1>
          <p style={{ fontSize: 17 }}>
            {answers.length} of {planned} questions answered.
            {answers.length < planned && " You ended the call early. The answers you gave are kept."}
          </p>
        </header>

        {changes.length > 0 && (
          <section className="rise d1" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: 24 }}>
            {changes.map((c) => (
              <div key={c.name} style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 360 }}>
                <Eyebrow>{c.name}</Eyebrow>
                <p className="serif num ink" style={{ fontSize: 56, lineHeight: 1 }}>
                  <span style={{ fontSize: 28, color: "var(--stone)" }}>{c.before} → </span><CountUp from={c.before} to={c.after} />
                </p>
                <Bar value={c.after} />
              </div>
            ))}
          </section>
        )}

        {answers.length === 0 && <p className="ink">No answers were recorded in this call.</p>}
        {answers.map((a, i) => (
          <section key={a.id} className="rise d2" style={{ borderTop: "1px solid var(--hair)", paddingTop: 28, display: "flex", flexDirection: "column", gap: 12 }}>
            <Eyebrow>Question {i + 1}{a.question_type ? ` · ${a.question_type}` : ""}</Eyebrow>
            <h2 className="serif ink" style={{ fontSize: 30, lineHeight: 1.15 }}>{a.question}</h2>
            <p className="who" style={{ paddingTop: 8 }}>Your answer</p>
            <p className="ink" style={{ fontSize: 16, lineHeight: 1.8 }}>{a.text}</p>
            {a.feedback ? <FeedbackCard feedback={a.feedback as unknown as Feedback} />
              : (a.word_count ?? 0) < MIN_WORDS ? <p style={{ fontSize: 14 }}>This answer was too short to score. Your scorecard did not change.</p>
              : <RetryScore answerId={a.id} />}
          </section>
        ))}

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Button href={base}>Back to round</Button>
          <Button variant="secondary" href={`${base}/scorecard`}>Open Feedback</Button>
        </div>
      </main>
    </div>
  );
}
