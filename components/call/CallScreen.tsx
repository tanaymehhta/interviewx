"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { endCall } from "@/app/jobs/[job]/[round]/call/actions";
import { Button, Eyebrow } from "@/components/ui";
import { useSpeech } from "@/lib/useSpeech";

type Question = { text: string; type: string };
type Phase = "setup" | "starting" | "speaking" | "listening" | "scoring" | "ending";

const NEUTRAL = "Thanks. Next question.";
const STATE: Record<Exclude<Phase, "setup">, string> = {
  starting: "Connecting", speaking: "Interviewer speaking", listening: "Listening",
  scoring: "Scoring your answer", ending: "Finishing your call",
};
const mmss = (t: number) => `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;

const CSS = `
.orb{position:relative;width:132px;height:132px;display:grid;place-items:center}
.orb span{position:absolute;inset:0;border-radius:50%;border:1px solid var(--olive);opacity:0}
.orb.on span{animation:ping 2400ms ease-out infinite}
.orb.on span:nth-child(2){animation-delay:800ms}.orb.on span:nth-child(3){animation-delay:1600ms}
.orb b{width:56px;height:56px;border-radius:50%;background:var(--olive);opacity:.45;transition:opacity 200ms ease-out}
.orb.on b{opacity:1;animation:breathe 1600ms ease-in-out infinite}
.endc{width:76px;height:76px;border-radius:50%;border:0;background:var(--garnet);display:grid;place-items:center;cursor:pointer;transition:scale 150ms ease-out}
.endc:active{scale:.96}
@media (prefers-reduced-motion:reduce){.orb.on span,.orb.on b{animation:none}}
`;

export function CallScreen({ jobId, roundId, company, roundName, skillName }: {
  jobId: string; roundId: string; company: string; roundName: string; skillName: string | null;
}) {
  const router = useRouter();
  const base = `/jobs/${jobId}/${roundId}`;
  const [count, setCount] = useState<3 | 5>(3);
  const [phase, setPhase] = useState<Phase>("setup");
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [tip, setTip] = useState("");
  const [seconds, setSeconds] = useState(0);

  // The call is one async flow. These refs hold what its steps read after an await.
  const call = useRef<{ sessionId: string; skillId: string | null; questions: Question[] } | null>(null);
  const at = useRef(0);
  const answerStart = useRef(0);
  const answered = useRef(0);
  const open = useRef(false); // an answer is open; guards against a second silence event
  const ended = useRef(false);
  const scoring = useRef<Promise<unknown> | null>(null);
  const silence = useRef<() => void>(() => {});

  const speech = useSpeech({ onSilence: () => silence.current(), silenceMs: 3000, minWords: 15 });
  const live = phase !== "setup";

  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [live]);

  /** Ends the call. Answers already given are kept; one still being scored is awaited; the open one is dropped. */
  const finish = async () => {
    ended.current = true;
    open.current = false;
    speech.stop();
    speech.cancelSpeech();
    setPhase("ending");
    const c = call.current;
    if (!c) { router.push(base); return; }
    await scoring.current;
    await endCall(c.sessionId, answered.current >= c.questions.length ? "complete" : "incomplete").catch(() => {});
    router.push(`${base}/call/${c.sessionId}`);
  };

  const ask = async (i: number) => {
    at.current = i;
    setIdx(i);
    setPhase("speaking");
    await speech.speak(call.current!.questions[i].text);
    if (ended.current) return;
    answerStart.current = Date.now();
    open.current = true;
    speech.listen();
    setPhase("listening");
  };

  const answerDone = async () => {
    if (!open.current || ended.current) return;
    open.current = false;
    const text = speech.stop();
    const c = call.current!;
    const i = at.current;
    answered.current = i + 1;
    setPhase("scoring");
    const post: Promise<{ feedback?: { tip?: string } } | null> = fetch("/api/feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jobId, roundId, tool: "call", sessionId: c.sessionId, question: c.questions[i].text, questionType: c.questions[i].type,
        skillId: c.skillId, text, seconds: Math.round((Date.now() - answerStart.current) / 1000),
      }),
    }).then((r) => r.json()).catch(() => null);
    scoring.current = post;
    const spokenTip = (await post)?.feedback?.tip;
    if (ended.current) return;
    setPhase("speaking");
    if (i < c.questions.length - 1) {
      setTip(spokenTip || NEUTRAL);
      await speech.speak(spokenTip || NEUTRAL);
      if (!ended.current) ask(i + 1);
    } else {
      setTip(spokenTip || "Thanks.");
      await speech.speak(`${spokenTip || "Thanks."} That was the last question. Here is your recap.`);
      if (!ended.current) finish();
    }
  };
  useEffect(() => { silence.current = answerDone; });

  const start = async () => {
    setError("");
    setSeconds(0);
    setTip("");
    ended.current = false;
    answered.current = 0;
    scoring.current = null;
    call.current = null;
    setPhase("starting");
    // Phone browsers allow speech only when it begins inside the tap, so speak before the first await.
    const hello = speech.speak("Starting your call.");
    try {
      const res = await fetch("/api/call/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jobId, roundId, count }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      if (ended.current) { endCall(body.sessionId, "incomplete").catch(() => {}); return; }
      call.current = { sessionId: body.sessionId, skillId: body.skillId, questions: body.questions };
      setQuestions(body.questions);
      await hello;
      if (!ended.current) ask(0);
    } catch (e) {
      if (ended.current) return;
      speech.cancelSpeech();
      setError(e instanceof Error && e.message ? e.message : "The call could not start. Try again.");
      setPhase("setup");
    }
  };

  if (!live) {
    const unsupported = speech.support !== null && !speech.voiceReady;
    return (
      <main style={{ padding: "56px 0 96px", maxWidth: 640, display: "flex", flexDirection: "column", gap: 28 }}>
        <Eyebrow className="rise">{company} · {roundName} · Call</Eyebrow>
        <h1 className="serif rise d1" style={{ fontSize: "clamp(40px, 7vw, 57px)", lineHeight: 1.05 }}>
          A short drill, <span className="ital">hands-free.</span>
        </h1>
        {unsupported ? (
          <>
            <p className="ink rise d2" style={{ fontSize: 17 }}>
              A call needs speech recognition and speech output, and this browser does not have both. Call works in Chrome, Edge and Safari.
            </p>
            <div className="rise d3"><Button href={`${base}/practice`} arrow>Practice with Single questions</Button></div>
          </>
        ) : (
          <>
            <p className="rise d2" style={{ fontSize: 17 }}>
              You hear {count} short questions{skillName ? <> on <span className="ink">{skillName}</span>, your weakest skill for this round</> : null}.
              Answer out loud. When you stop for three seconds, you hear one tip and the next question.
            </p>
            <fieldset className="rise d3" style={{ border: 0, padding: 0, margin: 0, display: "flex", gap: 28, alignItems: "center", flexWrap: "wrap" }}>
              <legend className="eyebrow" style={{ padding: "0 0 12px" }}>Questions</legend>
              {([3, 5] as const).map((n) => (
                <label key={n} className="ink" style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 17, minHeight: 44, cursor: "pointer" }}>
                  <input type="radio" name="count" checked={count === n} onChange={() => setCount(n)} style={{ accentColor: "var(--olive)", width: 18, height: 18 }} />
                  {n} questions
                </label>
              ))}
            </fieldset>
            <p className="rise d4" style={{ fontSize: 13 }}>Tip: use headphones so the interviewer’s voice is not picked up.</p>
            <div className="rise d5"><Button onClick={start} disabled={!speech.voiceReady}>Start call</Button></div>
            {error && <p className="garnet" role="alert">{error}</p>}
          </>
        )}
      </main>
    );
  }

  const listening = phase === "listening";
  return (
    <div role="dialog" aria-modal="true" aria-label="Call" style={{ position: "fixed", inset: 0, zIndex: 50, overflowY: "auto", background: "var(--ivory)", display: "flex", flexDirection: "column", padding: "28px 24px 36px" }}>
      <style href="ix-call" precedence="default">{CSS}</style>
      <div style={{ flex: 1, width: "100%", maxWidth: 520, margin: "0 auto", display: "flex", flexDirection: "column" }}>
        <div className="rise" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <span className="ink" style={{ fontSize: 13 }}>{company} · {roundName}</span>
          <span className="serif num ink" style={{ fontSize: 34, lineHeight: 1 }} aria-label="Call time">{mmss(seconds)}</span>
        </div>
        <p className="eyebrow rise d1" style={{ paddingTop: 28, color: "var(--garnet)" }}>
          {questions.length ? `Call · question ${idx + 1} of ${questions.length}` : "Call"}
        </p>
        <p key={idx} className="serif qin ink" style={{ fontSize: 34, lineHeight: 1.15, paddingTop: 12, minHeight: 80 }}>{questions[idx]?.text}</p>
        <div style={{ flex: 1, minHeight: 190, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
          <div className={`orb${listening ? " on" : ""}`} aria-hidden="true"><span /><span /><span /><b /></div>
          <span className="ink" role="status" style={{ fontSize: 14, fontWeight: 400, textAlign: "center" }}>
            {speech.denied ? "The microphone is blocked. Allow it in your browser settings, then call again." : STATE[phase]}
          </span>
        </div>
        <p style={{ fontSize: 16, lineHeight: 1.7, color: "var(--ink)", minHeight: 82 }}>
          {(listening || phase === "scoring") && <>{speech.finalText} <span style={{ color: "var(--stone)" }}>{speech.interimText}</span></>}
          {listening && <span className="caret" />}
        </p>
        {tip && (
          <div key={tip} className="card rise" style={{ padding: "14px 16px", margin: "8px 0 20px", display: "flex", gap: 10, alignItems: "center", background: "var(--paper)" }}>
            <span className="dot" style={{ flex: "none" }} /><span className="ink" style={{ fontSize: 14 }}>{tip}</span>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, paddingTop: 12 }}>
          <button type="button" className="endc" aria-label="End call" onClick={finish} disabled={phase === "ending"}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--paper)" strokeWidth="1.6" aria-hidden="true"><path d="M3 15.5c5-4.6 13-4.6 18 0l-2.2 2.4-3.3-1.4v-2.3a11 11 0 0 0-7 0v2.3l-3.3 1.4z" /></svg>
          </button>
          <span style={{ fontSize: 13 }}>End call</span>
        </div>
      </div>
    </div>
  );
}
