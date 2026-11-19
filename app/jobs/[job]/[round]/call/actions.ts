"use server";
import { getUser } from "@/lib/server";

/** Closes a call session. Row level security limits the update to the person's own session. */
export async function endCall(sessionId: string, status: "complete" | "incomplete") {
  const { supabase, user } = await getUser();
  if (!user) throw new Error("Sign in first.");
  if (!/^[0-9a-f-]{36}$/i.test(sessionId) || (status !== "complete" && status !== "incomplete")) throw new Error("Invalid request.");
  await supabase.from("sessions").update({ status, ended_at: new Date().toISOString() })
    .eq("id", sessionId).eq("tool", "call").eq("status", "active");
}
