import { notFound } from "next/navigation";
import type { Feedback } from "@/lib/schemas";
import { requireJob } from "@/lib/server";
import { TopBar } from "@/components/TopBar";
import { FeedbackCard } from "@/components/FeedbackCard";
import { Eyebrow, TextLink, Turn, fmtDate, fmtTime } from "@/components/ui";
import { TOOL_LABEL } from "@/components/scorecard/shared";

export const metadata = { title: "Answer feedback" };

export default async function Page({ params }: { params: Promise<{ job: string; round: string; answer: string }> }) {
  const { job: jobId, round: roundId, answer: answerId } = await params;
  const { supabase, job, skills, ...ctx } = await requireJob(jobId, roundId);
  const round = ctx.round!;
  if (!/^[0-9a-f-]{36}$/i.test(answerId)) notFound();
  const { data: answer } = await supabase.from("answers").select("*").eq("id", answerId).eq("job_id", job.id).maybeSingle();
  if (!answer) notFound();
  const { data: session } = await supabase.from("sessions").select("tool").eq("id", answer.session_id).maybeSingle();
  const skill = skills.find((s) => s.id === answer.skill_id)?.name;

  return (
    <div className="wrap" style={{ maxWidth: 920 }}>
      <TopBar active="jobs" roundId={round.id} />
      <section style={{ padding: "40px 0 28px", display: "flex", flexDirection: "column", gap: 12 }}>
        <TextLink href={`/jobs/${job.id}/${round.id}/scorecard`} style={{ alignSelf: "flex-start", fontSize: 14 }}>← Scorecard</TextLink>
        <Eyebrow className="rise d1">
          {[fmtDate(answer.created_at), TOOL_LABEL[session?.tool ?? ""], answer.question_type, skill].filter(Boolean).join(" · ")}
        </Eyebrow>
        <h1 className="serif rise d2" style={{ fontSize: "clamp(30px, 6vw, 44px)", lineHeight: 1.15 }}>{answer.question}</h1>
      </section>
      <section className="rise d3" style={{ display: "flex", flexDirection: "column", paddingBottom: 96 }}>
        <Turn who={answer.seconds ? `You · spoken · ${fmtTime(answer.seconds)}` : "You"}>
          <p className="ink" style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{answer.text}</p>
        </Turn>
        <Turn who="InterviewX · feedback">
          <FeedbackCard feedback={answer.feedback as unknown as Feedback | null} />
        </Turn>
      </section>
    </div>
  );
}
