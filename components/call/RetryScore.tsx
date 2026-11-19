"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FeedbackCard } from "@/components/FeedbackCard";

/** The unscored state of a saved answer, with a retry that scores it and reloads the recap. */
export function RetryScore({ answerId }: { answerId: string }) {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);
  const retry = async () => {
    setRetrying(true);
    await fetch("/api/feedback", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ answerId }),
    }).catch(() => null);
    router.refresh();
    setRetrying(false);
  };
  return <FeedbackCard feedback={null} onRetry={retry} retrying={retrying} />;
}
