import Link from "next/link";
import { daysBetween, isEarlyEstimate, overallSkills, roundReadiness, type SubScores } from "@/lib/coach";
import { localNow, requireJob } from "@/lib/server";
import { TopBar } from "@/components/TopBar";
import { CountUp } from "@/components/CountUp";
import { Accent, Bar, Button, Eyebrow, Sparkline, TextLink, fmtDate } from "@/components/ui";
import { TOOL_LABEL } from "@/components/scorecard/shared";

export const metadata = { title: "Scorecard" };

const CSS = `
.log table{border-collapse:collapse;width:100%;min-width:640px}
.log th{text-align:left;font-weight:400;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--stone);padding:12px 10px;border-bottom:1px solid var(--ink)}
.log td{padding:16px 10px;border-bottom:1px solid var(--hair);font-size:15px}
.log tbody tr{transition:background-color 150ms ease-out}
.log tbody tr:hover{background:var(--ivory)}
.log td a{text-decoration:none}
`;

const OVERALL = [["Structure", "structure"], ["Relevance", "relevance"], ["Quantified impact", "impact"], ["Delivery", "delivery"]] as const;
const FILTERS = [["all", "All"], ["full", TOOL_LABEL.full], ["call", TOOL_LABEL.call], ["single", TOOL_LABEL.single]] as const;
const SHORT: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
const daysAgo = (n: number) => Date.now() - n * 86_400_000;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const tile = { background: "var(--paper)", padding: 26 };

