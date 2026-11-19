// Where a chat action button goes. No imports, so `node --test` can run the check beside it.

export type ActionLike = { type: "single" | "full" | "scorecard"; topic?: string | null; round_id?: string | null };

/**
 * `rounds` maps every round id the person owns to its job id. A round id the model made up is
 * ignored and the focus round is used. Returns null when there is no round to open.
 */
export function actionHref(a: ActionLike, rounds: Record<string, string>, focusRoundId: string | null): string | null {
  const roundId = a.round_id && rounds[a.round_id] ? a.round_id : focusRoundId;
  if (!roundId || !rounds[roundId]) return null;
  const base = `/jobs/${rounds[roundId]}/${roundId}`;
  if (a.type === "single") return `${base}/practice${a.topic ? `?q=${encodeURIComponent(a.topic)}` : ""}`;
  return a.type === "full" ? `${base}/interview` : `${base}/scorecard`;
}
