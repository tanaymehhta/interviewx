// POST /api/speak { text } → MP3 of the interviewer's voice from Fish Audio.
// 503 when FISH_API_KEY is not set; the browser then falls back to its built-in voice.
import { getUser, json, tooLarge } from "@/lib/server";

export const maxDuration = 30;
// "Slax": calm, clear, professional. Any Fish Audio voice id works; set FISH_VOICE_ID to change it.
const VOICE = process.env.FISH_VOICE_ID ?? "c5f56a6cc2ec4fa8920cb4c5889a3fb7";

export async function POST(req: Request) {
  const { user } = await getUser();
  if (!user) return json({ error: "Sign in first." }, 401);
  if (!process.env.FISH_API_KEY) return json({ error: "Voice is not configured." }, 503);
  const text = String((await req.json().catch(() => null))?.text ?? "").trim();
  if (!text) return json({ error: "No text." }, 400);
  if (text.length > 1200) return tooLarge("The text");

  const res = await fetch("https://api.fish.audio/v1/tts", {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.FISH_API_KEY}`,
      "content-type": "application/json",
      ...(process.env.FISH_MODEL ? { model: process.env.FISH_MODEL } : {}),
    },
    body: JSON.stringify({ text, reference_id: VOICE, format: "mp3", mp3_bitrate: 64, latency: "balanced", language: "en" }),
    signal: AbortSignal.timeout(20_000),
  }).catch(() => null);
  if (!res?.ok || !res.body) {
    console.error("Fish Audio TTS failed", res?.status);
    return json({ error: "Voice failed." }, 502);
  }
  return new Response(res.body, { headers: { "content-type": "audio/mpeg", "cache-control": "no-store" } });
}
