"use client";
import { useState, useTransition } from "react";
import { Button, fmtDate, Steps, TextLink } from "@/components/ui";
import { FactRows, RequirementRows } from "@/components/jobs/bits";
import { RESEARCH_STEPS, useResearch } from "@/components/jobs/useResearch";
import type { Brief, Fact, StoredBrief } from "@/lib/schemas";
import { saveBrief, type BriefSave } from "./actions";

type RoundFacts = { id: string; name: string; asks: Fact[]; expects: Fact[] };
type Group = { key: string; label: string; facts: Fact[] };
const col = (gap: number) => ({ display: "flex", flexDirection: "column", gap }) as const;

const groupsOf = (company: string, wants: Fact[], rounds: RoundFacts[]): Group[] => [
  { key: "wants", label: `What ${company} wants`, facts: wants },
  ...rounds.flatMap((r) => [
    { key: `${r.id}:asks`, label: `${r.name} · what is asked`, facts: r.asks },
    { key: `${r.id}:expects`, label: `${r.name} · what is expected`, facts: r.expects },
  ]),
];
const toSave = (groups: Group[], rounds: RoundFacts[], research?: BriefSave["research"]): BriefSave => {
  const get = (key: string) => (groups.find((g) => g.key === key)?.facts ?? []).filter((f) => f.text.trim());
  return { company_wants: get("wants"), rounds: rounds.map((r) => ({ id: r.id, asks: get(`${r.id}:asks`), expects: get(`${r.id}:expects`) })), research };
};

