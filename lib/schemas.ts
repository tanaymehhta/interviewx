// Shapes of every AI result and every jsonb column. The UI never parses prose.
// Counts are stated in descriptions, not as min/max, because the model's JSON mode ignores them.
import { z } from "zod";

export const Source = z.enum(["job_post", "web", "resume", "general"]);
export type Source = z.infer<typeof Source>;
export const SOURCE_LABEL: Record<Source, string> = {
  job_post: "From the job post", web: "From the web", resume: "From your resume", general: "General knowledge",
};

export const Fact = z.object({
  text: z.string(),
  source: Source,
  url: z.string().nullable().describe("Page URL when source is web, else null"),
  edited: z.boolean().optional().describe("Set by the app when the person edits the item. Never set by the model."),
});
export type Fact = z.infer<typeof Fact>;

export const BriefRound = z.object({
  name: z.string().describe('Short round name, for example "Recruiter screen"'),
  format: z.string().describe("phone, video, onsite, case, panel, take-home"),
  length_minutes: z.number(),
  interviewer_type: z.string().describe('Who interviews, for example "Hiring manager"'),
  asks: z.array(Fact).describe("2 to 4 question types or sample questions for this round"),
  expects: z.array(Fact).describe("2 to 4 things candidates are judged on in this round"),
  skills: z.array(z.string()).describe("Names from the skills list that this round tests"),
  source: Source,
});
export type BriefRound = z.infer<typeof BriefRound>;

export const Brief = z.object({
  company: z.string(),
  role: z.string(),
  summary: z.string().describe("One or two plain sentences on what the company looks for in this role"),
  company_wants: z.array(Fact).describe("3 to 6 values, traits, or things the company rewards"),
  skills: z.array(z.object({ name: z.string(), reason: z.string(), source: Source })).describe("3 to 5 key skills for the role"),
  rounds: z.array(BriefRound).describe("The likely interview rounds in order"),
  suggested_posting_url: z.string().nullable().describe("A current public posting, only when the person gave no link"),
  missing: z.array(z.string()).describe("Sections that could not be researched; empty when complete"),
});
export type Brief = z.infer<typeof Brief>;
/** jobs.brief keeps everything except rounds and skills, which have their own tables. */
export type StoredBrief = Pick<Brief, "summary" | "company_wants" | "missing"> & { researched_at: string };

export const ResumeAnalysis = z.object({
  strengths: z.array(z.string()).describe("Up to 3 strengths"),
  gaps: z.array(z.string()).describe("Up to 3 gaps against the target roles"),
  stories: z.array(z.object({ name: z.string().describe("Short editable name, 2 to 4 words"), summary: z.string() }))
    .describe("Up to 5 stories worth preparing"),
});
export type ResumeAnalysis = z.infer<typeof ResumeAnalysis>;

export const FitStatus = z.enum(["met", "partly", "missing"]);
export const RoundFit = z.array(z.object({ expectation: z.string(), status: FitStatus, note: z.string().describe("A few words on why") }));
export type RoundFit = z.infer<typeof RoundFit>;

/** What the model returns for one answer. Delivery and overall are calculated in code afterwards. */
export const ModelFeedback = z.object({
  structure: z.number().describe("0 to 10"),
  relevance: z.number().describe("0 to 10"),
  impact: z.number().describe("0 to 10. Quantified impact: low when there is no result number"),
  summary: z.string().describe("Two or three short sentences: what to keep, what to cut, what to add"),
  strengths: z.array(z.object({ point: z.string(), part: z.string().describe("The part of the answer it refers to") })).describe("2 or 3"),
  improvements: z.array(z.object({ point: z.string(), part: z.string() })).describe("2 or 3"),
  sentences: z.array(z.object({ text: z.string().describe("The sentence exactly as given"), mark: z.enum(["keep", "cut", "tighten"]) }))
    .describe("Every sentence of the answer, in order"),
  upgraded: z.string().describe("The person's own answer improved. Only their facts. Missing facts as [placeholders] such as [X%]"),
  placeholders: z.array(z.string()).describe("Every [placeholder] used in upgraded, with brackets"),
  round_fit: RoundFit.describe("Only the round expectations this answer is relevant to"),
  tip: z.string().describe("One short spoken sentence of advice, under 15 words"),
});
export type ModelFeedback = z.infer<typeof ModelFeedback>;
/** answers.feedback */
export type Feedback = ModelFeedback & { delivery: number; overall: number };

export const InterviewScript = z.object({
  persona: z.string().describe('Interviewer title, for example "VP of Sales"'),
  intro: z.string().describe("Two short spoken sentences introducing the interviewer and the round"),
  questions: z.array(z.object({
    text: z.string(),
    type: z.string().describe("Behavioral, Case, Technical, Motivation, or Role"),
    skill: z.string().describe("Exact name of the job skill this tests"),
  })),
  closing: z.string().describe("One short spoken closing line"),
});
export type InterviewScript = z.infer<typeof InterviewScript>;

export const FollowUp = z.object({ follow_up: z.string().nullable().describe("One follow-up question, or null") });

export const Swot = z.object({
  strengths: z.array(z.string()), weaknesses: z.array(z.string()),
  opportunities: z.array(z.string()), threats: z.array(z.string()),
});
export type Swot = z.infer<typeof Swot>;

export const SessionReview = z.object({
  verdict: z.string().describe("One line, under 20 words"),
  swot: Swot.describe("At least one item in each quadrant"),
  round_fit: RoundFit.describe("Every expectation of the round"),
});
/** sessions.review */
export type StoredReview = z.infer<typeof SessionReview> & {
  overall: number;
  delivery: { talkSeconds: number; wpm: number; fillers: number; longestSeconds: number };
  readiness: { before: number; after: number };
  asked: number; planned: number;
};

/** One turn of Single questions. Flat on purpose: unused fields are null. */
export const SingleTurn = z.object({
  kind: z.enum(["question", "swot", "reply"]),
  reply: z.string().nullable().describe("Plain reply or hint, for kind reply"),
  question: z.object({
    text: z.string(), type: z.string(), difficulty: z.enum(["foundational", "standard", "pressure"]),
    why: z.string().describe("One sentence: why this question was chosen"),
    skill: z.string().describe("Exact name of the job skill it tests"),
  }).nullable(),
  swot: z.object({ story: z.string(), swot: Swot, opening_line: z.string().describe("One suggested opening line for this round") }).nullable(),
});
export type SingleTurn = z.infer<typeof SingleTurn>;

/** messages.card */
export type Card =
  | { type: "question"; question: NonNullable<SingleTurn["question"]> }
  | { type: "swot"; swot: NonNullable<SingleTurn["swot"]> }
  | { type: "feedback"; feedback: Feedback | null; skill?: { name: string; before: number; after: number } }
  | { type: "actions"; actions: ChatAction[] };

export const ChatAction = z.object({
  type: z.enum(["single", "full", "scorecard"]),
  label: z.string().describe('Button text, for example "Practice this in Single questions"'),
  topic: z.string().nullable().describe("The question or topic to open the tool with"),
});
export type ChatAction = z.infer<typeof ChatAction>;

export const LIMITS = { posting: 15_000, answer: 6_000, pdfBytes: 3 * 1024 * 1024, message: 6_000 };
