// Deterministic coaching logic (design.md decision 5). Pure functions, no I/O.
// Dates are 'YYYY-MM-DD' strings in the person's local calendar.

export type Tool = 'single' | 'call' | 'full';
export type Outcome = 'waiting' | 'advanced' | 'offer' | 'rejected' | 'withdrew';
export type JobStatus = 'preparing' | 'offer' | 'rejected' | 'withdrawn';

export type SkillLike = { id: string; score: number; last_practiced_at: string | null };
export type SubScores = { structure: number; relevance: number; impact: number; delivery: number };
export type PlanDay = { day: string; skill_id: string | null; tool: Tool; minutes: number; done: boolean };

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

// ---- scores

/** Job skill after one scored answer: round(0.7 x old + 0.3 x overall x 10). */
export const updateSkill = (old: number, overall: number) => Math.round(0.7 * old + 0.3 * overall * 10);

/** Four overall skills, 0-100: mean of each sub-score over the last 10 answers (pass newest first). */
export function overallSkills(newestFirst: SubScores[]): SubScores | null {
  const last = newestFirst.slice(0, 10);
  if (!last.length) return null;
  const of = (k: keyof SubScores) => Math.round(mean(last.map((a) => a[k])) * 10);
  return { structure: of('structure'), relevance: of('relevance'), impact: of('impact'), delivery: of('delivery') };
}

/** Rounded mean of the skills a round tests. */
export const roundReadiness = (scores: number[]) => (scores.length ? Math.round(mean(scores)) : 0);

export const isEarlyEstimate = (scoredAnswersForJob: number) => scoredAnswersForJob < 5;

/** Lowest score; ties go to the least recently practiced (never practiced counts as oldest). */
export function weakestSkill<T extends SkillLike>(skills: T[]): T | null {
  const t = (s: SkillLike) => (s.last_practiced_at ? Date.parse(s.last_practiced_at) : 0);
  return [...skills].sort((a, b) => a.score - b.score || t(a) - t(b))[0] ?? null;
}

export const difficultyBand = (score: number) =>
  score < 50 ? 'foundational' : score < 75 ? 'standard' : 'pressure';

// ---- delivery

const FILLERS = /\b(um+|uh+|like|you know|basically|actually)\b/gi;
export const countFillers = (text: string) => text.match(FILLERS)?.length ?? 0;
export const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

/** Target answer time in seconds: 2:00 behavioral, 3:00 case or technical. */
export const targetSeconds = (questionType: string) => (/case|technical/i.test(questionType) ? 180 : 120);

/**
 * Delivery sub-score 0-10 from length against the target, pace, and filler words.
 * Typed answers have no seconds; length is then judged from words at 150 wpm.
 */
export function deliveryScore(a: { text: string; seconds?: number | null; targetSeconds: number }): number {
  const words = countWords(a.text);
  if (!words) return 0;
  const spoken = !!a.seconds && a.seconds >= 10;
  const ratio = spoken ? a.seconds! / a.targetSeconds : words / (a.targetSeconds * 2.5);
  let score = 10;
  if (ratio < 0.25) score -= 4;
  else if (ratio < 0.5) score -= 2;
  else if (ratio > 1.5) score -= 2;
  else if (ratio > 1.25) score -= 1;
  if (spoken) {
    const wpm = (words / a.seconds!) * 60;
    if (wpm < 80 || wpm > 200) score -= 2;
    else if (wpm < 100 || wpm > 180) score -= 1;
  }
  score -= Math.min(4, (countFillers(a.text) / words) * 100 * 0.8);
  return clamp(Math.round(score), 0, 10);
}

/** Session numbers for the results screen. */
export function sessionDelivery(answers: { text: string; seconds?: number | null }[]) {
  const talkSeconds = answers.reduce((s, a) => s + (a.seconds ?? 0), 0);
  const words = answers.reduce((s, a) => s + countWords(a.text), 0);
  return {
    talkSeconds,
    wpm: talkSeconds ? Math.round((words / talkSeconds) * 60) : 0,
    fillers: answers.reduce((s, a) => s + countFillers(a.text), 0),
    longestSeconds: Math.max(0, ...answers.map((a) => a.seconds ?? 0)),
  };
}

// ---- rounds

/** The active round is the first one not yet advanced past. */
export function activeRound<T extends { position: number; outcome: string | null }>(rounds: T[]): T | null {
  const sorted = [...rounds].sort((a, b) => a.position - b.position);
  return sorted.find((r) => r.outcome !== 'advanced') ?? sorted.at(-1) ?? null;
}

