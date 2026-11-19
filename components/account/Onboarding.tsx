"use client";
import Link from "next/link";
import { useId, useRef, useState } from "react";
import type { ResumeAnalysis } from "@/lib/schemas";
import { Button, TextLink } from "@/components/ui";
import { finishOnboarding, saveProfile, saveStoryNames } from "./actions";
import { analyze, checkPdf, fileSize, RESUME_RULE, uploadPdf } from "./resume";
import { MAX_ROLES, parseRoles, RESUME_TEXT_MAX } from "./shared";

export type OnboardingProfile = {
  name: string; program: string; roles: string;
  /** What is already saved: a PDF, pasted text (passed along so it can be edited), or nothing. */
  hasPdf: boolean; resumeText: string; analysis: ResumeAnalysis | null;
};

const H1 = { fontSize: "clamp(40px, 7vw, 60px)", lineHeight: 1.05 };
const SECTION = { padding: "72px 0 96px", display: "flex", flexDirection: "column", gap: 40 } as const;

export function Onboarding({ uid, profile }: { uid: string; profile: OnboardingProfile }) {
  const hasSaved = profile.hasPdf || !!profile.resumeText;
  const [step, setStep] = useState(hasSaved ? 3 : 1);
  const [fields, setFields] = useState({ name: profile.name, program: profile.program, roles: profile.roles });
  const [error, setError] = useState("");

  const [file, setFile] = useState<{ name: string; size: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  /** A PDF uploaded in this visit that the analysis has not read yet. */
  const [pendingPdf, setPendingPdf] = useState(false);
  const [paste, setPaste] = useState(!profile.hasPdf && !!profile.resumeText);
  const [text, setText] = useState(profile.resumeText);
  const [savedText, setSavedText] = useState(profile.resumeText);
  const [saved, setSaved] = useState(hasSaved);
  const picker = useRef<HTMLInputElement>(null);

  const [analysis, setAnalysis] = useState(profile.analysis);
  const [busy, setBusy] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const go = (n: number) => { setError(""); setStep(n); };
  const field = (key: keyof typeof fields, id: string) => ({
    className: "inp", id, value: fields[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setFields({ ...fields, [key]: e.target.value }),
    // Saved as the person goes, so closing the browser keeps what they typed.
    onBlur: () => { void saveProfile(fields); },
  });

  async function continueFromAbout(e: React.FormEvent) {
    e.preventDefault();
    if (!fields.name.trim()) return setError("Enter your name to continue.");
    if (parseRoles(fields.roles).length > MAX_ROLES) return setError(`List up to ${MAX_ROLES} roles, separated by commas.`);
    const r = await saveProfile(fields);
    if ("error" in r) return setError(r.error);
    go(2);
  }

  async function choose(f: File | undefined) {
    if (!f || uploading) return;
    const problem = checkPdf(f);
    if (problem) return setError(problem);
    setError(""); setPaste(false); setFile({ name: f.name, size: f.size }); setUploading(true);
    const failed = await uploadPdf(uid, f);
    setUploading(false);
    if (failed) { setFile(null); return setError(failed); }
    setPendingPdf(true);
  }

  async function run(body: Parameters<typeof analyze>[0]) {
    go(3); setBusy(true); setAnalysis(null);
    const r = await analyze(body);
    setBusy(false);
    if ("error" in r) return setError(r.error);
    setAnalysis(r.analysis); setSaved(true); setPendingPdf(false);
    if (body?.text !== undefined) setSavedText(body.text);
  }

  function read() {
    if (uploading) return;
    if (paste) {
      const t = text.trim();
      if (!t) return setError(`Paste your resume text first. ${RESUME_RULE}`);
      if (t.length > RESUME_TEXT_MAX) return setError(`Your resume text is too long. Keep it under ${RESUME_TEXT_MAX.toLocaleString("en-US")} characters.`);
      return t === savedText && analysis ? go(3) : run({ text: t });
    }
    if (pendingPdf) return run({ pdf: true });
    if (saved) return analysis ? go(3) : run({});
    setError(`Add your resume first. ${RESUME_RULE}`);
  }

  function rename(index: number, name: string) {
    if (!analysis) return;
    const stories = analysis.stories.map((s, i) => (i === index ? { ...s, name } : s));
    setAnalysis({ ...analysis, stories });
    void saveStoryNames(stories.map((s) => s.name)).then((r) => { if ("error" in r) setError(r.error); });
  }

  async function finish() {
    setFinishing(true);
    const r = await finishOnboarding();
    if (r && "error" in r) { setFinishing(false); setError(r.error); }
  }

  const drop = uploading ? { label: `Uploading ${file?.name}`, sub: "PDF up to 3 MB" }
    : file ? { label: file.name, sub: `${fileSize(file.size)} · ready` }
    : profile.hasPdf && !savedText ? { label: "resume.pdf", sub: "Saved · click to replace" }
    : { label: "Drop your resume here", sub: "PDF up to 3 MB, or click to choose" };

  return (
    <div className="wrap" style={{ maxWidth: 880 }}>
      <header className="topbar" style={{ justifyContent: "space-between" }}>
        <Link className="mark" href="/">Interview<i>X</i></Link>
        <span style={{ fontSize: 14 }}>Step {step} of 3</span>
      </header>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, paddingTop: 32 }}>
        {["About you", "Resume", "What we found"].map((label, i) => (
          <div key={label} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="bar"><i style={{ width: step > i ? "100%" : "0%" }} /></div>
            <span className="eyebrow" style={step > i ? { color: "var(--ink)" } : undefined} aria-current={step === i + 1 ? "step" : undefined}>{label}</span>
          </div>
        ))}
      </div>

      {step === 1 && (
        <form onSubmit={continueFromAbout} noValidate style={{ ...SECTION, gap: 44 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <h1 className="serif rise" style={H1}>First, a little about <span className="ital">you.</span></h1>
            <p className="rise d1">We use this to pitch every question at your level. You only do this once.</p>
          </div>
          <div className="rise d2" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: 32 }}>
            <div className="field"><label htmlFor="ob-name">Your name</label><input {...field("name", "ob-name")} autoComplete="name" required maxLength={120} placeholder="Tanay Mehta" /></div>
            <div className="field"><label htmlFor="ob-prog">Program or current role</label><input {...field("program", "ob-prog")} maxLength={120} placeholder="MBA, class of 2027" /></div>
          </div>
          <div className="field rise d3">
            <label htmlFor="ob-roles">Roles you are aiming for (up to {MAX_ROLES}, separated by commas)</label>
            <input {...field("roles", "ob-roles")} maxLength={600} placeholder="Sales manager, strategy associate, deployment strategist" />
          </div>
          {error && <p className="err" role="alert">{error}</p>}
          <div className="rise d4"><Button type="submit" arrow>Continue</Button></div>
        </form>
      )}

      {step === 2 && (
        <section style={SECTION}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <h1 className="serif rise" style={H1}>Your resume holds your best <span className="ital">stories.</span></h1>
            <p className="rise d1">Upload a PDF up to 3 MB, or paste the text. Only you can see it.</p>
          </div>
          <input ref={picker} type="file" accept="application/pdf,.pdf" hidden aria-label="Resume PDF"
            onChange={(e) => { void choose(e.target.files?.[0]); e.target.value = ""; }} />
          {paste ? (
            <div className="field rise d2">
              <label htmlFor="ob-text">Resume text</label>
              <textarea className="inp" id="ob-text" rows={12} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste the full text of your resume." />
            </div>
          ) : (
            <button className="rise d2 lift" type="button" onClick={() => picker.current?.click()}
              onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); void choose(e.dataTransfer.files[0]); }}
              style={{ font: "inherit", color: "inherit", cursor: "pointer", width: "100%", boxSizing: "border-box", border: "1px dashed var(--ink)", borderRadius: 0, padding: "56px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, textAlign: "center", background: "var(--ivory)" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="1.2" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5M4 20h16" /></svg>
              <span className="serif" style={{ fontSize: 26, overflowWrap: "anywhere" }}>{drop.label}</span>
              <span style={{ fontSize: 14 }}>{drop.sub}</span>
              {uploading && <div className="prog" style={{ width: "min(260px, 100%)" }}><i style={{ animation: "fill 1.6s var(--ease) both" }} /></div>}
            </button>
          )}
          {error && <p className="err" role="alert">{error}</p>}
          <div className="rise d3" style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
            <Button arrow onClick={read} disabled={uploading}>Read my resume</Button>
            <TextLink onClick={() => { setError(""); setPaste(!paste); }}>{paste ? "Upload a PDF instead" : "Paste text instead"}</TextLink>
            <TextLink onClick={() => go(1)}>Back</TextLink>
          </div>
        </section>
      )}

      {step === 3 && (
        <section style={SECTION}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <h1 className="serif rise" style={H1}>Here is what we <span className="ital">found.</span></h1>
            <p className="rise d1">Rename any story. Questions and feedback will use these names.</p>
          </div>
          <div aria-live="polite" style={{ display: "flex", flexDirection: "column", gap: 40 }}>
            {busy ? (
              <div className="step"><span className="spin" aria-hidden="true" /><span className="ink">Reading your resume. This takes up to a minute.</span></div>
            ) : analysis ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: 16 }}>
                  <div className="card rise d2" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 12 }}>
                    <span className="eyebrow olive">Strengths</span>
                    {analysis.strengths.map((s, i) => <p className="ink" key={i}>{s}</p>)}
                  </div>
                  <div className="card rise d3" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 12 }}>
                    <span className="eyebrow garnet">Gaps for your target roles</span>
                    {analysis.gaps.map((s, i) => <p className="ink" key={i}>{s}</p>)}
                  </div>
                </div>
                <div className="rise d4" style={{ display: "flex", flexDirection: "column" }}>
                  <span className="eyebrow" style={{ paddingBottom: 12 }}>Stories worth preparing</span>
                  {analysis.stories.map((s, i) => <Story key={i} name={s.name} onRename={(name) => rename(i, name)} />)}
                  {analysis.stories.length === 0 && <p className="turn">We found no stories. Add more detail to your resume, then replace it in Settings.</p>}
                </div>
              </>
            ) : (
              <div className="card" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 16, alignItems: "flex-start" }}>
                <p className="ink">Your resume is saved, but we have not read it yet. You can try again now or continue and do it later in Settings.</p>
                <Button variant="secondary" small onClick={() => run({})}>Try again</Button>
              </div>
            )}
          </div>
          {error && <p className="err" role="alert">{error}</p>}
          <div className="rise d5" style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
            <Button arrow onClick={finish} disabled={busy || finishing}>Go to My Jobs</Button>
            <TextLink onClick={() => go(2)} disabled={busy}>Back</TextLink>
          </div>
        </section>
      )}
    </div>
  );
}

function Story({ name, onRename }: { name: string; onRename: (name: string) => void }) {
  const id = useId();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const row = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" } as const;

  if (!editing) {
    return (
      <div className="turn" style={row}>
        <span className="serif" style={{ fontSize: 24 }}>{name}</span>
        <TextLink onClick={() => { setValue(name); setEditing(true); }} aria-label={`Rename ${name}`}>Rename</TextLink>
      </div>
    );
  }
  return (
    <form className="turn" style={row} onSubmit={(e) => { e.preventDefault(); setEditing(false); if (value.trim() && value.trim() !== name) onRename(value.trim()); }}>
      <label className="sr" htmlFor={id}>Story name</label>
      <input className="inp serif" id={id} autoFocus maxLength={60} value={value} onChange={(e) => setValue(e.target.value)} style={{ fontFamily: "var(--font-serif)", fontSize: 24, flex: "1 1 240px", width: "auto" }} />
      <TextLink type="submit">Save</TextLink>
      <TextLink onClick={() => setEditing(false)}>Cancel</TextLink>
    </form>
  );
}
