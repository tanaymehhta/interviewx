// POST /api/research: researches a job and streams progress as newline-delimited JSON.
// Body: { url?, postingText?, company?, role? } for a new job, or { jobId, skipLink? } to re-run for a saved job.
// Stream events: {type:"step",index} · {type:"brief",brief,partial} · {type:"needs_text"} · {type:"error",message}
// The status is already 200 when the model runs, so a model failure arrives as an error event, not a 502.
import { z } from "zod";
import { LIMITS, type ResumeAnalysis } from "@/lib/schemas";
import { getUser, json, tooLarge } from "@/lib/server";
import { isWalled, research, type ResearchEvent, type ResearchInput } from "@/lib/research";

export const maxDuration = 120;

const Body = z.object({
  url: z.string().trim().max(2000).regex(/^https?:\/\/\S+$/i).optional(),
  postingText: z.string().optional(),
  company: z.string().trim().max(120).optional(),
  role: z.string().trim().max(120).optional(),
  jobId: z.string().uuid().optional(),
  /** Re-run only: the saved link could not be read, so research by company and role. */
  skipLink: z.boolean().optional(),
});

export async function POST(req: Request) {
  const { supabase, user } = await getUser();
  if (!user) return json({ error: "Sign in first." }, 401);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Check the link or the text and try again." }, 400);
  const body = parsed.data;
  if ((body.postingText?.length ?? 0) > LIMITS.posting) return tooLarge("The posting text");

  let input: ResearchInput = {
    url: body.url, postingText: body.postingText?.trim() || undefined,
    company: body.company || undefined, role: body.role || undefined,
  };
  if (body.jobId) {
    const [{ data: job }, { data: rounds }] = await Promise.all([
      supabase.from("jobs").select("company, role, source_url, posting_text").eq("id", body.jobId).maybeSingle(),
      supabase.from("rounds").select("name").eq("job_id", body.jobId).order("position"),
    ]);
    if (!job) return json({ error: "Not found." }, 404);
    input = {
      company: job.company, role: job.role, url: job.source_url ?? undefined,
      postingText: job.posting_text ?? undefined, roundNames: (rounds ?? []).map((r) => r.name),
    };
    // A saved link that cannot be read must not block a re-run: research by company and role instead.
    if (input.url && !input.postingText && (body.skipLink || isWalled(input.url))) input.url = undefined;
  }
  if (!input.url && !input.postingText && !(input.company && input.role))
    return json({ error: "Give a link, the posting text, or a company and a role." }, 400);

  const { data: profile } = await supabase.from("profiles").select("resume_text, resume_analysis, target_roles").eq("id", user.id).maybeSingle();
  const analysis = profile?.resume_analysis as ResumeAnalysis | null;
  const resume = [
    profile?.target_roles?.length ? `Target roles: ${profile.target_roles.join(", ")}` : "",
    analysis ? `Strengths: ${analysis.strengths.join("; ")}\nGaps: ${analysis.gaps.join("; ")}` : "",
    profile?.resume_text?.slice(0, 6000) ?? "",
  ].filter(Boolean).join("\n");

  const enc = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (e: ResearchEvent) => {
        try { controller.enqueue(enc.encode(JSON.stringify(e) + "\n")); } catch { /* the person left the page */ }
      };
      try {
        await research(input, resume, emit, req.signal);
      } catch (e) {
        console.error(e);
        emit({ type: "error", message: "The assistant did not answer. Try again." });
      }
      try { controller.close(); } catch { /* already closed */ }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" } });
}
