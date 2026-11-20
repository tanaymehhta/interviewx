// Small pieces shared by the jobs screens. No hooks, so server and client components can both use them.
import type { Criterion, Fact, Requirement } from "@/lib/schemas";
import type { Outcome } from "@/lib/coach";
import { FIT_WORD, SourceTag } from "@/components/ui";

/** Heading text with the last word as the garnet italic accent, as in the mock. */
export function AccentLast({ text }: { text: string }) {
  const words = text.trim().split(/\s+/);
  const last = words.pop();
  return <>{words.join(" ")}{words.length ? " " : ""}<span className="ital">{last}</span></>;
}

export const OUTCOMES: Outcome[] = ["waiting", "advanced", "offer", "rejected", "withdrew"];
export const OUTCOME_LABEL: Record<string, string> = {
  waiting: "Waiting", advanced: "Advanced", offer: "Offer", rejected: "Rejected", withdrew: "Withdrew",
};
export const STATUS_LABEL: Record<string, string> = {
  preparing: "Preparing", offer: "Offer", rejected: "Rejected", withdrawn: "Withdrawn",
};

export const inDays = (n: number) => (n === 0 ? "today" : n === 1 ? "tomorrow" : n > 1 ? `in ${n} days` : n === -1 ? "yesterday" : `${-n} days ago`);

export const roundMeta = (r: { format: string | null; length_minutes: number | null; interviewer_type?: string | null }) =>
  [r.format, r.length_minutes ? `${r.length_minutes} min` : null, r.interviewer_type].filter(Boolean).join(" · ");

/** Source tag, or "Edited by you" once the person has changed the item. */
export const FactTag = ({ fact }: { fact: Fact }) =>
  fact.edited ? <span className="tag">Edited by you</span> : <SourceTag fact={fact} />;

export function FactRows({ facts }: { facts: Fact[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {facts.map((f, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
          <span className="ink">{f.text}</span><FactTag fact={f} />
        </div>
      ))}
    </div>
  );
}

const FIT_COLOR = { met: "var(--olive)", partly: "var(--stone)", missing: "var(--garnet)" } as const;
/** Job requirements, each checked against the resume. */
export function RequirementRows({ items }: { items: Requirement[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {items.map((q, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
            <span className="ink">{q.text}</span><SourceTag fact={q} />
          </span>
          <span style={{ fontSize: 14 }}><span style={{ color: FIT_COLOR[q.status], fontWeight: 400 }}>{FIT_WORD[q.status]}</span>{q.note ? ` · ${q.note}` : ""}</span>
        </div>
      ))}
    </div>
  );
}

/** A round's scorecard: what is scored, and what a strong answer shows. */
export function CriterionRows({ items }: { items: Criterion[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {items.map((c, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
            <span className="ink" style={{ fontWeight: 400 }}>{c.criterion}</span><SourceTag fact={c} />
          </span>
          <span style={{ fontSize: 14 }}>{c.strong}</span>
        </div>
      ))}
    </div>
  );
}
