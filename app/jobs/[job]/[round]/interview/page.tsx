import { Interview } from "@/components/interview/Interview";
import { requireJob } from "@/lib/server";

export const metadata = { title: "Full interview · InterviewX" };

export default async function Page({ params }: { params: Promise<{ job: string; round: string }> }) {
  const { job, round: roundId } = await params;
  const ctx = await requireJob(job, roundId);
  const round = ctx.round!;
  return (
    <Interview info={{
      jobId: ctx.job.id, roundId: round.id, company: ctx.job.company, role: ctx.job.role, roundName: round.name,
      interviewerType: round.interviewer_type, expects: round.expects.map((e) => e.text),
    }} />
  );
}
