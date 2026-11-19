"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** Retry for a review that did not finish. The route only does what is still missing. */
export function FinishReview({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function retry() {
    setBusy(true);
    setError("");
    const ok = await fetch("/api/interview/review", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId }),
    }).then((r) => r.ok, () => false);
    if (ok) router.refresh();
    else setError("The review did not finish. Try again in a moment.");
    setBusy(false);
  }

  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
      <button type="button" className="btn" onClick={retry} disabled={busy}>{busy ? "Reviewing" : "Finish the review"}</button>
      {error && <span className="err" role="alert">{error}</span>}
    </div>
  );
}
