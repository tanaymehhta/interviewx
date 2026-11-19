"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, TextLink } from "@/components/ui";
import { EMAIL } from "./shared";

export function SignInForm({ next, expired }: { next: string | null; expired: boolean }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"form" | "sending" | "sent">("form");
  const [error, setError] = useState("");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const address = email.trim();
    if (!EMAIL.test(address)) return setError("Enter a full email address, for example you@rice.edu.");
    setError("");
    setState("sending");
    const { error } = await createClient().auth.signInWithOtp({
      email: address,
      options: { emailRedirectTo: `${location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}` },
    });
    if (error) {
      setError(error.status === 429 ? "Too many links were requested. Wait a minute, then try again." : "We could not send the link. Try again.");
      return setState("form");
    }
    setState("sent");
  }

  if (state === "sent") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }} role="status">
        <svg className="rise" width="64" height="48" viewBox="0 0 64 48" aria-hidden="true" style={{ overflow: "visible" }}>
          <rect x="1" y="1" width="62" height="46" fill="none" stroke="var(--ink)" strokeWidth="1" />
          <path className="spark" d="M1 1 L32 26 L63 1" fill="none" stroke="var(--olive)" strokeWidth="1.2" />
        </svg>
        <h1 className="serif rise d1" style={{ fontSize: 48, lineHeight: 1.05 }}>Check your email</h1>
        <p className="rise d2">
          We sent a link to <span className="ink" style={{ fontWeight: 400, overflowWrap: "anywhere" }}>{email.trim()}</span>. It works once and expires in one hour.
        </p>
        <div className="rise d3"><TextLink onClick={() => setState("form")}>Use another email</TextLink></div>
        <p className="rise d4" style={{ fontSize: 13 }}>Nothing arrived? Check spam, or go back and send again after one minute.</p>
      </div>
    );
  }

  return (
    <form onSubmit={send} noValidate style={{ display: "flex", flexDirection: "column", gap: 36 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h1 className="serif rise d2" style={{ fontSize: 48, lineHeight: 1.05 }}>
          {expired ? "That link no longer works" : "Sign in or create an account"}
        </h1>
        {expired
          ? <p className="rise d3 err" role="alert">The link expired or was already used. Enter your email and we will send a new one.</p>
          : <p className="rise d3">Enter your email. New here? The same link creates your account.</p>}
      </div>
      <div className="field rise d4">
        <label htmlFor="si-email">Email</label>
        <input className="inp" id="si-email" type="email" name="email" autoComplete="email" placeholder="you@rice.edu" required
          value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!error} aria-describedby={error ? "si-error" : undefined} />
        {error && <p className="err" id="si-error" role="alert">{error}</p>}
      </div>
      <div className="rise d5" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Button type="submit" arrow disabled={state === "sending"} style={{ width: "100%" }}>
          {state === "sending" ? "Sending" : expired ? "Send a new link" : "Send me a sign-in link"}
        </Button>
        <p style={{ fontSize: 13, textAlign: "center" }}>By continuing you agree to the terms and privacy notice.</p>
      </div>
    </form>
  );
}
