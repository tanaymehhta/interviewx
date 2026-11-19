"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LENGTHS, questionCount, type Mode } from "@/lib/interview";
import type { Info } from "./Interview";

// Loudness (0 to 1, root mean square) that counts as "we can hear you", and how many frames in a row it must hold.
// Raise HEAR_LEVEL if a noisy room passes the check without speech.
const HEAR_LEVEL = 0.04;
const HEAR_FRAMES = 8;
const BARS = 14;

export function Setup({ info, recognition, busy, error, onBegin }: {
  info: Info;
  /** null until the browser is checked */
  recognition: boolean | null;
  busy: boolean;
  error: string;
  onBegin: (minutes: number, mode: Mode) => void;
}) {
  const [minutes, setMinutes] = useState<number>(30);
  const [picked, setPicked] = useState<Mode>("voice");
  const [heard, setHeard] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const bars = useRef<HTMLDivElement>(null);

  const voiceOk = recognition !== false && !blocked;
  const mode: Mode = voiceOk ? picked : "typing";
  const checking = mode === "voice" && recognition === true;

  useEffect(() => {
    if (!checking) return;
    let left = false, raf = 0, stream: MediaStream | undefined, audio: AudioContext | undefined;
    (navigator.mediaDevices ? navigator.mediaDevices.getUserMedia({ audio: true }) : Promise.reject(new Error("No microphone access")))
      .then((s) => {
        if (left) { s.getTracks().forEach((t) => t.stop()); return; }
        stream = s;
        audio = new AudioContext();
        void audio.resume();
        const analyser = audio.createAnalyser();
        analyser.fftSize = 64;
        audio.createMediaStreamSource(s).connect(analyser);
        const freq = new Uint8Array(analyser.frequencyBinCount), wave = new Uint8Array(analyser.fftSize);
        let loud = 0;
        const tick = () => {
          analyser.getByteFrequencyData(freq);
          analyser.getByteTimeDomainData(wave);
          bars.current?.querySelectorAll("i").forEach((el, i) => { el.style.transform = `scaleY(${Math.max(0.12, freq[i + 1] / 255)})`; });
          const rms = Math.sqrt(wave.reduce((sum, v) => sum + ((v - 128) / 128) ** 2, 0) / wave.length);
          loud = rms > HEAR_LEVEL ? loud + 1 : 0;
          if (loud >= HEAR_FRAMES) setHeard(true);
          raf = requestAnimationFrame(tick);
        };
        tick();
      })
      .catch(() => setBlocked(true));
    return () => {
      left = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      void audio?.close();
    };
  }, [checking]);

  const who = info.interviewerType ? `The ${info.interviewerType.replace(/^the\s+/i, "")}` : "An interviewer";

  return (
    <div className="wrap" style={{ maxWidth: 880 }}>
      <header className="topbar" style={{ justifyContent: "space-between" }}>
        <Link className="mark" href="/">Interview<i>X</i></Link>
        <Link className="nav" href={`/jobs/${info.jobId}/${info.roundId}`}>Exit</Link>
      </header>
      <section style={{ padding: "64px 0 96px", display: "flex", flexDirection: "column", gap: 44 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <p className="eyebrow rise">{info.company} · {info.role} · {info.roundName}</p>
          <h1 className="serif rise d1" style={{ fontSize: "clamp(42px, 8vw, 68px)", lineHeight: 1.02 }}>
            Your {info.roundName.toLowerCase()}, <span className="ital">rehearsed.</span>
          </h1>
          <p className="rise d2">
            {who} will interview you. Questions are spoken aloud and shown on screen. You {mode === "voice" ? "answer out loud" : "type your answers"}.
          </p>
        </div>

        {info.expects.length > 0 && (
          <div className="card soft rise d2" style={{ padding: "22px 26px", display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
            <span className="eyebrow">This round expects</span>
            {info.expects.map((e) => <span key={e} className="tag web" style={{ whiteSpace: "normal" }}>{e}</span>)}
          </div>
        )}

        <div className="rise d3" role="group" aria-labelledby="len-label" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <span className="eyebrow" id="len-label">Length</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {LENGTHS.map((m) => (
              <button key={m} type="button" className={`choice${minutes === m ? " on" : ""}`} aria-pressed={minutes === m} onClick={() => setMinutes(m)}>
                {m} min · {questionCount(m)} questions
              </button>
            ))}
          </div>
        </div>

        <div className="rise d4" role="group" aria-labelledby="mode-label" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <span className="eyebrow" id="mode-label">Answer by</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" className={`choice${mode === "voice" ? " on" : ""}`} aria-pressed={mode === "voice"} disabled={!voiceOk} onClick={() => setPicked("voice")}>Voice</button>
            <button type="button" className={`choice${mode === "typing" ? " on" : ""}`} aria-pressed={mode === "typing"} onClick={() => setPicked("typing")}>Typing</button>
          </div>
        </div>

        <div className="card rise d5" style={{ padding: 28, display: "flex", gap: 28, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 240px" }} aria-live="polite">
            <span className="eyebrow">Microphone check</span>
            {mode === "voice" ? (
              <>
                <span className="serif" style={{ fontSize: 26 }}>{heard ? "We can hear you." : "Say a few words."}</span>
                <span style={{ fontSize: 14 }}>Tip: use headphones so the interviewer’s voice is not picked up.</span>
              </>
            ) : blocked ? (
              <>
                <span className="serif" style={{ fontSize: 26 }}>We cannot use your microphone.</span>
                <span style={{ fontSize: 14 }}>
                  You will type your answers. To answer by voice, click the lock or microphone icon in the address bar, allow the microphone for this site, then reload the page.
                </span>
              </>
            ) : recognition === false ? (
              <>
                <span className="serif" style={{ fontSize: 26 }}>This browser cannot write down speech.</span>
                <span style={{ fontSize: 14 }}>You will type your answers. Voice works in Chrome, Edge, and Safari.</span>
              </>
            ) : (
              <>
                <span className="serif" style={{ fontSize: 26 }}>You will type your answers.</span>
                <span style={{ fontSize: 14 }}>The microphone stays off. Questions are still read aloud.</span>
              </>
            )}
          </div>
          {checking && (
            <div className="lvl" ref={bars} aria-label="Microphone level" role="img">
              {Array.from({ length: BARS }, (_, i) => <i key={i} style={{ animation: "none", transform: "scaleY(0.12)", transition: "transform 80ms linear" }} />)}
            </div>
          )}
        </div>

        <div className="rise d6" style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          <button type="button" className="btn" disabled={busy || recognition === null || (mode === "voice" && !heard)} onClick={() => onBegin(minutes, mode)}>
            {busy ? "Preparing your interviewer" : <>Begin interview <span className="arr" aria-hidden="true">→</span></>}
          </button>
          <span style={{ fontSize: 14 }}>
            {mode === "voice" && !heard ? "Begin opens when the microphone check hears you." : "You can pause or end at any time."}
          </span>
        </div>
        {error && <p className="err" role="alert">{error}</p>}
      </section>
    </div>
  );
}
