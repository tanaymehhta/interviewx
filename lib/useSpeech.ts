"use client";
// Browser voice in one hook (design.md decision 6): speech recognition with interim and final
// words, speech output, and the rule that the microphone is off while the interviewer speaks.
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
  useEffect(() => { optsRef.current = opts; });

  useEffect(() => {
    // Feature detection has to wait for the browser; the server render shows the neutral state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupport({ recognition: !!getRecognition(), synthesis: "speechSynthesis" in window });
    if ("speechSynthesis" in window) window.speechSynthesis.getVoices(); // voices load asynchronously
    return () => {
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

  /** Speaks text. The microphone is off until the last word ends. Resolves when speech ends. */
  const speak = useCallback((text: string, onStart?: () => void): Promise<void> =>
    new Promise((resolve) => {
      if (!("speechSynthesis" in window) || !text.trim()) { onStart?.(); resolve(); return; }
      const resume = want.current;
      speakingRef.current = true;
      setSpeaking(true);
      try { rec.current?.abort(); } catch {}
      window.speechSynthesis.cancel();
      // Chrome cuts long utterances, so speak sentence by sentence.
      const parts = text.match(/[^.!?]+[.!?]*/g)?.map((s) => s.trim()).filter(Boolean) ?? [text];
      const voice = pickVoice();
      let started = false;
      const done = () => {
        speakingRef.current = false;
        setSpeaking(false);
        if (resume && want.current) startRecognition();
        resolve();
      };
      // Safety net: some browsers never fire `end` (tab in background, voice missing).
      const guard = setTimeout(done, 4000 + text.length * 90);
      parts.forEach((p, i) => {
        const u = new SpeechSynthesisUtterance(p);
        if (voice) u.voice = voice;
        u.lang = voice?.lang ?? "en-US";
        u.rate = 1;
        u.onstart = () => { if (!started) { started = true; onStart?.(); } };
        if (i === parts.length - 1) u.onend = u.onerror = () => { clearTimeout(guard); if (!started) onStart?.(); done(); };
        window.speechSynthesis.speak(u);
      });
    }), [startRecognition]);

  const cancelSpeech = useCallback(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
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
