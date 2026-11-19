"use client";
import { useEffect, useRef, useState } from "react";
import { FeedbackCard, WithPlaceholders } from "@/components/FeedbackCard";
import { Card, Eyebrow, SwotGrid, Turn, fmtTime } from "@/components/ui";
import { useSpeech } from "@/lib/useSpeech";
import { pendingQuestion, type Msg, type Suggestion } from "./thread";

const CSS = `
.sug{transition:border-color 150ms ease-out,background-color 150ms ease-out,scale 150ms ease-out}
.sug:hover:not(:disabled){border-color:var(--ink);background:var(--ivory)}
.sug:active:not(:disabled){scale:.96}
.sug:disabled{opacity:.45;cursor:not-allowed}
.dots span{display:inline-block;width:5px;height:5px;border-radius:50%;background:var(--stone);margin-right:4px;animation:bob 1s ease-in-out infinite}
.dots span:nth-child(2){animation-delay:150ms}.dots span:nth-child(3){animation-delay:300ms}
@keyframes bob{50%{transform:translateY(-4px);opacity:.5}}
.mic{transition:background-color 150ms ease-out,scale 150ms ease-out}.mic:active{scale:.96}
`;

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const post = (url: string, body: unknown) =>
  fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const FAILED = "That did not go through. Try again.";

