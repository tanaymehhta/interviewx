import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { Bar, Button, fmtDate } from "@/components/ui";
import { inDays, OUTCOME_LABEL, STATUS_LABEL } from "@/components/jobs/bits";
import { activeRound, daysBetween, isEarlyEstimate, roundReadiness } from "@/lib/coach";
import { localNow, requireProfile } from "@/lib/server";

export const metadata = { title: "My Jobs · InterviewX" };

const cardStyle = { padding: 36, display: "flex", flexDirection: "column", gap: 28, textDecoration: "none", color: "var(--stone)" } as const;

export default async function Page() {
  const { supabase, profile } = await requireProfile();
  const { today, hour } = await localNow();
  // ponytail: one row per scored answer just to count them per job; use a grouped count (view or rpc) if this grows.
  const [{ data: jobs }, { data: rounds }, { data: skills }, { data: scored }] = await Promise.all([
    supabase.from("jobs").select("*").order("created_at"),
    supabase.from("rounds").select("*").order("position"),
    supabase.from("skills").select("id, job_id, score"),
    supabase.from("answers").select("job_id").not("overall", "is", null),
  ]);

  const rows = (jobs ?? []).map((job) => {
    const rs = (rounds ?? []).filter((r) => r.job_id === job.id);
    const round = activeRound(rs);
    const all = (skills ?? []).filter((s) => s.job_id === job.id);
    const tested = round ? all.filter((s) => round.skill_ids.includes(s.id)) : [];
    return {
      job, rs, round,
      readiness: roundReadiness((tested.length ? tested : all).map((s) => s.score)),
      early: isEarlyEstimate((scored ?? []).filter((a) => a.job_id === job.id).length),
    };
  });
  const open = rows.filter((r) => r.job.status === "preparing")
    .sort((a, b) => (a.round?.date ?? "9999").localeCompare(b.round?.date ?? "9999"));
  const past = rows.filter((r) => r.job.status !== "preparing");
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const first = profile.name?.trim().split(/\s+/)[0];

  return (
    <div className="wrap">
      <TopBar active="jobs" />

      <section style={{ padding: "64px 0 40px", display: "flex", justifyContent: "space-between", alignItems: "end", gap: 24, flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p className="eyebrow rise d1">{fmtDate(today, { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1 className="serif rise d2" style={{ fontSize: "clamp(40px, 8vw, 64px)", lineHeight: 1.02 }}>
            {greeting}{first ? <>, <span className="ital">{first}.</span></> : "."}
          </h1>
        </div>
        {open.length > 0 && <Button href="/jobs/new" className="rise d3">+ Add a job</Button>}
      </section>

      {rows.length === 0 ? (
        <section className="rise d3" style={{ padding: 36, marginBottom: 96, border: "1px dashed var(--ink)", display: "flex", flexDirection: "column", gap: 20 }}>
          <span className="serif" style={{ fontSize: 32 }}>Add a job</span>
          <span style={{ fontSize: 15 }}>We will find the rounds, what each one asks, and what the company wants.</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link className="choice" href="/jobs/new?mode=link">Paste a link</Link>
            <Link className="choice" href="/jobs/new?mode=pick">Company and role</Link>
            <Link className="choice" href="/jobs/new?mode=text">Paste the posting text</Link>
          </div>
        </section>
      ) : (
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 480px), 1fr))", gap: 20 }}>
          {open.map(({ job, rs, round, readiness, early }, i) => {
            const days = round?.date ? daysBetween(today, round.date) : null;
            const isToday = days === 0 && !round?.outcome;
            const checkIn = days !== null && days < 0 && !round?.outcome;
            return (
              <Link key={job.id} className={`card lift rise d${Math.min(i + 3, 8)}`} style={cardStyle}
                href={round && (isToday || checkIn) ? `/jobs/${job.id}/${round.id}` : `/jobs/${job.id}`}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span className="eyebrow">{job.company}</span>
                    <span className="serif" style={{ fontSize: 36, lineHeight: 1.1 }}>{job.role}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span className="serif num" style={{ fontSize: 56, lineHeight: 1 }}>{readiness}</span>
                    <p style={{ fontSize: 12 }}>{early ? "early estimate" : "readiness"}</p>
                  </div>
                </div>
                <Bar value={readiness} />
                {round && isToday && <span className="serif" style={{ fontSize: 26, lineHeight: 1.1 }}>Today is your <span className="ital">{round.name}.</span></span>}
                {round && checkIn && (
                  <span className="ink" style={{ padding: "12px 16px", background: "var(--gold-soft)", fontWeight: 400 }}>
                    How did it go? Tell us about your {round.name} →
                  </span>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", fontSize: 14 }}>
                  {round ? (
                    <span>
                      <span className="ink" style={{ fontWeight: 400 }}>{round.name}</span>
                      {round.date ? ` · ${fmtDate(round.date)} · ${inDays(days!)}` : " · no date yet"}
                      {round.outcome === "waiting" && " · waiting to hear"}
                    </span>
                  ) : <span>No rounds yet</span>}
                  <span>{round ? `Round ${rs.indexOf(round) + 1} of ${rs.length} · ` : ""}{STATUS_LABEL[job.status]}</span>
                </div>
                <div style={{ display: "flex", gap: 6 }} role="img"
                  aria-label={`Rounds: ${rs.filter((r) => r.outcome === "advanced").length} advanced of ${rs.length}`}>
                  {rs.map((r) => (
                    <span key={r.id} style={{ flex: 1, height: 6, background: r.outcome === "advanced" ? "var(--olive)" : r.id === round?.id ? "var(--gold)" : "var(--hair)" }} />
                  ))}
                </div>
              </Link>
            );
          })}
          <Link className="lift rise d5" href="/jobs/new"
            style={{ padding: 36, display: "flex", flexDirection: "column", justifyContent: "center", gap: 10, minHeight: open.length ? 260 : 160, border: "1px dashed var(--ink)", textDecoration: "none", color: "var(--stone)" }}>
            <span className="serif" style={{ fontSize: 32 }}>{open.length ? "Add another job" : "Add a job"}</span>
            <span style={{ fontSize: 15 }}>Paste a job link, or pick a company and role.</span>
          </Link>
        </section>
      )}

      {past.length > 0 && (
        <section className="rise d6" style={{ padding: "80px 0 96px", display: "flex", flexDirection: "column" }}>
          <span className="eyebrow" style={{ paddingBottom: 14 }}>Past jobs</span>
          {past.map(({ job, rs, round }) => {
            const last = rs.findLast((r) => r.outcome && r.outcome !== "advanced" && r.outcome !== "waiting") ?? round;
            const then = (last?.snapshot as { readiness?: number } | null)?.readiness;
            const outcome = last?.outcome ? OUTCOME_LABEL[last.outcome] : STATUS_LABEL[job.status];
            return (
              <Link key={job.id} className="turn" href={`/jobs/${job.id}`}
                style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "baseline", textDecoration: "none", color: "var(--stone)" }}>
                <span><span className="serif" style={{ fontSize: 24 }}>{job.company}</span> <span style={{ fontSize: 14 }}>· {job.role}</span></span>
                <span style={{ fontSize: 14 }}>
                  {last ? `${last.name} · ` : ""}{last?.date ? `${fmtDate(last.date, { day: "numeric", month: "short" })} · ` : ""}
                  <span className={job.status === "offer" ? "olive" : "garnet"} style={{ fontWeight: 400 }}>{outcome}</span>
                  {then !== undefined && ` · readiness then ${then}`}
                </span>
              </Link>
            );
          })}
        </section>
      )}
      {past.length === 0 && <div style={{ height: 96 }} />}
    </div>
  );
}
