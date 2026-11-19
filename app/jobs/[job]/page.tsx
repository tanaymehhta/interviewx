import Link from "next/link";
import { CountUp } from "@/components/CountUp";
import { TopBar } from "@/components/TopBar";
import { Bar, fmtDate, TextLink } from "@/components/ui";
import { AccentLast, OUTCOME_LABEL, STATUS_LABEL } from "@/components/jobs/bits";
import { daysBetween, isEarlyEstimate, weakestSkill } from "@/lib/coach";
import { localNow, requireJob } from "@/lib/server";
import { BriefCard } from "./BriefCard";

export default async function Page({ params }: { params: Promise<{ job: string }> }) {
  const { job: jobId } = await params;
  const { job, rounds, skills, round: active, readiness, scoredCount } = await requireJob(jobId);
  const { today } = await localNow();
  const open = job.status === "preparing";
  const days = open && active?.date ? daysBetween(today, active.date) : null;
  const weakest = weakestSkill(skills);

  return (
    <div className="wrap">
      <TopBar active="jobs" roundId={active?.id} />

      <section style={{ padding: "56px 0 48px", display: "flex", justifyContent: "space-between", gap: 32, flexWrap: "wrap", alignItems: "end" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <TextLink href="/jobs" style={{ alignSelf: "flex-start", fontSize: 14 }}>← My Jobs</TextLink>
          <p className="eyebrow rise d1">
            {job.company} · added {fmtDate(job.created_at, { day: "numeric", month: "short" })}{open ? "" : ` · ${STATUS_LABEL[job.status]}`}
          </p>
          <h1 className="serif rise d2" style={{ fontSize: "clamp(44px, 9vw, 72px)", lineHeight: 1 }}><AccentLast text={job.role} /></h1>
        </div>
        {active && (
          <div className="rise d3" style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
            <div>
              <span className="serif num" style={{ fontSize: 64, lineHeight: 1 }}><CountUp to={readiness} /></span>
              <p style={{ fontSize: 13 }}>{isEarlyEstimate(scoredCount) ? "early estimate" : "readiness"}, {active.name.toLowerCase()}</p>
            </div>
            {days !== null && days >= 0 && (
              <div><span className="serif num" style={{ fontSize: 64, lineHeight: 1 }}>{days}</span><p style={{ fontSize: 13 }}>{days === 1 ? "day" : "days"} to go</p></div>
            )}
          </div>
        )}
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <span className="eyebrow rise d3">Rounds · choose one to prepare</span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: 16 }}>
          {rounds.map((r, i) => {
            const next = open && r.id === active?.id;
            const then = (r.snapshot as { readiness?: number } | null)?.readiness;
            return (
              <Link key={r.id} className={`card lift rise d${Math.min(i + 3, 8)}`} href={`/jobs/${job.id}/${r.id}`} aria-current={next ? "true" : undefined}
                style={{ padding: 28, display: "flex", flexDirection: "column", gap: 18, textDecoration: "none", color: "var(--stone)", ...(next ? { borderColor: "var(--ink)", background: "var(--ivory)" } : {}) }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="serif ital" style={{ fontSize: 20 }}>{i + 1}</span>
                  {r.outcome && r.outcome !== "waiting"
                    ? <span className="tag" style={r.outcome === "advanced" || r.outcome === "offer" ? { borderColor: "var(--olive)", color: "var(--olive)" } : { borderColor: "var(--garnet)", color: "var(--garnet)" }}>{OUTCOME_LABEL[r.outcome]}</span>
                    : next
                      ? <span style={{ display: "inline-flex", gap: 8, alignItems: "center", fontSize: 13, color: "var(--ink)", fontWeight: 400 }}><span className="dot live" /> {r.outcome === "waiting" ? "Waiting to hear" : "Up next"}</span>
                      : <span style={{ fontSize: 13 }}>Upcoming</span>}
                </div>
                <span className="serif" style={{ fontSize: 30 }}>{r.name}</span>
                <span style={{ fontSize: 14 }}>
                  {[r.date ? fmtDate(r.date) : "No date yet", r.format, r.length_minutes ? `${r.length_minutes} min` : null].filter(Boolean).join(" · ")}
                </span>
                {then !== undefined
                  ? <span style={{ fontSize: 14 }}>Readiness then <span className="ink num" style={{ fontWeight: 400 }}>{then}</span></span>
                  : next && <span className="ink" style={{ fontSize: 15, fontWeight: 400 }}>Open preparation →</span>}
              </Link>
            );
          })}
        </div>
      </section>

      <section style={{ padding: "72px 0 96px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 460px), 1fr))", gap: 20 }}>
        <div className="card rise d5" style={{ padding: 32, display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
            <h2 className="serif" style={{ fontSize: 32 }}>Skills for this job</h2>
            {active && <TextLink href={`/jobs/${job.id}/${active.id}/scorecard`} style={{ fontSize: 14 }}>Scorecard</TextLink>}
          </div>
          {skills.map((s, i) => (
            <div key={s.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span className="ink">{s.name}{s.id === weakest?.id && skills.length > 1 && <span className="garnet" style={{ fontSize: 13 }}> · weakest</span>}</span>
                <span className="num ink">{s.score}</span>
              </div>
              <Bar value={s.score} garnet={s.id === weakest?.id && skills.length > 1} delay={i * 120} />
            </div>
          ))}
          {!skills.length && <p>No skills were found for this job.</p>}
        </div>
        <BriefCard jobId={job.id} company={job.company} brief={job.brief}
          rounds={rounds.map((r) => ({ id: r.id, name: r.name, asks: r.asks, expects: r.expects }))} />
      </section>
    </div>
  );
}