/** The saved brief: read it, edit any item, or re-run research and review new findings beside your edits. */
export function BriefCard({ jobId, company, brief, rounds }: { jobId: string; company: string; brief: StoredBrief; rounds: RoundFacts[] }) {
  const groups = groupsOf(company, brief.company_wants ?? [], rounds);
  const [draft, setDraft] = useState<Group[] | null>(null);
  const [dropped, setDropped] = useState<string[]>([]); // "groupKey#index" of edits the person chose to replace
  const [error, setError] = useState("");
  const [saving, startSaving] = useTransition();
  const r = useResearch();

  const save = (data: BriefSave) => {
    setError("");
    startSaving(async () => {
      const res = await saveBrief(jobId, data);
      if (res.error) return setError(res.error);
      setDraft(null);
      setDropped([]);
      r.reset();
    });
  };
  const change = (key: string, fn: (facts: Fact[]) => Fact[]) =>
    setDraft((d) => d && d.map((g) => (g.key === key ? { ...g, facts: fn(g.facts) } : g)));

  const all = groups.flatMap((g) => g.facts);
  const count = (s: Fact["source"]) => all.filter((f) => !f.edited && f.source === s).length;
  const head = (action?: React.ReactNode) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
      <h2 className="serif" style={{ fontSize: 32 }}>Research brief</h2>{action}
    </div>
  );

  if (r.status === "busy")
    return (
      <div className="card" style={{ ...col(20), padding: 32 }}>
        {head(<TextLink onClick={r.reset} style={{ fontSize: 14 }}>Cancel</TextLink>)}
        <Steps steps={RESEARCH_STEPS} current={r.step} />
        <p style={{ fontSize: 14 }}>Your edits are kept. You choose what to replace when this finishes.</p>
      </div>
    );

  if (r.status === "done" && r.brief) {
    const found: Brief = r.brief;
    const fresh = (g: Group): Fact[] => {
      if (g.key === "wants") return found.company_wants;
      const [id, kind] = g.key.split(":") as [string, "asks" | "expects"];
      const name = rounds.find((x) => x.id === id)?.name.trim().toLowerCase();
      return found.rounds.find((x) => x.name.trim().toLowerCase() === name)?.[kind] ?? [];
    };
    const merged = groups.map((g) => {
      const next = fresh(g);
      const kept = g.facts.filter((f, i) => f.edited && !dropped.includes(`${g.key}#${i}`));
      return next.length ? { ...g, facts: [...kept, ...next] } : g; // nothing new: the current items stay
    });
    return (
      <div className="card" style={{ ...col(24), padding: 32, gridColumn: "1 / -1" }}>
        {head()}
        <p>New findings are below. Your edits stay unless you untick them.</p>
        {r.partial && <p className="garnet" style={{ fontWeight: 400 }}>Research did not finish. Missing: {found.missing.join(", ")}. You can save this or re-run.</p>}
        {groups.map((g) => {
          const next = fresh(g);
          const edits = g.facts.map((f, i) => ({ f, id: `${g.key}#${i}` })).filter((x) => x.f.edited);
          if (!next.length && !edits.length) return null;
          return (
            <div key={g.key} style={col(12)}>
              <span className="eyebrow">{g.label}</span>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: 24 }}>
                {edits.length > 0 && (
                  <div style={col(10)}>
                    <span style={{ fontSize: 13 }}>Your edits</span>
                    {edits.map(({ f, id }) => (
                      <label key={id} style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                        <input type="checkbox" checked={!dropped.includes(id)}
                          onChange={(e) => setDropped((d) => (e.target.checked ? d.filter((x) => x !== id) : [...d, id]))} />
                        <span className="ink">{f.text} <span style={{ fontSize: 13, color: "var(--stone)" }}>· keep my edit</span></span>
                      </label>
                    ))}
                  </div>
                )}
                <div style={col(10)}>
                  <span style={{ fontSize: 13 }}>New findings</span>
                  {next.length ? <FactRows facts={next} /> : <p style={{ fontSize: 14 }}>Nothing new found. Your current items stay.</p>}
                </div>
              </div>
            </div>
          );
        })}
        {error && <p className="err" role="alert">{error}</p>}
        <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          <Button small disabled={saving} onClick={() => {
            const data = toSave(merged, rounds, { summary: found.summary, missing: found.missing, requirements: found.requirements });
            const card = (id: string) => found.rounds.find((x) => x.name.trim().toLowerCase() === rounds.find((y) => y.id === id)?.name.trim().toLowerCase())?.scorecard;
            save({ ...data, rounds: data.rounds.map((x) => ({ ...x, scorecard: card(x.id) })) });
          }}>{saving ? "Saving…" : "Save new research"}</Button>
          <TextLink disabled={saving} onClick={() => { r.reset(); setDropped([]); }}>Discard new findings</TextLink>
        </div>
      </div>
    );
  }

  if (draft)
    return (
      <div className="card" style={{ ...col(24), padding: 32, gridColumn: "1 / -1" }}>
        {head(<TextLink onClick={() => setDraft(null)} style={{ fontSize: 14 }}>Cancel</TextLink>)}
        {draft.map((g) => (
          <div key={g.key} style={col(6)}>
            <span className="eyebrow">{g.label}</span>
            {g.facts.map((f, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <input className="inp" aria-label={`${g.label}, item ${i + 1}`} value={f.text} maxLength={400}
                  onChange={(e) => change(g.key, (fs) => fs.map((x, j) => (j === i ? { ...x, text: e.target.value, edited: true } : x)))} />
                <TextLink aria-label={`Remove item ${i + 1}`} style={{ fontSize: 14 }} onClick={() => change(g.key, (fs) => fs.filter((_, j) => j !== i))}>Remove</TextLink>
              </div>
            ))}
            <TextLink style={{ alignSelf: "flex-start", fontSize: 14, marginTop: 6 }}
              onClick={() => change(g.key, (fs) => [...fs, { text: "", source: "general", url: null, edited: true }])}>+ Add an item</TextLink>
          </div>
        ))}
        {error && <p className="err" role="alert">{error}</p>}
        <div><Button small disabled={saving} onClick={() => save(toSave(draft, rounds))}>{saving ? "Saving…" : "Save changes"}</Button></div>
      </div>
    );

  return (
    <div className="card rise d6" style={{ ...col(16), padding: 32 }}>
      {head(<TextLink onClick={() => { setError(""); setDraft(groups); }} style={{ fontSize: 14 }}>Edit</TextLink>)}
      {brief.summary && <p className="ink">{brief.summary}</p>}
      {(brief.company_wants ?? []).length > 0 && <FactRows facts={brief.company_wants} />}
      {(brief.requirements ?? []).length > 0 && (
        <details>
          <summary className="tlink" style={{ fontSize: 14, display: "inline" }}>Requirements, against your resume</summary>
          <div style={{ paddingTop: 14 }}><RequirementRows items={brief.requirements!} /></div>
        </details>
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {count("web") > 0 && <span className="tag web">{count("web")} from the web</span>}
        {count("job_post") > 0 && <span className="tag post">{count("job_post")} from the job post</span>}
        {count("resume") > 0 && <span className="tag">{count("resume")} from your resume</span>}
        {count("general") > 0 && <span className="tag gen">{count("general")} not verified</span>}
        {all.some((f) => f.edited) && <span className="tag">{all.filter((f) => f.edited).length} edited by you</span>}
      </div>
      {(brief.missing ?? []).length > 0 && <p className="garnet" style={{ fontSize: 14, fontWeight: 400 }}>Missing from research: {brief.missing.join(", ")}.</p>}
      {r.status === "needs_text" && (
        <p style={{ fontSize: 14 }}>We could not read the saved link. <TextLink onClick={() => r.run({ jobId, skipLink: true })}>Research by company and role instead</TextLink></p>
      )}
      {r.status === "error" && <p className="err" role="alert">{r.error}</p>}
      <p style={{ fontSize: 14 }}>
        {brief.researched_at ? `Last researched ${fmtDate(brief.researched_at, { day: "numeric", month: "short" })}. ` : ""}
        <TextLink onClick={() => r.run({ jobId })}>Re-run</TextLink>
      </p>
    </div>
  );
}
