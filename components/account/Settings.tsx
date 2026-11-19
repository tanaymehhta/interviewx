"use client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button, TextLink } from "@/components/ui";
import { saveProfile, setTheme, signOut } from "./actions";
import { analyze, checkPdf, RESUME_RULE, uploadPdf } from "./resume";
import { MAX_ROLES, parseRoles, RESUME_TEXT_MAX } from "./shared";

export type SettingsProfile = {
  name: string; program: string; roles: string; theme: "light" | "dark"; email: string;
  resume: "pdf" | "text" | null; stories: number | null;
};

// The mock's 3-column grid with a 2-column span overflows on one-column phones, so the same 1:2 split is done with flex.
const ROW = { display: "flex", flexWrap: "wrap", gap: 32, padding: "32px 0", borderTop: "1px solid var(--hair)" } as const;
const WIDE = { flex: "2 1 min(100%, 440px)", minWidth: 0 } as const;
const Head = ({ title, text }: { title: string; text: string }) =>
  <div style={{ flex: "1 1 220px", minWidth: 0 }}><h2 className="serif" style={{ fontSize: 28 }}>{title}</h2><p style={{ fontSize: 14, overflowWrap: "anywhere" }}>{text}</p></div>;

// Each swatch previews one theme, so it shows that theme's fixed palette instead of the active tokens.
const SWATCH = {
  light: { paper: "#FFFFFF", hair: "#E5E2DA", ink: "#2A2826", olive: "#383E28" },
  dark: { paper: "#1C1B19", hair: "#3A3733", ink: "#F3EFE6", olive: "#A9B08A" },
};

