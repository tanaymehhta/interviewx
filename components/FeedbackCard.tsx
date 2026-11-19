import type { ReactNode } from "react";
import type { Feedback } from "@/lib/schemas";
import { Bar, Card, Eyebrow, RoundFitList } from "@/components/ui";

/** Text with [placeholders] highlighted: facts the person still has to confirm. */
export function WithPlaceholders({ text }: { text: string }) {
  return <>{text.split(/(\[[^\]]+\])/g).map((part, i) => (/^\[[^\]]+\]$/.test(part) ? <span key={i} className="ph">{part}</span> : part))}</>;
}

const MARK_CLASS = { keep: "keep", cut: "cut", tighten: "tight" } as const;
const SUBS = [["Structure", "structure"], ["Relevance", "relevance"], ["Impact", "impact"], ["Delivery", "delivery"]] as const;

/**
 * Feedback for one answer: score, four sub-scores, the answer with keep/cut/tighten marks,
 * strengths, improvements, and the upgraded answer. `feedback` null means scoring failed.
 */
export function FeedbackCard({ feedback, onRetry, retrying, footer, bare }: {
  feedback: Feedback | null;
  onRetry?: () => void;
  retrying?: boolean;
  footer?: ReactNode;
  /** Without the outer card border, for use inside an expanded row. */
  bare?: boolean;
}) {
  const wrap = (children: ReactNode) =>
    bare ? <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>{children}</div>
      : <Card style={{ marginTop: 10, padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>{children}</Card>;

  if (!feedback) {
    return wrap(
      <>
        <p className="ink">We saved your answer but could not score it. Your scorecard did not change.</p>
        {onRetry && <div><button type="button" className="btn ghost sm" onClick={onRetry} disabled={retrying}>{retrying ? "Scoring" : "Try scoring again"}</button></div>}
      </>,
    );
  }
  return wrap(
    <>
      <div style={{ display: "flex", gap: 32, alignItems: "end", flexWrap: "wrap" }}>
        <div><span className="serif num" style={{ fontSize: 64, lineHeight: 1 }}>{feedback.overall.toFixed(1)}</span><span style={{ fontSize: 14 }}> / 10</span></div>
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }}>
          {SUBS.map(([label, key]) => (
            <div key={key}>
              <p style={{ fontSize: 12 }}>{label}</p>
              <p className="serif num" style={{ fontSize: 26 }}>{feedback[key]}</p>
              <Bar value={feedback[key]} max={10} garnet={feedback[key] < 5} />
            </div>
          ))}
        </div>
      </div>
      <p className="ink" style={{ fontSize: 15 }}>{feedback.summary}</p>

      <details>
        <summary className="tlink" style={{ display: "inline", fontSize: 14 }}>Your answer, marked</summary>
        <p className="ink" style={{ fontSize: 16, lineHeight: 1.85, paddingTop: 12 }}>
          {feedback.sentences.map((s, i) => <span key={i}><span className={MARK_CLASS[s.mark]}>{s.text}</span>{" "}</span>)}
        </p>
        <div style={{ display: "flex", gap: 18, fontSize: 13, flexWrap: "wrap", paddingTop: 8 }}>
          <span className="keep">keep</span><span className="cut">cut</span><span className="tight">tighten</span>
        </div>
      </details>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Eyebrow className="olive">Strengths</Eyebrow>
          {feedback.strengths.map((s, i) => <p key={i} className="ink" style={{ fontSize: 15 }}>{i + 1}. {s.point}</p>)}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Eyebrow className="garnet">Improvements</Eyebrow>
          {feedback.improvements.map((s, i) => <p key={i} className="ink" style={{ fontSize: 15 }}>{i + 1}. {s.point}</p>)}
        </div>
      </div>

      <Card soft style={{ padding: 22, display: "flex", flexDirection: "column", gap: 10 }}>
        <Eyebrow>Upgraded answer</Eyebrow>
        <p className="ink" style={{ fontSize: 16, lineHeight: 1.8 }}><WithPlaceholders text={feedback.upgraded} /></p>
        {feedback.placeholders.length > 0 && <p style={{ fontSize: 12 }}>Highlighted parts are facts to confirm. We never invent numbers.</p>}
      </Card>

      {feedback.round_fit.length > 0 && (
        <details>
          <summary className="tlink" style={{ display: "inline", fontSize: 14 }}>Round fit for this answer</summary>
          <div style={{ paddingTop: 12 }}><RoundFitList items={feedback.round_fit} /></div>
        </details>
      )}
      {footer && <p style={{ fontSize: 13 }}>{footer}</p>}
    </>,
  );
}
