"use client";
// Voice in one hook (design.md decision 6): browser speech recognition with interim and final
// words, the interviewer's voice from Fish Audio (browser voice as fallback), and the rule that
// the microphone is off while the interviewer speaks.
import { useCallback, useEffect, useRef, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any -- SpeechRecognition has no standard DOM types */
type Recognition = any;

const getRecognition = (): (new () => Recognition) | null =>
  typeof window === "undefined" ? null : (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition ?? null;

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en"));
  const prefer = ["Google US English", "Samantha", "Microsoft Aria", "Microsoft Jenny", "Google UK English Female", "Karen", "Daniel"];
  for (const name of prefer) {
    const v = voices.find((x) => x.name.includes(name));
    if (v) return v;
  }
  return voices.find((v) => v.lang === "en-US") ?? voices[0] ?? null;
}

export type SpeechOptions = {
  /** Call mode: fires once when the person has said `minWords` and then is silent for `ms`. */
  onSilence?: () => void;
  silenceMs?: number;
  minWords?: number;
};

export function useSpeech(opts: SpeechOptions = {}) {
  const [support, setSupport] = useState<{ recognition: boolean; synthesis: boolean } | null>(null);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [finalText, setFinalText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [denied, setDenied] = useState(false);

  const rec = useRef<Recognition | null>(null);
  const want = useRef(false); // an answer is open: restart recognition whenever the browser ends it
  const speakingRef = useRef(false);
  const finalRef = useRef("");
  const interimRef = useRef("");
  const lastHeard = useRef(0);
  const optsRef = useRef(opts);
  const restart = useRef<() => void>(() => {});
  const audio = useRef<HTMLAudioElement | null>(null);
  const speakTurn = useRef(0);
  useEffect(() => { optsRef.current = opts; });

  useEffect(() => {
    // Feature detection has to wait for the browser; the server render shows the neutral state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupport({ recognition: !!getRecognition(), synthesis: true });
    if ("speechSynthesis" in window) window.speechSynthesis.getVoices(); // voices load asynchronously
    // One audio element for the interviewer's voice. Phones only allow sound that starts from a
    // tap, and speech here starts after a network call, so the first tap plays a silent clip to unlock it.
    const el = new Audio();
    audio.current = el;
    const SILENCE = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
    const unlock = () => { if (el.paused && !el.src) { el.src = SILENCE; el.play().catch(() => {}); } };
    document.addEventListener("pointerdown", unlock, { once: true });
    return () => {
      document.removeEventListener("pointerdown", unlock);
      el.pause();
      want.current = false;
      try { rec.current?.abort(); } catch {}
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  const startRecognition = useCallback(() => {
    const Ctor = getRecognition();
    if (!Ctor || speakingRef.current) return;
    const r = new Ctor();
    r.continuous = true;
    r.interimResults = true;
    r.lang = "en-US";
    r.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalRef.current = `${finalRef.current} ${t.trim()}`.trim();
        else interim += t;
      }
      interimRef.current = interim.trim();
      lastHeard.current = Date.now();
      setFinalText(finalRef.current);
      setInterimText(interimRef.current);
    };
    r.onerror = (e: any) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        want.current = false;
        setDenied(true);
      }
    };
    r.onend = () => {
      // Chrome ends recognition after silence or about a minute. Keep words it had not settled yet.
      if (interimRef.current) {
        finalRef.current = `${finalRef.current} ${interimRef.current}`.trim();
        interimRef.current = "";
        setFinalText(finalRef.current);
        setInterimText("");
      }
      if (want.current && !speakingRef.current) setTimeout(() => restart.current(), 150);
      else setListening(false);
    };
    rec.current = r;
    try { r.start(); setListening(true); } catch { /* already started */ }
  }, []);
  useEffect(() => { restart.current = startRecognition; }, [startRecognition]);

  /** Opens an answer. Keeps any text already there unless `fresh`. */
  const listen = useCallback((fresh = true) => {
    if (fresh) {
      finalRef.current = ""; interimRef.current = "";
      setFinalText(""); setInterimText("");
    }
    want.current = true;
    lastHeard.current = Date.now();
    startRecognition();
  }, [startRecognition]);

  /** Closes the answer and returns everything heard. */
  const stop = useCallback((): string => {
    want.current = false;
    const text = `${finalRef.current} ${interimRef.current}`.trim();
    interimRef.current = "";
    finalRef.current = text;
    setFinalText(text); setInterimText("");
    try { rec.current?.stop(); } catch {}
    setListening(false);
    return text;
  }, []);

  /** Browser voice: the fallback when the server voice is not available. */
  const speakWithBrowser = useCallback((text: string, onStart: () => void, done: () => void) => {
    if (!("speechSynthesis" in window)) { onStart(); done(); return; }
    window.speechSynthesis.cancel();
    // Chrome cuts long utterances, so speak sentence by sentence.
    const parts = text.match(/[^.!?]+[.!?]*/g)?.map((s) => s.trim()).filter(Boolean) ?? [text];
    const voice = pickVoice();
    let started = false;
    // Safety net: some browsers never fire `end` (tab in background, voice missing).
    const guard = setTimeout(done, 4000 + text.length * 90);
    parts.forEach((p, i) => {
      const u = new SpeechSynthesisUtterance(p);
      if (voice) u.voice = voice;
      u.lang = voice?.lang ?? "en-US";
      u.onstart = () => { if (!started) { started = true; onStart(); } };
      if (i === parts.length - 1) u.onend = u.onerror = () => { clearTimeout(guard); if (!started) onStart(); done(); };
      window.speechSynthesis.speak(u);
    });
  }, []);

  /**
   * Speaks text in the interviewer's voice (Fish Audio through /api/speak, browser voice as the
   * fallback). The microphone is off until the last word ends. Resolves when speech ends.
   */
  const speak = useCallback((text: string, onStart?: () => void): Promise<void> =>
    new Promise((resolve) => {
      if (!text.trim()) { onStart?.(); resolve(); return; }
      const resume = want.current;
      const turn = ++speakTurn.current;
      speakingRef.current = true;
      setSpeaking(true);
      try { rec.current?.abort(); } catch {}
      let finished = false;
      const done = () => {
        if (finished) return;
        finished = true;
        if (turn === speakTurn.current) {
          speakingRef.current = false;
          setSpeaking(false);
          if (resume && want.current) startRecognition();
        }
        resolve();
      };
      const start = () => onStart?.();
      const el = audio.current;
      if (!el) { speakWithBrowser(text, start, done); return; }
      fetch("/api/speak", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }), signal: AbortSignal.timeout(8000) })
        .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
        .then((blob) => {
          if (turn !== speakTurn.current) { done(); return; } // cancelled while loading
          const url = URL.createObjectURL(blob);
          const end = () => { el.onended = el.onerror = el.onplaying = null; URL.revokeObjectURL(url); done(); };
          el.onplaying = start;
          el.onended = end;
          el.onerror = end;
          el.src = url;
          return el.play();
        })
        .catch(() => { if (!finished) speakWithBrowser(text, start, done); });
    }), [startRecognition, speakWithBrowser]);

  const cancelSpeech = useCallback(() => {
    speakTurn.current++;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    const el = audio.current;
    if (el && !el.paused) { el.pause(); el.dispatchEvent(new Event("ended")); }
    speakingRef.current = false;
    setSpeaking(false);
  }, []);

  // Silence turn-taking for Call.
  useEffect(() => {
    const id = setInterval(() => {
      const o = optsRef.current;
      if (!o.onSilence || !want.current || speakingRef.current) return;
      const words = `${finalRef.current} ${interimRef.current}`.trim().split(/\s+/).filter(Boolean).length;
      if (words >= (o.minWords ?? 15) && Date.now() - lastHeard.current >= (o.silenceMs ?? 3000)) {
        lastHeard.current = Date.now();
        o.onSilence();
      }
    }, 250);
    return () => clearInterval(id);
  }, []);

  return {
    /** null until checked in the browser */
    support,
    voiceReady: !!support?.recognition && !!support?.synthesis,
    listening, speaking, denied, finalText, interimText,
    listen, stop, speak, cancelSpeech,
  };
}
