"use client";
import { useRef, useState, useTransition } from "react";
import { Button, SourceTag, Steps, TextLink } from "@/components/ui";
import { FactRows, roundMeta } from "@/components/jobs/bits";
import { RESEARCH_STEPS, useResearch } from "@/components/jobs/useResearch";
import { LIMITS, type Brief, type BriefRound } from "@/lib/schemas";
import { createJob } from "./actions";

type Mode = "link" | "pick" | "text";
type DraftRound = BriefRound & { key: number; date: string; notes: string; done: boolean };
const COUNT = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
const col = (gap: number) => ({ display: "flex", flexDirection: "column", gap }) as const;

export function AddJob({ initialMode }: { initialMode: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [link, setLink] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [text, setText] = useState("");
  const [problem, setProblem] = useState("");
  const [runs, setRuns] = useState(0);
  const r = useResearch();

  const url = /^https?:\/\/\S+$/i.test(link.trim()) ? link.trim() : null;
  const start = (as: Mode = mode) => {
    const mode = as;
    setMode(as);
    setProblem("");
    if (mode === "link" && !url) return setProblem("Paste the full link, starting with https://");
    if (mode === "pick" && !(company.trim() && role.trim())) return setProblem("Enter the company and the role title.");
    if (mode === "text" && !text.trim()) return setProblem("Paste the posting text.");
    if (mode === "text" && text.length > LIMITS.posting) return setProblem(`The posting text is too long. Keep it under ${LIMITS.posting.toLocaleString("en")} characters.`);
    setRuns((n) => n + 1);
    r.run(mode === "pick" ? { company, role } : mode === "text" ? { postingText: text, ...(url ? { url } : {}) } : { url });
  };

  if (r.status === "done" && r.brief)
    return <BriefForm key={runs} brief={r.brief} partial={!!r.partial} sourceUrl={mode === "pick" ? null : url}
      postingText={mode === "text" ? text : null} onRerun={() => start()} />;

  if (r.status === "busy")
    return (
      <section style={{ ...col(44), padding: "72px 0 96px", maxWidth: 912, margin: "0 auto" }}>
        <div style={col(14)}>
          <p className="eyebrow rise">{mode === "pick" ? `${company} · ${role}` : "Your job"}</p>
          <h1 className="serif rise d1" style={{ fontSize: "clamp(40px, 8vw, 64px)", lineHeight: 1.02 }}>Researching the <span className="ital">rounds.</span></h1>
        </div>
        <div className="prog rise d2"><i /></div>
        <div style={{ fontSize: 18 }}><Steps steps={RESEARCH_STEPS} current={r.step} /></div>
        <div className="rise d4" style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 14 }}>Takes about a minute. We stop at 90 seconds and show what we have.</span>
          <TextLink onClick={r.reset}>Cancel</TextLink>
        </div>
      </section>
    );

  const needsText = r.status === "needs_text";
  const shown: Mode = needsText ? "text" : mode;
  const tab = (m: Mode, label: string) => (
    <button className={`choice${shown === m ? " on" : ""}`} type="button" role="tab" aria-selected={shown === m}
      onClick={() => { setMode(m); setProblem(""); if (r.status !== "idle") r.reset(); }}>{label}</button>
  );
  return (
    <section style={{ ...col(40), padding: "72px 0 96px", maxWidth: 912, margin: "0 auto" }}>
      <div style={col(14)}>
        <TextLink href="/jobs" style={{ alignSelf: "flex-start", fontSize: 14 }}>← My Jobs</TextLink>
        <h1 className="serif rise d1" style={{ fontSize: "clamp(40px, 8vw, 64px)", lineHeight: 1.02 }}>Which job are you <span className="ital">preparing</span> for?</h1>
        <p className="rise d2">Give us a link or a name. We will find the rounds, what each one asks, and what the company wants.</p>
      </div>
      <div className="rise d3" role="tablist" aria-label="How to add the job" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {tab("link", "Paste a link")}{tab("pick", "Company and role")}{tab("text", "Paste the posting text")}
      </div>
      {needsText && (
        <p className="ink" role="alert" style={{ padding: "16px 20px", background: "var(--gold-soft)", fontWeight: 400 }}>
          We could not read that page. It may need a login. Paste the posting text below. We keep your link for reference.
        </p>
      )}
      {shown === "link" && (
        <div className="field fade"><label htmlFor="aj-link">Job posting link</label>
          <input className="inp" id="aj-link" type="url" inputMode="url" value={link} onChange={(e) => setLink(e.target.value)}
            placeholder="https://careers.salesforce.com/en/jobs/…" style={{ fontSize: 20 }} /></div>
      )}
      {shown === "pick" && (
        <div className="fade" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: 32 }}>
          <div className="field"><label htmlFor="aj-co">Company</label>
            <input className="inp" id="aj-co" value={company} maxLength={120} onChange={(e) => setCompany(e.target.value)} placeholder="Salesforce" style={{ fontSize: 20 }} /></div>
          <div className="field"><label htmlFor="aj-role">Role title</label>
            <input className="inp" id="aj-role" value={role} maxLength={120} onChange={(e) => setRole(e.target.value)} placeholder="Sales Manager" style={{ fontSize: 20 }} /></div>
        </div>
      )}
      {shown === "text" && (
        <div className="field fade"><label htmlFor="aj-text">Posting text</label>
          <textarea className="inp" id="aj-text" rows={7} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste the full job description here." />
          {url && <span style={{ fontSize: 13, overflowWrap: "anywhere" }}>Link kept for reference: {url}</span>}</div>
      )}
      {(problem || r.status === "error") && <p className="err" role="alert">{problem || r.error}</p>}
      <div className="rise d4" style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
        <Button arrow onClick={() => start(shown)}>{r.status === "error" ? "Try again" : "Research this job"}</Button>
        <span style={{ fontSize: 14 }}>Takes about a minute.</span>
      </div>
    </section>
  );
}

