// Results of one full interview, rendered from saved data so it can be reopened from the answer log.
import { notFound } from "next/navigation";
import { CountUp } from "@/components/CountUp";
import { FeedbackCard } from "@/components/FeedbackCard";
import { FinishReview } from "@/components/interview/FinishReview";
import { TopBar } from "@/components/TopBar";
import { Bar, Button, fmtDate, fmtTime, RoundFitList, ScoreList, SwotGrid } from "@/components/ui";
import type { Feedback, InterviewScript, StoredReview } from "@/lib/schemas";
import { MIN_WORDS, wordCount } from "@/lib/score";
import { requireJob } from "@/lib/server";

export const metadata = { title: "Interview results" };

// The mock keeps these two rules in its page head; globals.css does not have them.
const ROW_CSS = `.qrow{transition:background-color 150ms ease-out}.qrow:hover{background:var(--ivory)}
.chev{display:inline-block;transition:transform 200ms var(--ease)}details[open]>summary .chev{transform:rotate(180deg)}`;

export default async function Page({ params }: { params: Promise<{ job: string; round: string; session: string }> }) {
  const { job, round: roundId, session: sessionId } = await params;
  const ctx = await requireJob(job, roundId);
  const round = ctx.round!;
  const base = `/jobs/${ctx.job.id}/${round.id}`;

  const { data: session } = await ctx.supabase.from("sessions").select("*")
    .eq("id", sessionId).eq("round_id", round.id).eq("tool", "full").maybeSingle();
  if (!session) notFound();
  const { data: rows } = await ctx.supabase.from("answers").select("*").eq("session_id", session.id).order("created_at");
  const answers = rows ?? [];
  const mains = answers.filter((a) => !a.parent_answer_id);
  const review = session.review as StoredReview | null;
  const planned = review?.planned ?? (session.script as InterviewScript | null)?.questions.length ?? mains.length;
  const scored = mains.filter((a) => a.overall != null).length;

  const longest = answers.find((a) => review && a.seconds === review.delivery.longestSeconds && a.seconds);
  const longestNo = longest ? mains.findIndex((a) => a.id === (longest.parent_answer_id ?? longest.id)) + 1 : 0;
  const missing = review?.round_fit.find((f) => f.status === "missing");
  const weakest = ctx.weakest;

  return (
    <div className="wrap">
      <style>{ROW_CSS}</style>
      <TopBar active="jobs" roundId={round.id} />

      <section style={{ padding: "56px 0 48px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 440px), 1fr))", gap: 48, alignItems: "end" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <p className="eyebrow rise">
            Full interview{session.length_minutes ? ` · ${session.length_minutes} min` : ""} · {fmtDate(session.started_at)}
          </p>
          {review ? (
            <>
              {session.status === "incomplete" && <p className="eyebrow garnet rise">Incomplete · {review.asked} of {review.planned}</p>}
              <div className="rise d1" style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
                <span className="serif num" style={{ fontSize: "clamp(96px, 22vw, 132px)", lineHeight: 0.9 }}>
                  {scored ? <CountUp to={review.overall} decimals={1} /> : "–"}
                </span>
                <span className="serif" style={{ fontSize: 36, color: "var(--stone)" }}>/ 10</span>
              </div>
              <p className="serif rise d2" style={{ fontSize: 30, lineHeight: 1.25, maxWidth: 560 }}>“{review.verdict}”</p>
              {!scored && <p style={{ fontSize: 14 }}>No answer could be scored. Answers under {MIN_WORDS} words are not scored.</p>}
            </>
          ) : (
            <>
              <p className="eyebrow garnet rise">Incomplete · {mains.length} of {planned}</p>
              <h1 className="serif rise d1" style={{ fontSize: "clamp(42px, 8vw, 64px)", lineHeight: 1.02 }}>The review is not <span className="ital">finished.</span></h1>
              <p className="rise d2">
                {scored} of {mains.length} answers are reviewed and listed below. Finish the review to score the rest and get your verdict, round fit, and SWOT.
              </p>
              <div className="rise d3"><FinishReview sessionId={session.id} /></div>
            </>
          )}
        </div>
        {review && (
          <div className="card soft rise d3" style={{ padding: 32, display: "flex", flexDirection: "column", gap: 14 }}>
            <span className="eyebrow">{round.name} readiness</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
              <span className="serif num" style={{ fontSize: 40, color: "var(--stone)" }}>{review.readiness.before}</span>
              <span className="olive" style={{ fontSize: 22 }} aria-label="to">→</span>
              <span className="serif num" style={{ fontSize: 72, lineHeight: 1 }}><CountUp from={review.readiness.before} to={review.readiness.after} /></span>
            </div>
            <Bar value={review.readiness.after} />
            {weakest && <span style={{ fontSize: 14 }}>Your weakest skill for this round is now {weakest.name} ({weakest.score}).</span>}
          </div>
        )}
      </section>

      {review && (
        <>
          <section className="rise d4" style={{ display: "flex", flexDirection: "column", gap: 18, paddingBottom: 56 }}>
            <h2 className="serif" style={{ fontSize: 36 }}>Round fit</h2>
            <p style={{ marginTop: -10 }}>What {ctx.job.company} expects in the {round.name.toLowerCase()} round, and how this interview did.</p>
            {review.round_fit.length ? <RoundFitList items={review.round_fit} /> : <p style={{ fontSize: 14 }}>This round has no listed expectations yet.</p>}
          </section>

          {(review.scorecard ?? []).length > 0 && (
            <section className="rise d4" style={{ display: "flex", flexDirection: "column", gap: 18, paddingBottom: 56 }}>
              <h2 className="serif" style={{ fontSize: 36 }}>Round scorecard</h2>
              <p style={{ marginTop: -10 }}>What the {round.name.toLowerCase()} round is scored on, and your score on each from this interview.</p>
              <div className="card" style={{ padding: 28 }}><ScoreList items={review.scorecard} /></div>
            </section>
          )}

          <section className="rise d5" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 460px), 1fr))", gap: 20, paddingBottom: 56 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <h2 className="serif" style={{ fontSize: 36 }}>SWOT</h2>
              <SwotGrid swot={review.swot} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <h2 className="serif" style={{ fontSize: 36 }}>Delivery</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
                {([
                  [review.delivery.talkSeconds ? fmtTime(review.delivery.talkSeconds) : "–", "talk time", false],
                  [review.delivery.wpm || "–", "words per minute", false],
                  [review.delivery.fillers, "filler words (“um”, “like”)", review.delivery.fillers > 10],
                  [review.delivery.longestSeconds ? fmtTime(review.delivery.longestSeconds) : "–", `longest answer${longestNo ? ` · question ${longestNo}` : ""}`, false],
                ] as const).map(([value, label, garnet]) => (
                  <div key={label} className="card" style={{ padding: 22 }}>
                    <span className={`serif num${garnet ? " garnet" : ""}`} style={{ fontSize: 40 }}>{value}</span>
                    <p style={{ fontSize: 13 }}>{label}</p>
                  </div>
                ))}
              </div>
              {!review.delivery.talkSeconds && <p style={{ fontSize: 13 }}>Typed answers are not timed.</p>}
            </div>
          </section>
        </>
      )}

      <section className="rise d6" style={{ display: "flex", flexDirection: "column", paddingBottom: 56 }}>
        <h2 className="serif" style={{ fontSize: 36, paddingBottom: 14 }}>Question by question</h2>
        {mains.map((a, i) => {
          const followUps = answers.filter((f) => f.parent_answer_id === a.id);
          const feedback = a.feedback as Feedback | null;
          return (
            <details key={a.id} className="turn" style={{ paddingTop: 0, paddingBottom: 0 }}>
              <summary className="qrow" style={{ display: "flex", gap: 20, alignItems: "baseline", padding: "22px 0" }}>
                <span className="serif ital" style={{ fontSize: 18 }}>{i + 1}</span>
                <span className="ink" style={{ flex: 1 }}>
                  {a.question}
                  {followUps.length > 0 && <span style={{ fontSize: 13, color: "var(--stone)" }}> · {followUps.length} follow-up</span>}
                </span>
                <span className="serif num" style={{ fontSize: 24 }}>{a.overall != null ? Number(a.overall).toFixed(1) : "–"}</span>
                <span className="chev ink" aria-hidden="true">⌄</span>
              </summary>
              <div style={{ padding: "2px 0 30px 38px", display: "flex", flexDirection: "column", gap: 24 }}>
                {feedback ? <FeedbackCard feedback={feedback} bare />
                  : wordCount(a.text) < MIN_WORDS ? <p className="ink">This answer has fewer than {MIN_WORDS} words, so it was not scored. Give a fuller answer next time.</p>
                  : <FeedbackCard feedback={null} bare />}
                <div>
                  <p className="who">Your answer</p>
                  <p style={{ fontSize: 15 }}>{a.text || "(no answer)"}</p>
                </div>
                {followUps.map((f) => (
                  <div key={f.id}>
                    <p className="who">Follow-up</p>
                    <p className="ink" style={{ fontSize: 15 }}>{f.question}</p>
                    <p className="who" style={{ paddingTop: 10 }}>Your answer</p>
                    <p style={{ fontSize: 15 }}>{f.text || "(no answer)"}</p>
                  </div>
                ))}
              </div>
            </details>
          );
        })}
      </section>

      <section className="card rise d7" style={{ padding: 36, marginBottom: 96, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24, flexWrap: "wrap", background: "var(--olive)", borderColor: "var(--olive)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span className="eyebrow" style={{ color: "var(--on-olive)", opacity: 0.8 }}>Next</span>
          <span className="serif" style={{ fontSize: 32, color: "var(--on-olive)" }}>
            {missing ? `Practice the answer on ${missing.expectation}.` : weakest ? `Practice ${weakest.name}, your weakest skill.` : "Keep practicing for this round."}
          </span>
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {missing && (
            <Button href={`${base}/practice?q=${encodeURIComponent(missing.expectation)}`} arrow style={{ background: "var(--on-olive)", color: "var(--ink)", borderColor: "var(--on-olive)" }}>
              Practice in Single questions
            </Button>
          )}
          {weakest && (
            <Button href={`${base}/practice?skill=${weakest.id}`} arrow={!missing} variant={missing ? "secondary" : "primary"}
              style={missing ? { color: "var(--on-olive)", borderColor: "var(--on-olive)" } : { background: "var(--on-olive)", color: "var(--ink)", borderColor: "var(--on-olive)" }}>
              {missing ? `Practice ${weakest.name}` : "Practice in Single questions"}
            </Button>
          )}
          <Button href={base} variant="secondary" style={{ color: "var(--on-olive)", borderColor: "var(--on-olive)" }}>Back to round</Button>
        </div>
      </section>
    </div>
  );
}
