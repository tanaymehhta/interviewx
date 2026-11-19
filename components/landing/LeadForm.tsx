"use client";
import { useState } from "react";
import { Button } from "@/components/ui";
import { EMAIL } from "@/components/account/shared";
import { addLead } from "./actions";

const FIELDS = [
  { key: "name", label: "Your name", placeholder: "Priya Shah", type: "text", autoComplete: "name", missing: "Enter your name." },
  { key: "school", label: "School", placeholder: "Rice University, Jones Graduate School", type: "text", autoComplete: "organization", missing: "Enter your school." },
  { key: "email", label: "Work email", placeholder: "you@school.edu", type: "email", autoComplete: "email", missing: "Enter a full email address, for example you@school.edu." },
] as const;
type Key = (typeof FIELDS)[number]["key"];

export function LeadForm() {
  const [values, setValues] = useState<Record<Key, string>>({ name: "", school: "", email: "" });
  const [errors, setErrors] = useState<Partial<Record<Key | "form", string>>>({});
  const [state, setState] = useState<"form" | "sending" | "sent">("form");

  const problem = (key: Key, value: string) => {
    const field = FIELDS.find((f) => f.key === key)!;
    return (key === "email" ? EMAIL.test(value.trim()) : value.trim()) ? undefined : field.missing;
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const found = Object.fromEntries(FIELDS.map((f) => [f.key, problem(f.key, values[f.key])]).filter(([, v]) => v));
    setErrors(found);
    if (Object.keys(found).length) return;
    setState("sending");
    const r = await addLead(values).catch(() => ({ error: "We could not reach the server. Try again." }));
    if ("error" in r) { setErrors({ form: r.error }); return setState("form"); }
    setState("sent");
  }

  if (state === "sent") {
    return (
      <div className="card rise" role="status" style={{ padding: 40, display: "flex", flexDirection: "column", gap: 12 }}>
        <span className="serif" style={{ fontSize: 36 }}>Thank you.</span>
        <p>We will write to you within two working days.</p>
      </div>
    );
  }
  return (
    <form onSubmit={submit} noValidate style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {FIELDS.map((f) => (
        <div className="field" key={f.key}>
          <label htmlFor={`cc-${f.key}`}>{f.label}</label>
          <input className="inp" id={`cc-${f.key}`} name={f.key} type={f.type} autoComplete={f.autoComplete} placeholder={f.placeholder} required
            maxLength={f.key === "email" ? 254 : f.key === "school" ? 200 : 120}
            value={values[f.key]} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
            // The email is checked when the person leaves the field, and again on submit.
            onBlur={f.key === "email" ? (e) => setErrors({ ...errors, email: e.target.value ? problem("email", e.target.value) : undefined }) : undefined}
            aria-invalid={!!errors[f.key]} aria-describedby={errors[f.key] ? `cc-${f.key}-error` : undefined} />
          {errors[f.key] && <p className="err" id={`cc-${f.key}-error`} role="alert">{errors[f.key]}</p>}
        </div>
      ))}
      {errors.form && <p className="err" role="alert">{errors.form}</p>}
      <div><Button type="submit" arrow disabled={state === "sending"}>{state === "sending" ? "Sending" : "Request a pilot"}</Button></div>
    </form>
  );
}