function BriefForm({ brief, partial, sourceUrl, postingText, onRerun }: {
  brief: Brief; partial: boolean; sourceUrl: string | null; postingText: string | null; onRerun: () => void;
}) {
  const nextKey = useRef(brief.rounds.length);
  const [company, setCompany] = useState(brief.company);
  const [role, setRole] = useState(brief.role);
  const [useSuggested, setUseSuggested] = useState(false);
  const [rounds, setRounds] = useState<DraftRound[]>(() => brief.rounds.map((r, key) => ({ ...r, key, date: "", notes: "", done: false })));
  const [error, setError] = useState("");
  const [saving, startSaving] = useTransition();

  const patch = (key: number, p: Partial<DraftRound>) => setRounds((rs) => rs.map((r) => (r.key === key ? { ...r, ...p } : r)));
  const move = (i: number, by: -1 | 1) => setRounds((rs) => {
    const out = [...rs];
    [out[i], out[i + by]] = [out[i + by], out[i]];
    return out;
  });
  const add = () => setRounds((rs) => [...rs, {
    key: nextKey.current++, name: "New round", format: "video", length_minutes: 45, interviewer_type: "",
    asks: [], expects: [], skills: [], source: "general", date: "", notes: "", done: false,
  }]);
  const save = () => {
    setError("");
    startSaving(async () => {
      const res = await createJob({
        company, role, sourceUrl: sourceUrl ?? (useSuggested ? brief.suggested_posting_url : null), postingText,
        summary: brief.summary, company_wants: brief.company_wants, missing: brief.missing, skills: brief.skills,
        rounds: rounds.map((r) => ({ ...r, date: r.date || null })), // the action's schema drops `key`
      });
      if (res?.error) setError(res.error);
    });
  };
  const unverified = rounds.some((r) => r.source === "general");

  return (
    <>
      <section style={{ ...col(18), padding: "64px 0 40px" }}>
        <p className="eyebrow rise">Research brief · check before we build</p>
        {brief.company && brief.role ? (
          <h1 className="serif rise d1" style={{ fontSize: "clamp(40px, 8vw, 64px)", lineHeight: 1.02 }}>{brief.company} · <span className="ital">{brief.role}</span></h1>
        ) : (
          <div className="rise d1" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: 32 }}>
            <div className="field"><label htmlFor="bf-co">Company</label><input className="inp" id="bf-co" value={company} maxLength={120} onChange={(e) => setCompany(e.target.value)} style={{ fontSize: 20 }} /></div>
            <div className="field"><label htmlFor="bf-role">Role title</label><input className="inp" id="bf-role" value={role} maxLength={120} onChange={(e) => setRole(e.target.value)} style={{ fontSize: 20 }} /></div>
          </div>
        )}
        {brief.summary && <p className="rise d2" style={{ maxWidth: 720 }}>{brief.summary}</p>}
        <div className="rise d2" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", fontSize: 14 }}>
          <span>Every fact shows where it came from:</span>
          <SourceTag fact={{ source: "job_post", url: null }} /><SourceTag fact={{ source: "web", url: null }} />
          <SourceTag fact={{ source: "resume", url: null }} /><SourceTag fact={{ source: "general", url: null }} />
        </div>
        {partial && (
          <div role="status" style={{ padding: "16px 20px", background: "var(--gold-soft)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <span className="ink" style={{ fontWeight: 400 }}>Research did not finish. Missing: {brief.missing.join(", ")}.</span>
            <TextLink onClick={onRerun}>Retry</TextLink>
          </div>
        )}
        {brief.suggested_posting_url && (
          <label style={{ display: "flex", gap: 10, alignItems: "baseline", fontSize: 15 }}>
            <input type="checkbox" checked={useSuggested} onChange={(e) => setUseSuggested(e.target.checked)} />
            <span>We found a posting that may be this job: <a href={brief.suggested_posting_url} target="_blank" rel="noreferrer" style={{ overflowWrap: "anywhere" }}>{brief.suggested_posting_url}</a>. Tick to confirm it is the right one.</span>
          </label>
        )}
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 460px), 1fr))", gap: 20 }}>
        <div className="card rise d2" style={{ ...col(18), padding: 32 }}>
          <h2 className="serif" style={{ fontSize: 32 }}>What {company || "the company"} wants</h2>
          {brief.company_wants.length ? <FactRows facts={brief.company_wants} /> : <p>Not found yet.</p>}
        </div>
        <div className="card rise d3" style={{ ...col(18), padding: 32 }}>
          <h2 className="serif" style={{ fontSize: 32 }}>Skills they will test</h2>
          {brief.skills.length ? (
            <div style={col(16)}>
              {brief.skills.map((s) => (
                <div key={s.name} style={col(4)}>
                  <span style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
                    <span className="ink" style={{ fontWeight: 400 }}>{s.name}</span><SourceTag fact={{ source: s.source, url: null }} />
                  </span>
                  <span style={{ fontSize: 14 }}>{s.reason}</span>
                </div>
              ))}
            </div>
          ) : <p>Not found yet.</p>}
        </div>
      </section>

      <section style={{ padding: "72px 0 32px", display: "flex", justifyContent: "space-between", alignItems: "end", gap: 16, flexWrap: "wrap" }}>
        <div style={col(10)}>
          <h2 className="serif rise" style={{ fontSize: "clamp(34px, 6vw, 48px)", lineHeight: 1.05 }}>
            {COUNT[rounds.length] ?? rounds.length} {rounds.length === 1 ? "round" : "rounds"} <span className="ital">found.</span>
          </h2>
          <p className="rise d1">Add dates and what you know about each interviewer. Reorder or remove anything that is wrong.</p>
          {unverified && <p className="garnet rise d1" style={{ fontWeight: 400 }}>No public source describes some of these rounds. They are marked not verified. Confirm them with your recruiter.</p>}
        </div>
        <Button variant="secondary" small className="rise d1" onClick={add}>+ Add a round</Button>
      </section>

      <section style={col(14)}>
        {rounds.map((r, i) => (
          <details key={r.key} className="card" open={i === rounds.length - 1 || undefined} style={{ padding: 0 }}>
            <summary style={{ padding: "26px 32px", display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
              <span className="serif ital" style={{ fontSize: 22 }}>{i + 1}</span>
              <span className="serif" style={{ fontSize: 28, flex: "1 1 200px" }}>{r.name || "Unnamed round"}</span>
              <span style={{ fontSize: 14 }}>{roundMeta(r)}</span>
              <SourceTag fact={{ source: r.source, url: null }} />
              {r.done && <span className="tag" style={{ borderColor: "var(--olive)", color: "var(--olive)" }}>Done · Advanced</span>}
              <span className="ink" aria-hidden="true">⌄</span>
            </summary>
            <div style={{ ...col(28), padding: "0 32px 32px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: 24 }}>
                <div style={col(10)}><span className="eyebrow">What is asked</span>{r.asks.length ? <FactRows facts={r.asks} /> : <p>Not researched. You can add this on the job page.</p>}</div>
                <div style={col(10)}><span className="eyebrow">What is expected</span>{r.expects.length ? <FactRows facts={r.expects} /> : <p>Not researched. You can add this on the job page.</p>}</div>
              </div>
              <hr className="rule" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 28 }}>
                <div className="field"><label htmlFor={`r${r.key}-name`}>Round name</label>
                  <input className="inp" id={`r${r.key}-name`} value={r.name} maxLength={80} onChange={(e) => patch(r.key, { name: e.target.value })} /></div>
                <div className="field"><label htmlFor={`r${r.key}-date`}>Interview date (optional)</label>
                  <input className="inp" id={`r${r.key}-date`} type="date" value={r.date} onChange={(e) => patch(r.key, { date: e.target.value })} /></div>
                <div className="field"><label htmlFor={`r${r.key}-notes`}>About the interviewer (optional)</label>
                  <input className="inp" id={`r${r.key}-notes`} value={r.notes} maxLength={1000} onChange={(e) => patch(r.key, { notes: e.target.value })} placeholder="VP Sales, ex-Oracle, 15 years in enterprise SaaS" /></div>
              </div>
              <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap", fontSize: 14 }}>
                <label style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                  <input type="checkbox" checked={r.done} onChange={(e) => patch(r.key, { done: e.target.checked })} /> I have done this round and advanced
                </label>
                <span style={{ flex: 1 }} />
                <TextLink disabled={i === 0} onClick={() => move(i, -1)}>Move up</TextLink>
                <TextLink disabled={i === rounds.length - 1} onClick={() => move(i, 1)}>Move down</TextLink>
                <TextLink onClick={() => setRounds((rs) => rs.filter((x) => x.key !== r.key))} style={{ color: "var(--garnet)" }}>Remove</TextLink>
              </div>
            </div>
          </details>
        ))}
        {!rounds.length && <p>No rounds yet. Add at least one round to build your preparation.</p>}
      </section>

      <section className="rise d5" style={{ padding: "56px 0 96px", display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
        <Button arrow onClick={save} disabled={saving || !rounds.length}>{saving ? "Building…" : "Build my preparation"}</Button>
        <TextLink onClick={onRerun} disabled={saving}>Re-run research</TextLink>
        <span style={{ fontSize: 14 }}>You can edit all of this later.</span>
        {error && <p className="err" role="alert" style={{ flexBasis: "100%" }}>{error}</p>}
      </section>
    </>
  );
}
