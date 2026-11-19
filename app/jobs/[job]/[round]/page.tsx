import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { Button, fmtDate, TextLink, ToolTile } from "@/components/ui";
import { AccentLast, inDays, OUTCOME_LABEL, roundMeta } from "@/components/jobs/bits";
import { daysBetween, isEarlyEstimate, type Outcome } from "@/lib/coach";
import type { Fact } from "@/lib/schemas";
import { localNow, requireJob } from "@/lib/server";
import { setRoundDate } from "./actions";
import { Calendar } from "./Calendar";
import { CheckIn } from "./CheckIn";

type Snapshot = { readiness: number; skills: { name: string; score: number }[]; answers: number; at: string };
const TOOL = { single: "Single questions", call: "Call", full: "Full interview" } as const;
const col = (gap: number) => ({ display: "flex", flexDirection: "column", gap }) as const;
const h1 = { fontSize: "clamp(44px, 9vw, 76px)", lineHeight: 1 } as const;

export default async function Page({ params, searchParams }: {
  params: Promise<{ job: string; round: string }>; searchParams: Promise<{ saved?: string }>;
}) {
  const { job: jobId, round: roundId } = await params;
  const { saved } = await searchParams;
  const ctx = await requireJob(jobId, roundId);
  const { supabase, job, rounds, skills, readiness, weakest, scoredCount } = ctx;
  const round = ctx.round!;
  const { today } = await localNow();
  const base = `/jobs/${job.id}/${round.id}`;
  const index = rounds.findIndex((r) => r.id === round.id);
  const nextRound = rounds[index + 1]?.name ?? null;
  const days = round.date ? daysBetween(today, round.date) : null;
  const outcome = round.outcome as Outcome | null;
  const snapshot = round.snapshot as Snapshot | null;
  const settled = outcome !== null && outcome !== "waiting";

  const checkIn = (
    <CheckIn jobId={job.id} roundId={round.id}
      initial={{ outcome, went_well: round.went_well ?? "", went_wrong: round.went_wrong ?? "", asked_questions: round.asked_questions }}
      saved={snapshot ? { readiness: snapshot.readiness, answers: snapshot.answers } : { readiness, answers: scoredCount }} />
  );
  const back = <TextLink href={`/jobs/${job.id}`} style={{ alignSelf: "flex-start", fontSize: 14 }}>← {job.company} · {job.role}</TextLink>;
  // JobContext types these columns as Json & Fact[]; the cast picks the real shape.
  const asks = round.asks as Fact[];
  const expectations: Fact[] = round.expects.length
    ? (round.expects as Fact[])
    : [{ text: "Nothing was found for this round. Add expectations on the job page.", source: "general", url: null }];

  // Just saved an outcome (CheckIn mock, second state).
  if (saved && outcome) {
    const [title, text] = {
      waiting: ["Saved.", "The job stays active. Change the outcome on this round when you hear from them."],
      advanced: ["Well done.", nextRound ? `${nextRound} is now your active round.` : "That was the last round on your list. Log the offer on this round when it arrives."],
      offer: ["Congratulations.", `${job.company} moves to Past jobs with status Offer. Your readiness of ${snapshot?.readiness ?? readiness} and ${snapshot?.answers ?? scoredCount} practice answers are saved with it.`],
      rejected: ["Saved. That one hurts.", `${job.company} moves to Past jobs. Your notes and the questions they asked stay with this round.`],
      withdrew: ["Saved.", `${job.company} moves to Past jobs with status Withdrawn.`],
    }[outcome];
    return (
      <div className="wrap" style={{ maxWidth: 960 }}>
        <TopBar active="jobs" roundId={round.id} />
        <section style={{ padding: "120px 0", display: "flex", flexDirection: "column", gap: 24, alignItems: "flex-start" }}>
          <svg className="rise" width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
            <circle cx="28" cy="28" r="27" stroke="var(--olive)" /><path d="M17 29l7 7 15-16" stroke="var(--olive)" strokeWidth="1.6" />
          </svg>
          <h1 className="serif rise d1" style={{ fontSize: "clamp(40px, 8vw, 64px)", lineHeight: 1.02 }}>{title}</h1>
          <p className="rise d2" style={{ maxWidth: 560 }}>{text}</p>
          <div className="rise d3" style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
            <Button href="/jobs" arrow>Back to My Jobs</Button>
            <TextLink href={base}>Edit answers</TextLink>
          </div>
        </section>
      </div>
    );
  }

  // Interview day: only the expectations and one warm-up call.
  if (days === 0 && !outcome)
    return (
      <div className="wrap" style={{ maxWidth: 960 }}>
        <TopBar active="jobs" roundId={round.id} />
        <section style={{ ...col(36), padding: "72px 0 96px", alignItems: "flex-start" }}>
          <div style={col(12)}>
            {back}
            <p className="eyebrow rise d1">{[job.company, fmtDate(today, { weekday: "long", day: "numeric", month: "long" }), roundMeta(round)].filter(Boolean).join(" · ")}</p>
            <h1 className="serif rise d2" style={h1}>Today is your <span className="ital">{round.name}.</span></h1>
          </div>
          <div className="card soft rise d3" style={{ ...col(14), padding: 28, alignSelf: "stretch" }}>
            <span className="eyebrow">What this round expects</span>
            {expectations.map((f, i) => (
              <label key={i} style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
                <input type="checkbox" /><span className="ink">{f.text}</span>
              </label>
            ))}
          </div>
          <div className="rise d4" style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
            <Button href={`${base}/call`} arrow>Warm-up call</Button>
            <span style={{ fontSize: 14 }}>Three quick questions, hands-free. Then go and do it.</span>
          </div>
        </section>
      </div>
    );

  // After the date, until an outcome other than Waiting is logged.
  if (days !== null && days < 0 && !settled)
    return (
      <div className="wrap" style={{ maxWidth: 960 }}>
        <TopBar active="jobs" roundId={round.id} />
        <section style={{ ...col(40), padding: "56px 0 96px" }}>
          <div style={col(12)}>
            {back}
            <p className="eyebrow rise">{fmtDate(today, { weekday: "long", day: "numeric", month: "short" })} · {job.company} · {round.name} was {inDays(days)}</p>
            <h1 className="serif rise d1" style={{ fontSize: "clamp(40px, 8vw, 68px)", lineHeight: 1.02 }}>How did it <span className="ital">go?</span></h1>
            <p className="rise d2">Two minutes now helps us learn which practice leads to offers.</p>
          </div>
          {checkIn}
        </section>
      </div>
    );

  const upcoming = days !== null && days > 0 && !outcome;
  const { data: plan } = upcoming
    ? await supabase.from("plan_days").select("*").eq("round_id", round.id).order("day")
    : { data: null };
  const planDays = plan ?? [];
  const skillName = (id: string | null) => skills.find((s) => s.id === id)?.name ?? "All skills";
  const task = planDays.find((d) => d.day === today);
  const taskSkill = skills.find((s) => s.id === task?.skill_id);
  const nextDay = planDays.find((d) => d.day > today);
  const begin = task?.tool === "single" ? `${base}/practice${task.skill_id ? `?skill=${task.skill_id}` : ""}` : task?.tool === "call" ? `${base}/call` : `${base}/interview`;
  const events = [
    ...planDays.filter((d) => d.day >= today).map((d) => ({
      day: d.day, minutes: d.minutes,
      title: `${job.company} practice: ${TOOL[d.tool as keyof typeof TOOL]}${d.tool === "full" ? "" : ` · ${skillName(d.skill_id)}`}`,
    })),
    ...(upcoming ? [{ day: round.date!, minutes: round.length_minutes ?? 60, title: `${job.company} interview: ${round.name}` }] : []),
  ];
  const dateForm = (label: string) => (
    <form action={setRoundDate.bind(null, job.id, round.id)} style={{ display: "flex", gap: 16, alignItems: "end", flexWrap: "wrap" }}>
      <div className="field"><label htmlFor="round-date">Interview date</label>
        <input className="inp" id="round-date" name="date" type="date" defaultValue={round.date ?? ""} min={today} style={{ width: 200 }} /></div>
      <Button variant="secondary" small type="submit">{label}</Button>
    </form>
  );

  return (
    <div className="wrap">
      <TopBar active="jobs" roundId={round.id} />

      <section style={{ padding: "48px 0 40px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 440px), 1fr))", gap: 48, alignItems: "end" }}>
        <div style={col(12)}>
          {back}
          <p className="eyebrow rise d1">
            {[`Round ${index + 1} of ${rounds.length}`, round.date ? fmtDate(round.date) : null, round.format, round.length_minutes ? `${round.length_minutes} min` : null].filter(Boolean).join(" · ")}
          </p>
          <h1 className="serif rise d2" style={h1}><AccentLast text={round.name} /></h1>
          <p className="rise d3">
            {round.interviewer_type ? `With ${round.interviewer_type}. ` : ""}
            {upcoming ? `${inDays(days!).replace(/^./, (c) => c.toUpperCase())}.` : outcome ? `${OUTCOME_LABEL[outcome]}.` : ""}
            {round.interviewer_notes ? ` About the interviewer: ${round.interviewer_notes}` : ""}
          </p>
        </div>
        <div className="card soft rise d3" style={{ ...col(14), padding: 28 }}>
          <span className="eyebrow">What this round expects</span>
          {expectations.map((f, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "baseline" }}><span className="olive" aria-hidden="true">—</span><span className="ink">{f.text}</span></div>
          ))}
          {asks.length > 0 && (
            <details>
              <summary className="tlink" style={{ fontSize: 14, display: "inline" }}>What is asked</summary>
              <div style={{ ...col(8), paddingTop: 12 }}>{asks.map((f, i) => <span key={i} className="ink" style={{ fontSize: 15 }}>{f.text}</span>)}</div>
            </details>
          )}
        </div>
      </section>

      {outcome ? (
        <section className="card rise d4" style={{ ...col(24), padding: 32 }}>
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ ...col(6), flex: "1 1 220px" }}>
              <span className="eyebrow">Outcome</span>
              <span className="serif" style={{ fontSize: 34, lineHeight: 1.1 }}>{OUTCOME_LABEL[outcome]}</span>
            </div>
            {snapshot && (
              <>
                <span><span className="serif num" style={{ fontSize: 32 }}>{snapshot.readiness}</span> <span style={{ fontSize: 13 }}>readiness then</span></span>
                <span><span className="serif num" style={{ fontSize: 32 }}>{snapshot.answers}</span> <span style={{ fontSize: 13 }}>practice answers</span></span>
              </>
            )}
          </div>
          {snapshot && snapshot.skills.length > 0 && (
            <p style={{ fontSize: 14 }}>Skill scores at the time: {snapshot.skills.map((s) => `${s.name} ${s.score}`).join(" · ")}</p>
          )}
          {(round.went_well || round.went_wrong) && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: 24 }}>
              {round.went_well && <div><span className="eyebrow">What went well</span><p className="ink">{round.went_well}</p></div>}
              {round.went_wrong && <div><span className="eyebrow">Where it went wrong</span><p className="ink">{round.went_wrong}</p></div>}
            </div>
          )}
          {round.asked_questions.length > 0 && (
            <div style={col(0)}>
              <span className="eyebrow" style={{ paddingBottom: 12 }}>Questions they actually asked</span>
              {round.asked_questions.map((q) => (
                <div key={q} className="turn" style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
                  <span className="ink">{q}</span>
                  <TextLink href={`${base}/practice?q=${encodeURIComponent(q)}`} style={{ fontSize: 14 }}>Practice this</TextLink>
                </div>
              ))}
            </div>
          )}
          <details>
            <summary className="tlink" style={{ fontSize: 14, display: "inline" }}>Edit outcome</summary>
            <div style={{ paddingTop: 28 }}>{checkIn}</div>
          </details>
        </section>
      ) : !round.date ? (
        <section className="card rise d4" style={{ ...col(20), padding: 32 }}>
          <div style={col(6)}>
            <span className="eyebrow">No plan yet</span>
            <span className="serif" style={{ fontSize: 34, lineHeight: 1.1 }}>When is this round?</span>
            <span style={{ fontSize: 14 }}>Add the date and we build a practice task for each day until then.</span>
          </div>
          {dateForm("Build my plan")}
        </section>
      ) : (
        <section className="card rise d4" style={{ ...col(28), padding: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
            <div style={col(6)}>
              <span className="eyebrow">Today · {fmtDate(today, { weekday: "long", day: "numeric", month: "short" })}</span>
              {task ? (
                <>
                  <span className="serif" style={{ fontSize: 34, lineHeight: 1.1 }}>
                    {TOOL[task.tool as keyof typeof TOOL]}{task.tool === "full" ? "" : ` · ${skillName(task.skill_id)}`} · {task.minutes} min
                  </span>
                  <span style={{ fontSize: 14 }}>
                    {task.done ? "Done for today."
                      : taskSkill && taskSkill.id === weakest?.id ? `Your weakest skill for this round, at ${taskSkill.score}.`
                      : task.tool === "full" ? "A full rehearsal of this round." : taskSkill?.reason ?? ""}
                  </span>
                </>
              ) : (
                <>
                  <span className="serif" style={{ fontSize: 34, lineHeight: 1.1 }}>No task today</span>
                  <span style={{ fontSize: 14 }}>{nextDay ? `Next practice: ${fmtDate(nextDay.day)}.` : "Practice any tool below."}</span>
                </>
              )}
            </div>
            {task && !task.done && <Button href={begin} arrow>Begin</Button>}
          </div>
          <div role="list" aria-label="Plan up to the interview" style={{ display: "grid", gridTemplateColumns: `repeat(${planDays.length + 1}, minmax(84px, 1fr))`, gap: 8, overflowX: "auto" }}>
            {planDays.map((d) => {
              const isToday = d.day === today;
              const weak = d.tool !== "full" && d.skill_id === weakest?.id;
              const label = d.tool === "full" ? "Full interview" : `${d.tool === "call" ? "Call" : "Single"} · ${skillName(d.skill_id)}`;
              return (
                <div key={d.id} role="listitem" className={`day${!isToday && weak ? " pill-gold" : ""}`}
                  style={{
                    padding: 12, display: "flex", flexDirection: "column", gap: 4, opacity: d.day < today && !d.done ? 0.5 : undefined,
                    border: `1px solid var(--${isToday ? "ink" : d.tool === "full" ? "olive" : weak ? "gold" : "hair"})`,
                    ...(isToday ? { background: "var(--ink)", color: "var(--paper)" } : {}),
                  }}>
                  <span className={isToday ? undefined : "eyebrow"} style={isToday ? { fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase" } : { fontSize: 11 }}>
                    {fmtDate(d.day, { weekday: "short", day: "numeric" })}{d.done ? " ✓" : ""}{d.done && <span className="sr"> done</span>}
                  </span>
                  <span className={isToday ? undefined : d.tool === "full" ? "olive" : "ink"} style={{ fontSize: 13, lineHeight: 1.4, fontWeight: d.tool === "full" ? 400 : undefined }}>{label}</span>
                </div>
              );
            })}
            <div role="listitem" className="day" style={{ border: "1px solid var(--garnet)", padding: 12, display: "flex", flexDirection: "column", gap: 4 }}>
              <span className="eyebrow garnet" style={{ fontSize: 11 }}>{fmtDate(round.date, { weekday: "short", day: "numeric" })}</span>
              <span className="garnet" style={{ fontSize: 13, lineHeight: 1.4, fontWeight: 400 }}>Interview</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap", fontSize: 14 }}>
            <span><span aria-hidden="true" style={{ display: "inline-block", width: 10, height: 10, background: "var(--gold)", marginRight: 6 }} />Weak-spot days</span>
            <span style={{ flex: 1 }} />
            <Calendar events={events} path={base} fileName={`${job.company}-${round.name}`.replace(/[^\w-]+/g, "-").toLowerCase() + ".ics"} />
          </div>
          <details>
            <summary className="tlink" style={{ fontSize: 14, display: "inline" }}>Change the date</summary>
            <div style={{ paddingTop: 16 }}>{dateForm("Rebuild my plan")}</div>
          </details>
        </section>
      )}

      <section style={{ ...col(22), padding: "64px 0 48px" }}>
        <span className="eyebrow rise d5">Prepare for this round</span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 14 }}>
          <ToolTile n="i." name="Full interview" text="15, 30 or 45 minutes, spoken, with follow-ups." go="Start" href={`${base}/interview`} delay={5} />
          <ToolTile n="ii." name="Call" text="Three quick questions, hands-free." go="Call" href={`${base}/call`} delay={6} />
          <ToolTile n="iii." name="Feedback" go="Open" href={`${base}/scorecard`} delay={6}
            text={`${isEarlyEstimate(scoredCount) ? "Early estimate" : "Readiness"} ${readiness}${weakest ? ` · weakest: ${weakest.name.toLowerCase()}` : ""}.`} />
          <ToolTile n="iv." name="Single questions" text="Practice one answer. Scored." go="Practice" href={`${base}/practice`} delay={7} />
          <ToolTile n="v." name="Chat" text="Ask anything about this round." go="Ask" href={`/chat?job=${job.id}&round=${round.id}`} delay={7} />
        </div>
      </section>

      <section style={{ ...col(16), paddingBottom: 96, alignItems: "flex-start" }}>
        {!outcome && (
          <details style={{ alignSelf: "stretch" }}>
            <summary className="tlink" style={{ fontSize: 14, display: "inline" }}>Already had this round? Log the outcome</summary>
            <div style={{ paddingTop: 28 }}>{checkIn}</div>
          </details>
        )}
        <Link className="tlink" href={`/jobs/${job.id}`} style={{ fontSize: 14 }}>Edit the brief for this round</Link>
      </section>
    </div>
  );
}
