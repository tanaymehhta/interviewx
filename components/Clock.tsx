"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { localDate } from "@/lib/coach";

/**
 * Tells the server the person's local date and hour through two cookies, so plans, interview day,
 * and the evening reminder follow their clock, not the server's. For testing, set
 * localStorage.ix_now to an ISO time (for example "2026-11-26T19:00") and reload.
 */
export function Clock() {
  const router = useRouter();
  useEffect(() => {
    const override = localStorage.getItem("ix_now");
    const now = override ? new Date(override) : new Date();
    const want = { today: localDate(now), hour: String(now.getHours()) };
    const have = Object.fromEntries(document.cookie.split("; ").map((c) => c.split("=")));
    if (have.today === want.today && have.hour === want.hour) return;
    document.cookie = `today=${want.today}; path=/; max-age=86400; samesite=lax`;
    document.cookie = `hour=${want.hour}; path=/; max-age=86400; samesite=lax`;
    router.refresh();
  }, [router]);
  return null;
}
