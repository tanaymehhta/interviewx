// Full interview helpers shared by the setup screen, the API routes, and the results page. Pure, no I/O.
import type { RoundFit } from "@/lib/schemas";

export const LENGTHS = [15, 30, 45] as const;
export type Mode = "voice" | "typing";

/** About one main question per five minutes: 3, 6, or 9. */
export const questionCount = (minutes: number) => Math.round(minutes / 5);

/**
 * One entry for every expectation of the round, in the round's order and wording.
 * The model's entry is matched by text, then by position; anything it skipped counts as missing.
 */
export function fitForRound(expects: string[], model: RoundFit): RoundFit {
  if (!expects.length) return model;
  const norm = (s: string) => s.trim().toLowerCase();
  return expects.map((expectation, i) => {
    const m = model.find((f) => norm(f.expectation) === norm(expectation)) ?? (model.length === expects.length ? model[i] : undefined);
    return { expectation, status: m?.status ?? "missing", note: m?.note ?? "Not covered" };
  });
}

type Score = { criterion: string; score: number; note: string };
/** One score for every criterion of the round scorecard, in its order and wording. A skipped criterion scores 0. */
export function scoresForRound(criteria: string[], model: Score[]): Score[] {
  const norm = (s: string) => s.trim().toLowerCase();
  return criteria.map((criterion, i) => {
    const m = model.find((c) => norm(c.criterion) === norm(criterion)) ?? (model.length === criteria.length ? model[i] : undefined);
    return { criterion, score: Math.min(10, Math.max(0, Math.round(m?.score ?? 0))), note: m?.note ?? "Not covered" };
  });
}

/** Complete when every planned question was asked, or the chosen length ran out. Otherwise it ended early. */
export function endStatus(s: { asked: number; planned: number; startedAt: string; lastAnswerAt: string; lengthMinutes: number | null }) {
  // ponytail: wall clock, so a long Pause followed by End interview can count as complete; store paused seconds if that matters.
  const timeUp = s.lengthMinutes != null && Date.parse(s.lastAnswerAt) - Date.parse(s.startedAt) >= s.lengthMinutes * 60_000;
  return s.asked >= s.planned || timeUp ? "complete" : "incomplete";
}
