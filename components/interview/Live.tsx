"use client";
import { useEffect, useRef, useState } from "react";
import { fmtTime } from "@/components/ui";
import { targetSeconds } from "@/lib/coach";
import { LIMITS, type InterviewScript } from "@/lib/schemas";
import type { useSpeech } from "@/lib/useSpeech";
import { saveAnswer } from "./actions";
import type { Info } from "./Interview";

type Stage = "speaking" | "answering" | "saving";
type Entry = { followUp: boolean; question: string; text: string };
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean);

export function Live({ info, sessionId, script, minutes, startTyping, speech, onFinish }: {
  info: Info;
  sessionId: string;
  script: InterviewScript;
  minutes: number;
  startTyping: boolean;
  speech: ReturnType<typeof useSpeech>;
  onFinish: (mains: number, followUps: number) => void;
}) {
  const total = script.questions.length;
  const [qi, setQi] = useState(-1); // -1 is the interviewer's introduction
  const [followUp, setFollowUp] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("speaking");
  const [shown, setShown] = useState(false);
  const [paused, setPaused] = useState(false);
  const [typing, setTyping] = useState(startTyping);
  const [typed, setTyped] = useState("");
  const [prefix, setPrefix] = useState(""); // words typed before switching back to voice
  const [time, setTime] = useState({ total: 0, answer: 0 });
  const [log, setLog] = useState<Entry[]>([]);
  const [error, setError] = useState("");

  const dialog = useRef<HTMLDialogElement>(null);
  const box = useRef<HTMLTextAreaElement>(null);
  // Values the answer flow reads after an await, when the render that started it is stale.
  const flow = useRef({ started: false, ended: false, stage: "speaking" as Stage, seconds: 0, typedThisAnswer: false, parentId: "", mains: 0, followUps: 0 });
  const doneRef = useRef<() => void>(() => {});

  const canVoice = !!speech.support?.recognition && !speech.denied;
  const isTyping = typing || !canVoice;
  const q = qi >= 0 ? script.questions[qi] : null;
  const target = targetSeconds(q?.type ?? "");
  const go = (s: Stage) => { flow.current.stage = s; setStage(s); };

  async function ask(index: number, follow: string | null) {
    setQi(index); setFollowUp(follow); setShown(false); setTyped(""); setPrefix(""); setError("");
    setTime((t) => ({ total: t.total, answer: 0 }));
    flow.current.typedThisAnswer = false;
    go("speaking");
    await speech.speak(follow ?? script.questions[index].text, () => setShown(true));
    if (flow.current.ended) return;
    go("answering");
    if (isTyping) setTimeout(() => box.current?.focus());
    else speech.listen(true);
  }

  const finish = () => {
    flow.current.ended = true;
    onFinish(flow.current.mains, flow.current.followUps);
  };

  async function done() {
    if (flow.current.stage !== "answering" || flow.current.ended || !q) return;
    const heard = speech.stop();
    const text = (isTyping ? typed : `${prefix} ${heard}`).trim();
    go("saving");
    setPaused(false);
    setError("");
    const saved = await saveAnswer({
      sessionId, index: qi, text,
      // Typed answers have no speaking time; Delivery is then judged from length alone.
      seconds: isTyping || flow.current.typedThisAnswer ? null : time.answer,
      followUp: followUp ? { parentId: flow.current.parentId, question: followUp } : undefined,
    }).catch(() => ({ error: "We could not save that answer. Press Done to try again." }));
    if (flow.current.ended) return;
    if ("error" in saved) {
      // Keep every word and reopen the answer.
      setError(saved.error);
      if (isTyping) setTyped(text);
      else { setPrefix(text); speech.listen(true); }
      go("answering");
      return;
    }
    setLog((l) => [...l, { followUp: !!followUp, question: followUp ?? q.text, text }]);
    const timeUp = flow.current.seconds >= minutes * 60;
    if (followUp) flow.current.followUps++;
    else {
      flow.current.mains++;
      flow.current.parentId = saved.id;
      if (!timeUp) {
        const next: { follow_up?: unknown } | null = await fetch("/api/interview/next", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ sessionId, answerId: saved.id }), signal: AbortSignal.timeout(10_000),
        }).then((r) => r.json()).catch(() => null);
        if (flow.current.ended) return;
        if (typeof next?.follow_up === "string" && next.follow_up) return ask(qi, next.follow_up);
      }
    }
    if (timeUp || qi + 1 >= total) return finish();
    return ask(qi + 1, null);
  }

  function togglePause() {
    if (stage !== "answering") return;
    if (paused) { if (!isTyping) speech.listen(false); }
    else speech.stop();
    setPaused(!paused);
  }

  function toggleTyping() {
    if (stage !== "answering" || paused) return;
    flow.current.typedThisAnswer = true;
    if (isTyping) {
      setPrefix(typed.trim());
      setTyping(false);
      speech.listen(true);
    } else {
      setTyped(`${prefix} ${speech.stop()}`.trim());
      setTyping(true);
      setTimeout(() => box.current?.focus());
    }
  }

  function end() {
    flow.current.ended = true;
    speech.stop();
    speech.cancelSpeech();
    onFinish(flow.current.mains, flow.current.followUps);
  }

  useEffect(() => { doneRef.current = done; flow.current.seconds = time.total; });

  // The interviewer introduces themselves, then asks the first question.
  useEffect(() => {
    if (flow.current.started) return; // development runs effects twice
    flow.current.started = true;
    void speech.speak(script.intro, () => setShown(true)).then(() => { if (!flow.current.ended) void ask(0, null); });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once; `ask` reads only stable values on the first call
  }, []);

  // Both timers stop while paused. Silence never ends an answer: only Done or Space does.
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setTime((t) => ({ total: t.total + 1, answer: stage === "answering" ? t.answer + 1 : t.answer })), 1000);
    return () => clearInterval(id);
  }, [paused, stage]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat || dialog.current?.open) return;
      // Space keeps its normal job inside text boxes and on focused controls.
      if (e.target instanceof Element && e.target.closest("textarea, input, select, button, summary, a")) return;
      e.preventDefault();
      doneRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const answering = stage === "answering";
  const listening = answering && !paused && !isTyping;
  const settled = words(`${prefix} ${speech.finalText}`);
  const interim = words(speech.interimText);
  // After a mouse or touch press the button lets go of focus, so Space means Done again.
  const release = (e: React.PointerEvent<HTMLButtonElement>) => e.currentTarget.blur();

  return (
    <div style={{ background: "var(--ivory)", minHeight: "100vh" }}>
      <div className="wrap">
        <header style={{ display: "flex", alignItems: "center", gap: 24, padding: "22px 0", borderBottom: "1px solid var(--hair)", flexWrap: "wrap" }}>
          <span className="mark" style={{ fontSize: 24 }}>Interview<i>X</i></span>
          <span className="ink" style={{ flex: 1, fontSize: 15 }}>{info.company} · {info.roundName}</span>
          <span className="num ink" style={{ fontSize: 15 }} aria-label="Interview time">{fmtTime(time.total)} / {minutes}:00</span>
          <button type="button" className="nav" style={{ border: 0, cursor: "pointer", fontFamily: "inherit" }} onClick={() => dialog.current?.showModal()}>End interview</button>
        </header>

        <section style={{ padding: "56px 0 24px", display: "flex", flexDirection: "column", gap: 28, minHeight: 340 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <span className="eyebrow" style={{ color: "var(--garnet)" }}>
              {q ? `Question ${qi + 1} of ${total} · ${q.type}` : `Your interviewer · ${script.persona}`}
            </span>
            <div style={{ display: "flex", gap: 8 }} role="img" aria-label={q ? `Question ${qi + 1} of ${total}` : `${total} questions`}>
              {script.questions.map((_, i) => (
                <span key={i} style={{ width: 8, height: 8, borderRadius: "50%", border: "1px solid var(--ink)", background: i <= qi ? "var(--ink)" : "transparent", transition: "background-color 300ms ease-out" }} />
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }} aria-live="polite">
            {followUp && <span className="eyebrow">Follow-up</span>}
            <h1 className="serif" style={{ fontSize: "clamp(32px, 4.4vw, 54px)", lineHeight: 1.12, maxWidth: 1000, minHeight: 130 }}>
              {shown && <span key={`${qi}-${followUp ?? ""}`} className="qin" style={{ display: "block" }}>{followUp ?? q?.text ?? script.intro}</span>}
            </h1>
          </div>
          <div className="ink" style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 15, fontWeight: 400, flexWrap: "wrap" }}>
            <span role="status" style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
              {stage === "speaking" ? (
                <>
                  <span className="lvl" style={{ height: 16 }} aria-hidden="true">
                    {[0, 150, 300, 80].map((d) => <i key={d} style={{ animationDelay: `${d}ms` }} />)}
                  </span>
                  Interviewer speaking · microphone off
                </>
              ) : stage === "saving" ? "One moment"
                : paused ? "Paused"
                : isTyping ? "Typing"
                : <><span className="dot live" aria-hidden="true" /> Listening</>}
            </span>
            <span style={{ flex: 1 }} />
            {q && <span className="num" style={{ color: time.answer > target ? "var(--garnet)" : undefined }}>Answer {fmtTime(time.answer)} / {fmtTime(target)}</span>}
          </div>
        </section>

        <section style={{ borderTop: "1px solid var(--hair)", padding: "28px 0", display: "flex", flexDirection: "column", gap: 14, minHeight: 220 }}>
          <span className="eyebrow">Your answer</span>
          {isTyping ? (
            <>
              <label htmlFor="live-type" className="sr">Type your answer</label>
              <textarea id="live-type" ref={box} className="inp fade" rows={5} maxLength={LIMITS.answer} disabled={!answering}
                style={{ fontSize: 19, background: "var(--paper)" }} placeholder={answering ? "Type your answer, then press Done." : ""}
                value={typed} onChange={(e) => setTyped(e.target.value)} />
            </>
          ) : stage !== "speaking" && (
            <p className="ink" style={{ fontSize: 21, lineHeight: 1.7, maxWidth: 1000 }}>
              {settled.map((w, i) => <span key={i} className="w">{w} </span>)}
              {interim.map((w, i) => <span key={settled.length + i} className="w interim">{w} </span>)}
              {listening && <span className="caret" />}
            </p>
          )}
          {error && <p className="err" role="alert">{error}</p>}
        </section>

        <section style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", padding: "8px 0 28px" }}>
          <button type="button" className="btn ghost sm" disabled={!answering} onClick={togglePause} onPointerUp={release}>{paused ? "Resume" : "Pause"}</button>
          {(canVoice || !isTyping) && (
            <button type="button" className="btn ghost sm" disabled={!answering || paused} onClick={toggleTyping} onPointerUp={release}>{isTyping ? "Speak instead" : "Type instead"}</button>
          )}
          <span style={{ flex: 1 }} />
          <button type="button" className="btn" disabled={!answering} onClick={() => void done()} onPointerUp={release}>
            Done {!isTyping && <span style={{ fontSize: 13, opacity: 0.7, fontFamily: "var(--font-sans)" }}>· Space</span>}
          </button>
        </section>

        <details style={{ borderTop: "1px solid var(--hair)", padding: "18px 0 64px" }}>
          <summary className="ink" style={{ fontSize: 15, fontWeight: 400 }}>
            Transcript{qi > 0 ? ` · question${qi > 1 ? `s 1–${qi}` : " 1"}` : ""}
          </summary>
          <div style={{ display: "flex", flexDirection: "column", paddingTop: 10 }}>
            {log.length === 0 && <p style={{ fontSize: 14 }}>Earlier questions and your answers will be listed here.</p>}
            {log.map((e, i) => (
              <div key={i} className="turn">
                <p className="who">{e.followUp ? "Interviewer · follow-up" : "Interviewer"}</p>
                <p className="ink">{e.question}</p>
                <p className="who" style={{ paddingTop: 10 }}>You</p>
                <p>{e.text || "(no answer)"}</p>
              </div>
            ))}
          </div>
        </details>
      </div>

      <dialog ref={dialog} aria-labelledby="end-title">
        <h2 className="serif" id="end-title" style={{ fontSize: 30, lineHeight: 1.15 }}>End the interview now?</h2>
        <p style={{ padding: "10px 0 24px" }}>
          {endNote(log.filter((e) => !e.followUp).length, total)}
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button type="button" className="btn sm" onClick={end}>End interview</button>
          <button type="button" className="btn ghost sm" onClick={() => dialog.current?.close()}>Keep going</button>
        </div>
      </dialog>
    </div>
  );
}

const endNote = (answered: number, total: number) =>
  answered === 0
    ? "You have not finished an answer yet, so there is nothing to review."
    : `We will review the ${answered} of ${total} questions you answered. An answer you are still giving is not saved.`;
