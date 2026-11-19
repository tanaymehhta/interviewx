import Link from "next/link";
import { getUser, localNow } from "@/lib/server";
import { Clock } from "@/components/Clock";
import { Switcher, type SwitchOption } from "@/components/Switcher";

/**
 * Signed-in top bar: wordmark, My Jobs, Chat, job and round switcher, Settings.
 * After 6 PM local time it also shows a banner when a plan task for today is still open.
 */
export async function TopBar({ active, roundId }: { active?: "jobs" | "chat" | "settings"; roundId?: string }) {
  const { supabase } = await getUser();
  const { today, hour } = await localNow();
  const [{ data: jobs }, { data: open }] = await Promise.all([
    supabase.from("jobs").select("id, company, rounds(id, name, position)").eq("status", "preparing").order("created_at"),
    hour >= 18
      ? supabase.from("plan_days").select("minutes, rounds(id, name, job_id, jobs(company))").eq("day", today).eq("done", false).limit(1)
      : Promise.resolve({ data: null }),
  ]);
  type JobRow = { id: string; company: string; rounds: { id: string; name: string; position: number }[] };
  const options: SwitchOption[] = ((jobs ?? []) as unknown as JobRow[]).flatMap((j) =>
    [...j.rounds].sort((a, b) => a.position - b.position).map((r) => ({ jobId: j.id, roundId: r.id, label: `${j.company} · ${r.name}` })));
  type OpenRow = { minutes: number; rounds: { id: string; name: string; job_id: string; jobs: { company: string } } };
  const task = (open as unknown as OpenRow[] | null)?.[0];

  return (
    <>
      <Clock />
      <header className="topbar">
        <Link className="mark" href="/">Interview<i>X</i></Link>
        <nav aria-label="App" style={{ display: "flex", gap: 28, flex: 1 }}>
          <Link className={`nav${active === "jobs" ? " on" : ""}`} href="/jobs">My Jobs</Link>
          <Link className={`nav${active === "chat" ? " on" : ""}`} href="/chat">Chat</Link>
        </nav>
        {options.length > 0 && <Switcher options={options} current={roundId} />}
        <Link className={`nav${active === "settings" ? " on" : ""}`} href="/settings">Settings</Link>
      </header>
      {task && (
        <div className="rise" role="status" style={{ marginTop: 28, padding: "16px 20px", background: "var(--gold-soft)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <span className="ink" style={{ fontSize: 15, fontWeight: 400 }}>
            Today’s practice for {task.rounds.jobs.company} · {task.rounds.name} is still open. {task.minutes} minutes.
          </span>
          <Link className="tlink" href={`/jobs/${task.rounds.job_id}/${task.rounds.id}`}>Start now</Link>
        </div>
      )}
    </>
  );
}