export function Settings({ uid, profile }: { uid: string; profile: SettingsProfile }) {
  const router = useRouter();

  // Profile
  const [fields, setFields] = useState({ name: profile.name, program: profile.program, roles: profile.roles });
  const [profileNote, setProfileNote] = useState<{ error?: boolean; text: string } | null>(null);
  const [lastSaved, setLastSaved] = useState(JSON.stringify(fields));
  async function save() {
    if (!fields.name.trim()) return setProfileNote({ error: true, text: "Your name cannot be empty." });
    if (parseRoles(fields.roles).length > MAX_ROLES) return setProfileNote({ error: true, text: `List up to ${MAX_ROLES} roles, separated by commas.` });
    if (JSON.stringify(fields) === lastSaved) return;
    const r = await saveProfile(fields);
    if (!("error" in r)) setLastSaved(JSON.stringify(fields));
    setProfileNote("error" in r ? { error: true, text: r.error } : { text: "Saved." });
  }
  const field = (key: keyof typeof fields, id: string) => ({
    className: "inp", id, value: fields[key], onBlur: save,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => { setProfileNote(null); setFields({ ...fields, [key]: e.target.value }); },
  });

  // Resume
  const picker = useRef<HTMLInputElement>(null);
  const [resume, setResume] = useState({ kind: profile.resume, stories: profile.stories });
  const [busy, setBusy] = useState("");
  const [resumeError, setResumeError] = useState("");
  const [paste, setPaste] = useState(false);
  const [text, setText] = useState("");

  async function read(body: Parameters<typeof analyze>[0], kind: "pdf" | "text" | null) {
    setBusy("Reading your resume. This takes up to a minute.");
    const r = await analyze(body);
    setBusy("");
    if ("error" in r) {
      // The new resume is saved even when the reading fails; only the analysis is missing.
      if (kind) setResume({ kind, stories: null });
      return setResumeError(r.error);
    }
    setResume({ kind: kind ?? resume.kind, stories: r.analysis.stories.length });
    setPaste(false); setText("");
    router.refresh();
  }
  async function choose(f: File | undefined) {
    if (!f || busy) return;
    const problem = checkPdf(f);
    if (problem) return setResumeError(problem);
    setResumeError(""); setBusy(`Uploading ${f.name}`);
    const failed = await uploadPdf(uid, f);
    if (failed) { setBusy(""); return setResumeError(failed); }
    await read({ pdf: true }, "pdf");
  }
  function saveText() {
    const t = text.trim();
    if (!t) return setResumeError(`Paste your resume text first. ${RESUME_RULE}`);
    if (t.length > RESUME_TEXT_MAX) return setResumeError(`Your resume text is too long. Keep it under ${RESUME_TEXT_MAX.toLocaleString("en-US")} characters.`);
    setResumeError("");
    void read({ text: t }, "text");
  }

  // Appearance
  const [theme, setThemeState] = useState(profile.theme);
  const [themeError, setThemeError] = useState("");
  async function pick(next: "light" | "dark") {
    if (next === theme) return;
    setThemeState(next); setThemeError("");
    const r = await setTheme(next);
    if ("error" in r) { setThemeState(theme); return setThemeError(r.error); }
    router.refresh();
  }

  // Delete account
  const dialog = useRef<HTMLDialogElement>(null);
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  async function remove(e: React.FormEvent) {
    e.preventDefault();
    if (confirm !== "DELETE") return;
    setDeleting(true); setDeleteError("");
    const res = await fetch("/api/account/delete", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ confirm }) }).catch(() => null);
    if (res?.ok) { router.replace("/"); return router.refresh(); }
    setDeleting(false);
    setDeleteError((await res?.json().catch(() => null))?.error ?? "We could not delete your account. Try again.");
  }

  return (
    <>
      <section className="rise d1" style={ROW}>
        <Head title="Profile" text="Used to pitch questions at your level." />
        <div style={{ ...WIDE, display: "flex", flexDirection: "column", gap: 24 }}>
          <div className="field"><label htmlFor="st-name">Name</label><input {...field("name", "st-name")} autoComplete="name" maxLength={120} placeholder="Tanay Mehta" /></div>
          <div className="field"><label htmlFor="st-prog">Program or current role</label><input {...field("program", "st-prog")} maxLength={120} placeholder="MBA, class of 2027" /></div>
          <div className="field"><label htmlFor="st-roles">Target roles (up to {MAX_ROLES}, separated by commas)</label><input {...field("roles", "st-roles")} maxLength={600} placeholder="Sales manager, strategy associate" /></div>
          <p className={profileNote?.error ? "err" : undefined} style={{ fontSize: 14, minHeight: 25 }} role="status">{profileNote?.text}</p>
        </div>
      </section>

      <section className="rise d2" style={ROW}>
        <Head title="Resume" text="Private to you." />
        <div style={{ ...WIDE, display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ padding: 20 }} aria-live="polite">
              <p className="ink" style={{ fontWeight: 400 }}>{resume.kind === "pdf" ? "resume.pdf" : resume.kind === "text" ? "Pasted text" : "No resume yet"}</p>
              <p style={{ fontSize: 13 }}>
                {busy || (resume.kind === null ? RESUME_RULE : resume.stories === null ? "Not read yet" : `${resume.stories} ${resume.stories === 1 ? "story" : "stories"} found`)}
              </p>
            </div>
            <div style={{ padding: 20, display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
              <input ref={picker} type="file" accept="application/pdf,.pdf" hidden aria-label="Resume PDF"
                onChange={(e) => { void choose(e.target.files?.[0]); e.target.value = ""; }} />
              <Button variant="secondary" small disabled={!!busy} onClick={() => picker.current?.click()}>{resume.kind ? "Replace" : "Upload a PDF"}</Button>
              <TextLink disabled={!!busy} onClick={() => { setResumeError(""); setPaste(!paste); }}>{paste ? "Cancel" : "Paste text instead"}</TextLink>
            </div>
          </div>
          {paste && (
            <>
              <div className="field">
                <label htmlFor="st-text">Resume text</label>
                <textarea className="inp" id="st-text" rows={10} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste the full text of your resume." />
              </div>
              <div><Button small disabled={!!busy} onClick={saveText}>Save and read</Button></div>
            </>
          )}
          {resumeError && (
            <p className="err" role="alert">
              {resumeError}{" "}
              {resume.kind && resume.stories === null && !busy && <TextLink onClick={() => { setResumeError(""); void read({}, null); }}>Try again</TextLink>}
            </p>
          )}
          {!resumeError && resume.kind && resume.stories === null && !busy && (
            <p style={{ fontSize: 14 }}>We have not read this resume yet. <TextLink onClick={() => void read({}, null)}>Read it now</TextLink></p>
          )}
        </div>
      </section>

      <section className="rise d3" style={ROW}>
        <Head title="Appearance" text="Light is the default. Saved to your account." />
        <div style={{ ...WIDE, display: "flex", flexDirection: "column", gap: 12 }}>
          <div role="radiogroup" aria-label="Theme" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12, maxWidth: 520 }}>
            {(["light", "dark"] as const).map((t) => (
              <button key={t} type="button" role="radio" aria-checked={theme === t} onClick={() => pick(t)}
                className={`flex cursor-pointer flex-col gap-2.5 border bg-transparent p-3.5 text-left transition-[border-color,scale] duration-150 ease-out active:scale-[.98] ${theme === t ? "border-olive outline outline-1 outline-olive" : "border-hairline hover:border-ink"}`}>
                <span style={{ height: 72, background: SWATCH[t].paper, border: `1px solid ${SWATCH[t].hair}`, display: "flex", alignItems: "end", gap: 6, padding: 10 }}>
                  <span style={{ width: "40%", height: 8, background: SWATCH[t].ink }} />
                  <span style={{ width: "18%", height: 8, background: SWATCH[t].olive }} />
                </span>
                <span className="ink" style={{ fontSize: 15, fontWeight: 400 }}>{t === "light" ? "Light" : "Dark"}</span>
              </button>
            ))}
          </div>
          {themeError && <p className="err" role="alert">{themeError}</p>}
        </div>
      </section>

      <section className="rise d4" style={{ ...ROW, padding: "32px 0 96px" }}>
        <Head title="Account" text={`Signed in as ${profile.email}`} />
        <div style={{ ...WIDE, display: "flex", flexDirection: "column", gap: 24 }}>
          <form action={signOut}><Button variant="secondary" small type="submit">Sign out</Button></form>
          <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14, borderColor: "var(--garnet)", alignItems: "flex-start" }}>
            <p className="ink" style={{ fontWeight: 400 }}>Delete account</p>
            <p style={{ fontSize: 14 }}>Removes your jobs, rounds, answers, chats and resume. This cannot be undone.</p>
            <Button variant="danger" small onClick={() => { setConfirm(""); setDeleteError(""); dialog.current?.showModal(); }}>Delete account</Button>
          </div>
        </div>
      </section>

      <dialog ref={dialog} aria-labelledby="st-del-title">
        <form onSubmit={remove} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <h2 className="serif" id="st-del-title" style={{ fontSize: 32, lineHeight: 1.1 }}>Delete your account?</h2>
          <p style={{ fontSize: 14 }}>This removes your account, jobs, rounds, answers, chats and resume file. It cannot be undone.</p>
          <div className="field">
            <label htmlFor="st-del">Type DELETE to confirm</label>
            <input className="inp" id="st-del" autoComplete="off" autoCapitalize="characters" placeholder="DELETE" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          {deleteError && <p className="err" role="alert">{deleteError}</p>}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Button variant="danger" small type="submit" disabled={confirm !== "DELETE" || deleting}>{deleting ? "Deleting" : "Delete account"}</Button>
            <Button variant="secondary" small disabled={deleting} onClick={() => dialog.current?.close()}>Cancel</Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