export function PracticeThread({ jobId, roundId, roundName, initial, suggestions, skills, autoSend }: {
  jobId: string;
  roundId: string;
  roundName: string;
  initial: Msg[];
  suggestions: Suggestion[];
  skills: { id: string; name: string }[];
  /** A request to send once on open (from ?skill=). */
  autoSend?: string;
}) {
  const [msgs, setMsgs] = useState(initial);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [notAnswer, setNotAnswer] = useState(false);
  const [error, setError] = useState("");
  const [spoken, setSpoken] = useState(0); // seconds of speech in the current draft
  const speech = useSpeech();
  const [base, setBase] = useState(""); // draft text from before the microphone was opened
  const startedAt = useRef(0);
  const end = useRef<HTMLDivElement>(null);
  const opened = useRef(false);

  const pending = pendingQuestion(msgs);
  const scored = !!pending && !notAnswer;
  const heard = (text: string) => `${base} ${text}`.trim();

  useEffect(() => { if (msgs.length) end.current?.scrollIntoView({ block: "end" }); }, [msgs.length, busy]);

  async function send(text: string, opts: { request?: boolean; seconds?: number } = {}) {
    text = text.trim();
    if (!text || busy) return;
    const question = opts.request || notAnswer ? null : pending;
    const mine: Msg = { id: crypto.randomUUID(), role: "user", content: text, card: null, seconds: question ? opts.seconds : null };
    const fail = (message: string) => {
      setMsgs((m) => m.filter((x) => x.id !== mine.id));
      if (!opts.request) setDraft(text);
      setError(message);
    };
    setMsgs((m) => [...m, mine]);
    setDraft(""); setSpoken(0); setError(""); setNotAnswer(false); setBusy(true);
    try {
      let res: Response;
      if (question) {
        const scoredRes = await post("/api/feedback", {
          jobId, roundId, tool: "single", question: question.text.slice(0, 1000), questionType: question.type.slice(0, 40),
          skillId: skills.find((s) => s.name === question.skill)?.id, text, seconds: opts.seconds || undefined,
        });
        const data = await scoredRes.json().catch(() => null);
        // 200 and 502 both carry answerId: the answer is saved either way.
        if (!data?.answerId) return fail(data?.error ?? FAILED);
        res = await post("/api/single", { mode: "answer", jobId, roundId, answerId: data.answerId });
      } else {
        res = await post("/api/single", { jobId, roundId, text, notAnswer: !!pending });
      }
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.message) return question ? setError(data?.error ?? FAILED) : fail(data?.error ?? FAILED);
      setMsgs((m) => [...m, data.message]);
    } catch {
      fail(FAILED);
    } finally {
      setBusy(false);
    }
  }

  async function retry(m: Msg) {
    setRetrying(m.id); setError("");
    try {
      const scoredRes = await post("/api/feedback", { answerId: m.answerId });
      if (!scoredRes.ok) return;
      const res = await post("/api/single", { mode: "answer", jobId, roundId, answerId: m.answerId });
      const data = await res.json().catch(() => null);
      if (data?.message) setMsgs((all) => all.map((x) => (x.id === m.id ? data.message : x)));
    } catch {
      setError(FAILED);
    } finally {
      setRetrying(null);
    }
  }

  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    // Drop ?q= and ?skill= so a reload does not ask again.
    window.history.replaceState(null, "", window.location.pathname);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one request on open, from the link that led here
    if (autoSend) send(autoSend, { request: true });
  });

  const seconds = () => spoken + (speech.listening ? Math.round((Date.now() - startedAt.current) / 1000) : 0);
  function toggleMic() {
    if (speech.listening) {
      setSpoken(seconds());
      setDraft(heard(speech.stop()));
    } else {
      setBase(draft);
      startedAt.current = Date.now();
      speech.listen();
    }
  }
  function submit() {
    if (speech.listening) send(heard(speech.stop()), { seconds: seconds() });
    else send(draft, { seconds: spoken });
  }

  return (
    <>
      <style>{CSS}</style>
      <section style={{ display: "flex", flexDirection: "column" }} aria-live="polite">
        {msgs.map((m, i) => {
          const fresh = i >= initial.length ? " rise" : "";
          if (m.role === "user") {
            return (
              <Turn key={m.id} who={m.seconds ? `You · spoken · ${fmtTime(m.seconds)}` : "You"} className={fresh}>
                <p className="ink" style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{m.content}</p>
              </Turn>
            );
          }
          const card = m.card;
          if (card?.type === "question") {
            return (
              <Turn key={m.id} who="InterviewX" className={fresh}>
                <Card style={{ marginTop: 10, padding: 24, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span className="tag">{card.question.type}</span><span className="tag">{cap(card.question.difficulty)}</span>
                  </div>
                  <p className="serif" style={{ fontSize: 30, lineHeight: 1.2 }}>{card.question.text}</p>
                  <p style={{ fontSize: 14 }}>Why this question: {card.question.why}</p>
                </Card>
              </Turn>
            );
          }
          if (card?.type === "feedback") {
            return (
              <Turn key={m.id} who="InterviewX · feedback" className={fresh}>
                <FeedbackCard
                  feedback={card.feedback}
                  onRetry={m.answerId ? () => retry(m) : undefined}
                  retrying={retrying === m.id}
                  footer={card.skill && `Scorecard updated · ${card.skill.name} ${card.skill.before} → ${card.skill.after}`}
                />
              </Turn>
            );
          }
          if (card?.type === "swot") {
            return (
              <Turn key={m.id} who="InterviewX · story analysis · not scored" className={fresh}>
                <p className="ink" style={{ paddingTop: 6 }}>{card.swot.story}</p>
                <div style={{ marginTop: 10 }}><SwotGrid swot={card.swot.swot} compact /></div>
                <Card soft style={{ marginTop: 10, padding: 18 }}>
                  <Eyebrow>Suggested opening for the {roundName}</Eyebrow>
                  <p className="ink" style={{ fontSize: 15, paddingTop: 6 }}><WithPlaceholders text={card.swot.opening_line} /></p>
                </Card>
              </Turn>
            );
          }
          return (
            <Turn key={m.id} who="InterviewX" className={fresh}>
              <p className="ink" style={{ whiteSpace: "pre-wrap" }}>{m.content}</p>
            </Turn>
          );
        })}
        {busy && (
          <Turn who="InterviewX" className="rise">
            <span className="dots" role="status" aria-label="Writing"><span /><span /><span /></span>
          </Turn>
        )}
      </section>

      {suggestions.length > 0 && (
        <section className="rise d3" aria-label="Suggested questions" style={{ display: "flex", gap: 10, flexWrap: "wrap", padding: msgs.length ? "22px 0 28px" : "0 0 28px", borderTop: msgs.length ? "1px solid var(--hair)" : undefined }}>
          {suggestions.map((s) => (
            <button key={s.label} className="sug" type="button" disabled={busy} onClick={() => send(s.text, { request: true })}
              style={{ border: "1px solid var(--hair)", background: "var(--paper)", padding: "10px 16px", font: "inherit", fontSize: 14, color: "var(--ink)", cursor: "pointer", textAlign: "left" }}>
              {s.label}
            </button>
          ))}
        </section>
      )}
      <form onSubmit={(e) => { e.preventDefault(); submit(); }}
        style={{ position: "sticky", bottom: 0, background: "var(--paper)", padding: "20px 0 40px", borderTop: "1px solid var(--ink)", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "end" }}>
          {speech.support?.recognition && (
            <button className="mic" type="button" onClick={toggleMic} disabled={busy} aria-pressed={speech.listening}
              aria-label={speech.listening ? "Stop listening" : "Answer by voice"}
              style={{ width: 52, height: 52, borderRadius: "50%", border: "1px solid var(--ink)", background: speech.listening ? "var(--olive)" : "transparent", color: "var(--ink)", display: "grid", placeItems: "center", cursor: "pointer", flex: "none" }}>
              {speech.listening ? (
                <span className="lvl" style={{ height: 18 }}>
                  {[0, 150, 300].map((d) => <i key={d} style={{ animationDelay: `${d}ms`, background: "var(--on-olive)" }} />)}
                </span>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                  <rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
                </svg>
              )}
            </button>
          )}
          {speech.listening ? (
            // A textarea cannot show settled and unsettled words in two colours, so the live transcript is text.
            <p aria-live="off" style={{ flex: 1, minWidth: 0, minHeight: 86, margin: 0, padding: 14, border: "1px solid var(--olive)", fontSize: 17, lineHeight: 1.7, color: "var(--ink)", overflowWrap: "anywhere" }}>
              {heard(speech.finalText)} <span style={{ color: "var(--stone)" }}>{speech.interimText || (speech.finalText || base ? "" : "Listening")}</span>
            </p>
          ) : (
            <>
              <label htmlFor="sq-draft" className="sr">Your message</label>
              <textarea id="sq-draft" className="inp" rows={2} value={draft} style={{ flex: 1, minWidth: 0 }}
                placeholder={pending ? "Answer the question, or ask for another one" : "Ask for a question, or name a story for a SWOT"}
                onChange={(e) => { setDraft(e.target.value); if (!e.target.value) setSpoken(0); }}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit(); } }} />
            </>
          )}
          <button className="btn sm" type="submit" disabled={busy}>Send</button>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 13, alignItems: "center", flexWrap: "wrap" }}>
          {pending ? (
            <>
              <span>{scored ? "Your next message is scored as an answer." : "Your next message is not scored."}</span>
              <button className="tlink" type="button" style={{ fontSize: 13 }} aria-pressed={notAnswer} onClick={() => setNotAnswer(!notAnswer)}>
                {scored ? "Mark as not an answer" : "Score it as an answer"}
              </button>
            </>
          ) : <span>Ask for a question. Your answer to it is scored.</span>}
          {speech.denied && <span>The microphone is blocked in this browser. You can type your answer.</span>}
          {error && <span className="err" role="alert">{error}</span>}
        </div>
      </form>
      <div ref={end} />
    </>
  );
}
