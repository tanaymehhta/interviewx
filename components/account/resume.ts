// Browser side of the resume flow: check the file, upload it, ask for the analysis.
import { createClient } from "@/lib/supabase/client";
import { LIMITS, type ResumeAnalysis } from "@/lib/schemas";

export const RESUME_RULE = "Use a PDF of 3 MB or less, or paste the text.";

/** Error message for a file that is not a PDF of 3 MB or less, else null. */
export function checkPdf(file: File): string | null {
  const isPdf = file.type === "application/pdf" || (!file.type && /\.pdf$/i.test(file.name));
  if (!isPdf) return `${file.name} is not a PDF. ${RESUME_RULE}`;
  if (file.size > LIMITS.pdfBytes) return `${file.name} is larger than 3 MB. ${RESUME_RULE}`;
  return null;
}

/** Uploads to the private bucket at {uid}/resume.pdf. Returns an error message or null. */
export async function uploadPdf(uid: string, file: File): Promise<string | null> {
  const { error } = await createClient().storage.from("resumes")
    .upload(`${uid}/resume.pdf`, file, { upsert: true, contentType: "application/pdf" });
  return error ? "The upload failed. Try again." : null;
}

/** `{ pdf: true }` after an upload, `{ text }` for pasted text, `{}` to retry with the saved resume. */
export async function analyze(body: { pdf?: true; text?: string } = {}): Promise<{ analysis: ResumeAnalysis } | { error: string }> {
  try {
    const res = await fetch("/api/profile/analyze", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    return res.ok ? data : { error: data.error ?? "We could not read your resume. Try again." };
  } catch {
    return { error: "We could not reach the server. Try again." };
  }
}

export const fileSize = (bytes: number) => bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
