"use client";
// One client flow for a full interview: setup, then the live interview, then the review loading screen.
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Steps } from "@/components/ui";
import type { Mode } from "@/lib/interview";
import type { InterviewScript } from "@/lib/schemas";
import { useSpeech } from "@/lib/useSpeech";
import { Live } from "./Live";
import { Setup } from "./Setup";

export type Info = {
  jobId: string; roundId: string; company: string; role: string; roundName: string;
  interviewerType: string | null; expects: string[];
};
type Run = { sessionId: string; script: InterviewScript; minutes: number; mode: Mode };

export function Interview({ info }: { info: Info }) {
  const router = useRouter();
  const speech = useSpeech();
  const [run, setRun] = useState<Run | null>(null);
  const [answered, setAnswered] = useState<{ mains: number; followUps: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function begin(minutes: number, mode: Mode) {
    setBusy(true);
    setError("");
    // Safari on iPhone only lets speech start from a tap. This keeps it open for the questions that follow.
    if (speech.support?.synthesis) window.speechSynthesis.speak(new SpeechSynthesisUtterance(" "));
    try {
      const res = await fetch("/api/interview/start", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ jobId: info.jobId, roundId: info.roundId, lengthMinutes: minutes, mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRun({ sessionId: data.sessionId, script: data.script, minutes, mode });
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "The interview did not start. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function finish(mains: number, followUps: number) {
    if (!mains) { router.push(`/jobs/${info.jobId}/${info.roundId}`); return; }
    void speech.speak(run!.script.closing);
    setAnswered({ mains, followUps });
  }

  if (!run) return <Setup info={info} recognition={speech.support ? speech.support.recognition : null} busy={busy} error={error} onBegin={begin} />;
  if (!answered) {
    return <Live info={info} sessionId={run.sessionId} script={run.script} minutes={run.minutes} startTyping={run.mode === "typing"} speech={speech} onFinish={finish} />;
  }
  return <Reviewing info={info} sessionId={run.sessionId} {...answered} />;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

function Reviewing({ info, sessionId, mains, followUps }: { info: Info; sessionId: string; mains: number; followUps: number }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const sent = useRef(false);
  const steps = [
    `Reading ${plural(mains, "answer")}${followUps ? ` and ${plural(followUps, "follow-up")}` : ""}`,
    "Scoring structure, relevance and impact",
    `Comparing with what ${info.company} expects in the ${info.roundName.toLowerCase()} round`,
    "Writing your upgraded answers",
  ];

  useEffect(() => {
    const id = setInterval(() => setStep((s) => Math.min(s + 1, 3)), 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (sent.current) return; // development runs effects twice; the review must be requested once
    sent.current = true;
    // After 60 seconds, or on failure, the results page opens anyway with what is reviewed and a retry.
    fetch("/api/interview/review", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId }), signal: AbortSignal.timeout(60_000),
    }).catch(() => null).then(() => router.replace(`/jobs/${info.jobId}/${info.roundId}/interview/${sessionId}`));
  }, [router, info.jobId, info.roundId, sessionId]);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <div className="wrap" style={{ width: "100%" }}>
        <header className="topbar" style={{ justifyContent: "space-between" }}>
          <span className="mark">Interview<i>X</i></span>
          <span style={{ fontSize: 14 }}>{info.company} · {info.roundName} · {plural(mains, "answer")}</span>
        </header>
      </div>
      <main className="wrap" style={{ flex: 1, display: "flex", alignItems: "center", width: "100%" }}>
        <div style={{ maxWidth: 640, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 40, padding: "64px 0" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p className="eyebrow rise">Thank you. That is the end of the interview.</p>
            <h1 className="serif rise d1" style={{ fontSize: "clamp(42px, 8vw, 64px)", lineHeight: 1.02 }}>Reviewing your <span className="ital">interview.</span></h1>
          </div>
          <div className="prog rise d2" role="progressbar" aria-label="Review progress" aria-valuemin={0} aria-valuemax={4} aria-valuenow={step}>
            <i style={{ animation: "none", transform: `scaleX(${(step + 0.6) / 4})`, transition: "transform 5s var(--ease)" }} />
          </div>
          <div style={{ fontSize: 18 }}><Steps steps={steps} current={step} /></div>
          <span style={{ fontSize: 14 }}>Usually under a minute. Your results open on their own.</span>
        </div>
      </main>
    </div>
  );
}