export default async function Page({ params, searchParams }: {
  params: Promise<{ job: string; round: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { job: jobId, round: roundId } = await params;
  const sp = await searchParams;
  const { supabase, job, rounds, skills, roundSkills, readiness, weakest, scoredCount, ...ctx } = await requireJob(jobId, roundId);
  const round = ctx.round!;
  const base = `/jobs/${job.id}/${round.id}`;
  const filter = FILTERS.find(([id]) => id === sp.tool)?.[0] ?? "all";
  const { today } = await localNow();

  const [{ data: recent }, { data: jobAnswers }, { data: jobSessions }, { data: scoreRows }] = await Promise.all([
    supabase.from("answers").select("structure, relevance, impact, delivery").not("overall", "is", null)
      .order("created_at", { ascending: false }).limit(10),
    supabase.from("answers").select("id, created_at, question, skill_id, overall, session_id, seconds").eq("job_id", job.id)
      .order("created_at", { ascending: false }),
    supabase.from("sessions").select("id, tool, round_id").eq("job_id", job.id),
    supabase.from("skill_scores").select("skill_id, score, created_at").in("skill_id", skills.map((s) => s.id)).order("created_at"),
  ]);
  const overall = overallSkills((recent ?? []) as SubScores[]);
  const answers = jobAnswers ?? [];
  const sessions = new Map((jobSessions ?? []).map((s) => [s.id, s]));
  const history = scoreRows ?? [];
  const scoresOf = (skillId: string) => history.filter((h) => h.skill_id === skillId);
  const skillName = (id: string | null) => skills.find((s) => s.id === id)?.name ?? "";

  // Last 7 days, for this job.
  const since = daysAgo(7);
  const week = answers.filter((a) => Date.parse(a.created_at) >= since);
  const minutes = Math.ceil(week.reduce((sum, a) => sum + (a.seconds ?? 0), 0) / 60);
  const improved = skills
    .map((s) => {
      const rows = scoresOf(s.id);
      const inWeek = rows.filter((h) => Date.parse(h.created_at) >= since);
      const from = rows[rows.length - inWeek.length - 1]?.score ?? 50;
      return { name: s.name, from, to: inWeek.at(-1)?.score ?? from };
    })
    .sort((a, b) => b.to - b.from - (a.to - a.from))[0];

  // Readiness before the latest scored answer, when that answer was on a skill this round tests.
  const last = history.at(-1);
  const before = last && roundSkills.some((s) => s.id === last.skill_id)
    ? roundReadiness(roundSkills.map((s) => (s.id === last.skill_id ? scoresOf(s.id).at(-2)?.score ?? 50 : s.score)))
    : readiness;

  const readinessOf = (r: (typeof rounds)[number]) => {
    const tested = skills.filter((s) => r.skill_ids.includes(s.id));
    return roundReadiness((tested.length ? tested : skills).map((s) => s.score));
  };
  const statusOf = (r: (typeof rounds)[number]) => {
    if (r.outcome && r.outcome !== "waiting") return cap(r.outcome);
    if (!r.date) return "";
    const d = daysBetween(today, r.date);
    return d < 0 ? fmtDate(r.date, SHORT) : d === 0 ? "today" : d === 1 ? "tomorrow" : `in ${d} days`;
  };

  const rows = answers.filter((a) => a.overall !== null && (filter === "all" || sessions.get(a.session_id)?.tool === filter));

  return (
    <div className="wrap">
      <style>{CSS}</style>
      <TopBar active="jobs" roundId={round.id} />
      <section style={{ padding: "48px 0 40px", display: "flex", flexDirection: "column", gap: 12 }}>
        <TextLink href={base} style={{ alignSelf: "flex-start", fontSize: 14 }}>← {round.name}</TextLink>
        <h1 className="serif rise d1" style={{ fontSize: "clamp(44px, 10vw, 68px)", lineHeight: 1.02 }}>Your <Accent>scorecard</Accent></h1>
      </section>

      {scoredCount === 0 ? (
        <section className="card soft rise d2" style={{ padding: "clamp(24px, 5vw, 44px)", display: "flex", flexDirection: "column", gap: 14, alignItems: "flex-start" }}>
          <Eyebrow>Nothing scored yet</Eyebrow>
          <h2 className="serif" style={{ fontSize: 36, lineHeight: 1.15 }}>Answer one question to start your scorecard.</h2>
          <p>Every answer you give for {job.company} is scored. Your skills, your readiness for the {round.name}, and your trend appear here after the first one.</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", paddingTop: 8 }}>
            <Button href={`${base}/practice`} arrow>Practice one question</Button>
            <Button href={`${base}/interview`} variant="secondary">Full interview</Button>
          </div>
        </section>
      ) : (
        <section className="rise d2" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 1, background: "var(--hair)", border: "1px solid var(--hair)" }}>
          <div style={tile}>
            <Eyebrow>Last 7 days</Eyebrow>
            <p className="serif num" style={{ fontSize: 48, lineHeight: 1.1 }}>{new Set(week.map((a) => a.session_id)).size}</p>
            <p style={{ fontSize: 14 }}>practice sessions</p>
          </div>
          <div style={tile}>
            <Eyebrow>Time</Eyebrow>
            <p className="serif num" style={{ fontSize: 48, lineHeight: 1.1 }}>{minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`}</p>
            <p style={{ fontSize: 14 }}>spent answering out loud</p>
          </div>
          <div style={tile}>
            <Eyebrow>Most improved</Eyebrow>
            {improved && improved.to > improved.from ? (
              <>
                <p className="serif" style={{ fontSize: 30, lineHeight: 1.35 }}>{improved.name} <span className="olive num">+{improved.to - improved.from}</span></p>
                <p style={{ fontSize: 14 }}>from {improved.from} to {improved.to}</p>
              </>
            ) : (
              <>
                <p className="serif" style={{ fontSize: 30, lineHeight: 1.35 }}>None yet</p>
                <p style={{ fontSize: 14 }}>no skill rose in the last 7 days</p>
              </>
            )}
          </div>
          {weakest && (
            <div style={{ ...tile, background: "var(--gold-soft)" }}>
              <Eyebrow>Work on next</Eyebrow>
              <p className="serif" style={{ fontSize: 30, lineHeight: 1.35 }}>{weakest.name}</p>
              <p style={{ fontSize: 14 }}>
                lowest for the {round.name}, at {weakest.score} · {weakest.last_practiced_at ? `last practiced ${fmtDate(weakest.last_practiced_at, SHORT)}` : "not practiced yet"}
              </p>
            </div>
          )}
        </section>
      )}

      <section style={{ padding: "64px 0 0", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 460px), 1fr))", gap: 48 }}>
        {overall && (
          <div className="rise d3" style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div><h2 className="serif" style={{ fontSize: 36 }}>Across every job</h2><p style={{ fontSize: 14 }}>Average of your last 10 scored answers.</p></div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 28 }}>
              {OVERALL.map(([label, key], i) => (
                <div key={key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 14 }}>{label}</span>
                  <span className={`serif num${overall[key] < 50 ? " garnet" : ""}`} style={{ fontSize: 56, lineHeight: 1 }}>{overall[key]}</span>
                  <Bar value={overall[key]} garnet={overall[key] < 50} delay={i * 100} />
                </div>
              ))}
            </div>
          </div>
        )}
        {scoredCount > 0 && (
          <div className="rise d4" style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div><h2 className="serif" style={{ fontSize: 36 }}>{job.company} skills</h2><p style={{ fontSize: 14 }}>Since you added the job on {fmtDate(job.created_at, SHORT)}.</p></div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {skills.map((s) => {
                const weak = s.id === weakest?.id;
                return (
                  <div key={s.id} className="turn" style={{ display: "flex", alignItems: "center", gap: 18, ...(weak && { background: "var(--gold-soft)", paddingLeft: 12, paddingRight: 12 }) }}>
                    <span className="ink" style={{ flex: 1, minWidth: 0 }}>{s.name}{weak && <span className="garnet" style={{ fontSize: 13 }}> · weakest</span>}</span>
                    <Sparkline points={[50, ...scoresOf(s.id).map((h) => h.score)]} width={96} />
                    <span className="serif num" style={{ fontSize: 30, width: 48, textAlign: "right" }}>{s.score}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 130px), 1fr))", gap: 12 }}>
              {rounds.map((r) => {
                const on = r.id === round.id;
                return (
                  <Link key={r.id} href={`/jobs/${job.id}/${r.id}/scorecard`} className="card" aria-current={on ? "true" : undefined}
                    style={{ padding: 16, textDecoration: "none", color: "var(--stone)", borderColor: on ? "var(--ink)" : undefined }}>
                    <p style={{ fontSize: 12 }}>{r.name} readiness</p>
                    <p className="serif num" style={{ fontSize: 30 }}>
                      {on && before !== readiness ? <>{before} → <CountUp from={before} to={readiness} /></> : readinessOf(r)}
                    </p>
                    <p style={{ fontSize: 12 }} className={r.outcome === "advanced" ? "olive" : undefined}>
                      {[statusOf(r), on && isEarlyEstimate(scoredCount) && "Early estimate"].filter(Boolean).join(" · ")}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {scoredCount > 0 && (
        <section className="rise d5 log" style={{ padding: "72px 0 96px", display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 16, flexWrap: "wrap" }}>
            <h2 className="serif" id="log" style={{ fontSize: 36 }}>Every scored answer</h2>
            <nav style={{ display: "flex", gap: 8, flexWrap: "wrap" }} aria-label="Filter by tool">
              {FILTERS.map(([id, label]) => (
                <Link key={id} className={`choice${id === filter ? " on" : ""}`} aria-current={id === filter ? "true" : undefined}
                  href={`${base}/scorecard${id === "all" ? "" : `?tool=${id}`}#log`} style={{ textDecoration: "none" }}>{label}</Link>
              ))}
            </nav>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table aria-labelledby="log">
              <thead><tr><th>Date</th><th>Tool</th><th>Question</th><th>Skill</th><th style={{ textAlign: "right" }}>Score</th></tr></thead>
              <tbody>
                {rows.map((a) => {
                  const s = sessions.get(a.session_id);
                  const href = s?.tool === "full" ? `/jobs/${job.id}/${s.round_id}/interview/${s.id}` : `${base}/scorecard/${a.id}`;
                  return (
                    <tr key={a.id}>
                      <td className="num" style={{ whiteSpace: "nowrap" }}>{fmtDate(a.created_at, SHORT)}</td>
                      <td style={{ whiteSpace: "nowrap" }}>{TOOL_LABEL[s?.tool ?? ""] ?? ""}</td>
                      <td><Link className="ink" href={href}>{a.question}</Link></td>
                      <td>{skillName(a.skill_id)}</td>
                      <td className="serif num ink" style={{ textAlign: "right", fontSize: 22 }}>{Number(a.overall).toFixed(1)}</td>
                    </tr>
                  );
                })}
                {rows.length === 0 && <tr><td colSpan={5}>No scored answers from this tool yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {scoredCount === 0 && <div style={{ height: 96 }} />}
    </div>
  );
}
