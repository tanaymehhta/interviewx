"use client";
import { useState } from "react";
import { Button } from "@/components/ui";
import { buildIcs } from "@/lib/coach";

type Event = { day: string; minutes: number; title: string };

/** "Remind me at" time and the Add to calendar download: one event per plan day, linking to this round. */
export function Calendar({ events, path, fileName }: { events: Event[]; path: string; fileName: string }) {
  const [time, setTime] = useState("08:00");
  const download = () => {
    const ics = buildIcs(events, time || "08:00", location.origin + path);
    const href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    Object.assign(document.createElement("a"), { href, download: fileName }).click();
    URL.revokeObjectURL(href);
  };
  return (
    <>
      <label htmlFor="rem-time">Remind me at</label>
      <input id="rem-time" className="inp" type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ width: 120, fontSize: 15, padding: "4px 0" }} />
      <Button variant="secondary" small onClick={download} disabled={!events.length}>Add to calendar</Button>
    </>
  );
}
