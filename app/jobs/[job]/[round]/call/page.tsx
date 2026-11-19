import { TopBar } from "@/components/TopBar";
import { CallScreen } from "@/components/call/CallScreen";
import { requireJob } from "@/lib/server";

export default async function CallPage({ params }: { params: Promise<{ job: string; round: string }> }) {
  const { job: jobId, round: roundId } = await params;
  const { job, round, weakest } = await requireJob(jobId, roundId);
  return (
    <div className="wrap">
      <TopBar active="jobs" roundId={round!.id} />
      <CallScreen jobId={job.id} roundId={round!.id} company={job.company} roundName={round!.name} skillName={weakest?.name ?? null} />
    </div>
  );
}