/** Job status after logging an outcome. Advanced and Waiting keep the job open. */
export function jobStatusAfter(outcome: Outcome): JobStatus {
  if (outcome === 'offer') return 'offer';
  if (outcome === 'rejected') return 'rejected';
  if (outcome === 'withdrew') return 'withdrawn';
  return 'preparing';
}

// ---- dates

const toUTC = (d: string) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
export const addDays = (d: string, n: number) => new Date(toUTC(d) + n * 86400000).toISOString().slice(0, 10);
export const daysBetween = (from: string, to: string) => Math.round((toUTC(to) - toUTC(from)) / 86400000);
/** Local calendar date of a Date as 'YYYY-MM-DD'. */
export const localDate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// ---- plan

const MINUTES: Record<Tool, number> = { single: 15, call: 10, full: 30 };

/** Weakest skill on every other day, the rest in ascending score order between. */
function skillFor(i: number, ordered: SkillLike[]): string | null {
  if (!ordered.length) return null;
  if (i % 2 === 0 || ordered.length === 1) return ordered[0].id;
  const rest = ordered.slice(1);
  return rest[((i - 1) / 2) % rest.length].id;
}

const byWeakest = (skills: SkillLike[]) => {
  const out: SkillLike[] = [];
  let left = [...skills];
  while (left.length) {
    const w = weakestSkill(left)!;
    out.push(w);
    left = left.filter((s) => s.id !== w.id);
  }
  return out;
};

/**
 * Practice days from today to the day before the round. The round date itself is the interview
 * and is not a practice day. Last practice day is a Full interview.
 */
export function buildPlan(today: string, roundDate: string, skills: SkillLike[]): PlanDay[] {
  const span = daysBetween(today, roundDate);
  if (span <= 0) return [];
  // ponytail: spans over 13 days are sampled to 13 evenly spaced entries (14 with the interview);
  // store a day range per entry if grouped days must be shown as ranges.
  const n = Math.min(span, 13);
  const ordered = byWeakest(skills);
  return Array.from({ length: n }, (_, i) => {
    const last = i === n - 1;
    const tool: Tool = last ? 'full' : i % 3 === 1 ? 'call' : 'single';
    const offset = n === span ? i : last ? span - 1 : Math.floor((i * span) / n);
    return { day: addDays(today, offset), skill_id: last ? ordered[0]?.id ?? null : skillFor(i, ordered), tool, minutes: MINUTES[tool], done: false };
  });
}

/** Re-assigns skills on days that are not done and not in the past. Completed days stay as they are. */
export function replan<T extends PlanDay>(days: T[], today: string, skills: SkillLike[]): T[] {
  const ordered = byWeakest(skills);
  let i = 0;
  return [...days]
    .sort((a, b) => a.day.localeCompare(b.day))
    .map((d) => {
      if (d.done || d.day < today) return d;
      const skill_id = d.tool === 'full' ? ordered[0]?.id ?? null : skillFor(i, ordered);
      i++;
      return { ...d, skill_id };
    });
}

// ---- calendar

const icsEscape = (s: string) => s.replace(/([\\;,])/g, '\\$1').replace(/\n/g, '\\n');

/** One event per day at a local ("floating") time, so it shows at that time on any device. */
export function buildIcs(
  events: { day: string; minutes: number; title: string; description?: string }[],
  time: string, // 'HH:MM'
  url: string,
): string {
  const [h, m] = time.split(':').map(Number);
  const stamp = new Date().toISOString().replace(/[-:]|\.\d+/g, '');
  const at = (day: string, mins: number) => {
    const t = new Date(toUTC(day) + (h * 60 + m + mins) * 60000);
    return t.toISOString().replace(/[-:]|\.\d+|Z/g, '');
  };
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//InterviewX//Plan//EN', 'CALSCALE:GREGORIAN'];
  events.forEach((e, i) => {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.day}-${i}-${stamp}@interviewx`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${at(e.day, 0)}`,
      `DTEND:${at(e.day, e.minutes)}`,
      `SUMMARY:${icsEscape(e.title)}`,
      `DESCRIPTION:${icsEscape((e.description ? e.description + '\n' : '') + url)}`,
      `URL:${url}`,
      'END:VEVENT',
    );
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}
