"use client";
import { useCallback, useRef, useState } from "react";
import type { Brief } from "@/lib/schemas";
import type { ResearchEvent } from "@/lib/research";

export const RESEARCH_STEPS = ["Reading the job post", "Searching interview reports", "Checking company values", "Matching against your resume"];

type State = {
  status: "idle" | "busy" | "done" | "needs_text" | "error";
  step: number;
  brief?: Brief;
  partial?: boolean;
  error?: string;
};

/** Calls POST /api/research and follows its newline-delimited JSON events. */
export function useResearch() {
  const [state, setState] = useState<State>({ status: "idle", step: 0 });
  const ctl = useRef<AbortController | null>(null);

  const run = useCallback(async (body: Record<string, unknown>) => {
    ctl.current?.abort();
    const mine = (ctl.current = new AbortController());
    setState({ status: "busy", step: 0 });
    const fail = (error: string) => setState({ status: "error", step: 0, error });
    try {
      const res = await fetch("/api/research", { method: "POST", body: JSON.stringify(body), signal: mine.signal });
      if (!res.ok || !res.body) return fail((await res.json().catch(() => null))?.error ?? "Research did not start. Try again.");
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      let ended = false;
      for (;;) {
        const { value, done } = await reader.read();
        buffer += value ?? "";
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines.filter(Boolean)) {
          const e = JSON.parse(line) as ResearchEvent;
          if (e.type === "step") setState((s) => ({ ...s, step: Math.max(s.step, e.index) }));
          else {
            ended = true;
            if (e.type === "brief") setState({ status: "done", step: RESEARCH_STEPS.length, brief: e.brief, partial: e.partial });
            else if (e.type === "needs_text") setState({ status: "needs_text", step: 0 });
            else fail(e.message);
          }
        }
        if (done) break;
      }
      if (!ended) fail("Research stopped early. Try again.");
    } catch {
      if (!mine.signal.aborted) fail("Research stopped early. Try again.");
    }
  }, []);

  const reset = useCallback(() => {
    ctl.current?.abort();
    setState({ status: "idle", step: 0 });
  }, []);

  return { ...state, run, reset };
}
