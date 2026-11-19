// Thread rules shared by the practice page, its client component, and POST /api/single. No I/O.
import type { Card, Fact } from "@/lib/schemas";

export type Msg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  card: Card | null;
  answerId?: string | null;
  /** Set for spoken answers. */
  seconds?: number | null;
};

type Question = Extract<Card, { type: "question" }>["question"];

/**
 * The question the next message answers: the latest question card that has no feedback card
 * after it. A hint or a "too short" reply keeps the question open.
 */
export function pendingQuestion(msgs: Pick<Msg, "card">[]): Question | null {
  for (let i = msgs.length - 1; i >= 0; i--) {
    const card = msgs[i].card;
    if (card?.type === "feedback") return null;
    if (card?.type === "question") return card.question;
  }
  return null;
}

export type Suggestion = { label: string; text: string };

/** Up to four: the weakest skill, the round's question types, and questions from real rounds. */
export function suggestions(weakest: string | null, asks: Fact[], asked: string[]): Suggestion[] {
  const weak: Suggestion[] = weakest ? [{ label: `A question on ${weakest}`, text: `Ask me a question on ${weakest}.` }] : [];
  const fromAsks = asks.map((f) => ({ label: f.text, text: `Ask me: ${f.text}` }));
  const fromAsked = asked.map((q) => ({ label: `Asked in your real round: “${q}”`, text: `Ask me: ${q}` }));
  return [...weak, ...fromAsks.slice(0, 2), ...fromAsked.slice(0, 1), ...fromAsks.slice(2), ...fromAsked.slice(1)].slice(0, 4);
}
