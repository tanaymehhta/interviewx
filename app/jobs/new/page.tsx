import { TopBar } from "@/components/TopBar";
import { requireProfile } from "@/lib/server";
import { AddJob } from "./AddJob";

export const metadata = { title: "Add a job" };

export default async function Page({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  await requireProfile();
  const { mode } = await searchParams;
  return (
    <div className="wrap">
      <TopBar active="jobs" />
      <AddJob initialMode={mode === "pick" || mode === "text" ? mode : "link"} />
    </div>
  );
}
