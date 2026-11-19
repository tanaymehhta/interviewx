"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, TextLink } from "@/components/ui";
import { OUTCOME_LABEL, OUTCOMES } from "@/components/jobs/bits";
import type { Outcome } from "@/lib/coach";
import { saveAsked, saveOutcome } from "./actions";

type Props = {
  jobId: string; roundId: string;
  initial: { outcome: Outcome | null; went_well: string; went_wrong: string; asked_questions: string[] };
  /** Readiness and scored answers saved with the round (the snapshot once one exists). */
  saved: { readiness: number; answers: number };
};

/** Outcome form for a real round (CheckIn mock). After saving, the round page shows the confirmation. */
export function CheckIn({ jobId, roundId, initial, saved }: Props) {
  const router = useRouter();
  const [outcome, setOutcome] = useState<Outcome | null>(initial.outcome);
  const [well, setWell] = useState(initial.went_well);
  const [wrong, setWrong] = useState(initial.went_wrong);
  const [asked, setAsked] = useState(initial.asked_questions);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [busy, start] = useTransition();

  const withDraft = () => (q.trim() && !asked.includes(q.trim()) ? [...asked, q.trim()] : asked);
  const add = () => { setAsked(withDraft()); setQ(""); };
  const practice = (question: string) => start(async () => {
    const res = await saveAsked(jobId, roundId, asked);
    if (res.error) return setError(res.error);
    router.push(`/jobs/${jobId}/${roundId}/practice?q=${encodeURIComponent(question)}`);
  });
  const save = () => {
    if (!outcome) return setError("Choose an outcome first.");
    setError("");
    const questions = withDraft();
    start(async () => {
      const res = await saveOutcome(jobId, roundId, { outcome, went_well: well, went_wrong: wrong, asked_questions: questions });
      if (res.error) return setError(res.error);
      // The page shows the confirmation, so it survives the data refresh that follows the save.
      router.push(`/jobs/${jobId}/${roundId}?saved=1`);
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
      <div role="group" aria-labelledby="ci-out" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <span className="eyebrow" id="ci-out">Outcome</span>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {OUTCOMES.map((o) => (
            <button key={o} className={`choice${o === outcome ? " on" : ""}`} type="button" aria-pressed={o === outcome} onClick={() => setOutcome(o)}>{OUTCOME_LABEL[o]}</button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: 24 }}>
        <div className="field"><label htmlFor="ci-well">What went well</label>
          <textarea className="inp" id="ci-well" rows={4} maxLength={4000} value={well} onChange={(e) => setWell(e.target.value)} placeholder="The pipeline review question felt easy. They liked the Northwind story." /></div>
        <div className="field"><label htmlFor="ci-wrong">Where it went wrong</label>
          <textarea className="inp" id="ci-wrong" rows={4} maxLength={4000} value={wrong} onChange={(e) => setWrong(e.target.value)} placeholder="My 30-60-90 plan had no numbers for month two." /></div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <span className="eyebrow" style={{ paddingBottom: 12 }}>Questions they actually asked</span>
        {asked.map((question) => (
          <div key={question} className="turn" style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
            <span className="ink" style={{ flex: "1 1 240px" }}>{question}</span>
            <TextLink disabled={busy} onClick={() => practice(question)} style={{ fontSize: 14 }}>Practice this</TextLink>
            <TextLink aria-label={`Remove: ${question}`} onClick={() => setAsked((a) => a.filter((x) => x !== question))} style={{ fontSize: 14 }}>Remove</TextLink>
          </div>
        ))}
        <form className="turn" style={{ display: "flex", gap: 12, alignItems: "center" }} onSubmit={(e) => { e.preventDefault(); add(); }}>
          <label htmlFor="ci-q" className="sr">Add a question</label>
          <input className="inp" id="ci-q" value={q} maxLength={500} onChange={(e) => setQ(e.target.value)} placeholder={asked.length ? "Add another question" : "Add a question they asked"} style={{ flex: 1 }} />
          <Button variant="secondary" small type="submit">Add</Button>
        </form>
      </div>

      <div className="card soft" style={{ padding: 24, display: "flex", gap: 32, flexWrap: "wrap", alignItems: "center" }}>
        <span className="eyebrow" style={{ flex: "1 1 200px" }}>Saved with this round</span>
        <span><span className="serif num" style={{ fontSize: 32 }}>{saved.readiness}</span> <span style={{ fontSize: 13 }}>readiness</span></span>
        <span><span className="serif num" style={{ fontSize: 32 }}>{saved.answers}</span> <span style={{ fontSize: 13 }}>practice answers</span></span>
      </div>

      {error && <p className="err" role="alert">{error}</p>}
      <div><Button arrow onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</Button></div>
    </div>
  );
}
