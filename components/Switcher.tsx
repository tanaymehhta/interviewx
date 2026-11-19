"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type SwitchOption = { jobId: string; roundId: string; label: string };

/** Job and round switcher. Keeps the person in the same tool when they change round. */
export function Switcher({ options, current }: { options: SwitchOption[]; current?: string }) {
  const path = usePathname();
  // /jobs/:job/:round/<tool> keeps <tool>; anywhere else opens the round page.
  const tool = path.match(/^\/jobs\/[^/]+\/[^/]+\/(interview|call|scorecard|practice)/)?.[1];
  const href = (o: SwitchOption) =>
    path.startsWith("/chat") ? `/chat?job=${o.jobId}&round=${o.roundId}` : `/jobs/${o.jobId}/${o.roundId}${tool ? `/${tool}` : ""}`;
  const now = options.find((o) => o.roundId === current);
  return (
    <details style={{ position: "relative" }}>
      <summary className="switcher">{now?.label ?? "Choose a job and round"} <span aria-hidden="true">⌄</span></summary>
      <div className="card" style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 10, minWidth: 260, display: "flex", flexDirection: "column" }}>
        {options.map((o) => (
          <Link key={o.roundId} href={href(o)} aria-current={o.roundId === current ? "true" : undefined}
            style={{ padding: "10px 14px", fontSize: 14, textDecoration: "none", color: "var(--ink)", background: o.roundId === current ? "var(--ivory)" : undefined }}>
            {o.label}
          </Link>
        ))}
      </div>
    </details>
  );
}
