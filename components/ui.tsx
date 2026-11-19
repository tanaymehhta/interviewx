// Shared primitives. Class names come from design/mock/ix.css (ported into app/globals.css).
import Link from "next/link";
import type { ComponentProps, CSSProperties, ReactNode } from "react";
import { SOURCE_LABEL, type Fact, type RoundFit, type Source, type Swot } from "@/lib/schemas";

type ButtonProps = {
  variant?: "primary" | "secondary" | "danger";
  small?: boolean;
  arrow?: boolean;
  children: ReactNode;
} & ({ href: string } & Omit<ComponentProps<typeof Link>, "href"> | ({ href?: undefined } & ComponentProps<"button">));

/** Square button. Renders a link when `href` is set. */
export function Button({ variant = "primary", small, arrow, children, className = "", ...rest }: ButtonProps) {
  const cls = `btn${variant === "secondary" ? " ghost" : variant === "danger" ? " danger" : ""}${small ? " sm" : ""} ${className}`;
  const inner = <>{children}{arrow && <span className="arr" aria-hidden="true">→</span>}</>;
  if (rest.href !== undefined) return <Link className={cls} {...rest}>{inner}</Link>;
  return <button type="button" className={cls} {...(rest as ComponentProps<"button">)}>{inner}</button>;
}

/** Underlined text link or button. */
export function TextLink({ href, children, style, ...rest }: { href?: string; children: ReactNode; style?: CSSProperties } & ComponentProps<"button">) {
  if (href) return <Link className="tlink" href={href} style={style}>{children}</Link>;
  return <button type="button" className="tlink" style={style} {...rest}>{children}</button>;
}

export const Card = ({ soft, className = "", ...rest }: { soft?: boolean } & ComponentProps<"div">) =>
  <div className={`card${soft ? " soft" : ""} ${className}`} {...rest} />;

export const Eyebrow = ({ className = "", ...rest }: ComponentProps<"span">) => <span className={`eyebrow ${className}`} {...rest} />;

/** Heading in the display serif; wrap the accent word in <Accent>. */
export const Accent = ({ children }: { children: ReactNode }) => <span className="ital">{children}</span>;

export function Bar({ value, max = 100, garnet, delay }: { value: number; max?: number; garnet?: boolean; delay?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={`bar${garnet ? " g" : ""}`} role="img" aria-label={`${value} of ${max}`}>
      <i style={{ width: `${pct}%`, animationDelay: delay ? `${delay}ms` : undefined }} />
    </div>
  );
}

/** Large serif numeral with a thin bar. */
export function ScoreNumeral({ value, max = 100, size = 64, label, garnet, bar = true }: { value: number | string; max?: number; size?: number; label?: ReactNode; garnet?: boolean; bar?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span className={`serif num${garnet ? " garnet" : ""}`} style={{ fontSize: size, lineHeight: 1 }}>{value}</span>
      {bar && typeof value === "number" && <Bar value={value} max={max} garnet={garnet} />}
      {label && <span style={{ fontSize: 13 }}>{label}</span>}
    </div>
  );
}

/** 1px trend line. No chart library. */
export function Sparkline({ points, width = 120, height = 28 }: { points: number[]; width?: number; height?: number }) {
  if (points.length < 2) return <svg className="spark" width={width} height={height} aria-hidden="true" />;
  const min = Math.min(...points), max = Math.max(...points), span = max - min || 1;
  const d = points.map((p, i) => `${i ? "L" : "M"}${((i / (points.length - 1)) * width).toFixed(1)} ${(height - 2 - ((p - min) / span) * (height - 4)).toFixed(1)}`).join(" ");
  return (
    <svg className="spark" width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Trend from ${points[0]} to ${points.at(-1)}`}>
      <path d={d} fill="none" stroke="var(--olive)" strokeWidth="1" />
    </svg>
  );
}

export function ToolTile({ n, name, text, go, href, delay = 5 }: { n: string; name: string; text: string; go: string; href: string; delay?: number }) {
  return (
    <Link className={`tile rise d${delay}`} href={href}>
      <span className="n">{n}</span>
      <span style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span className="serif" style={{ fontSize: 30 }}>{name}</span>
        <span style={{ fontSize: 14 }}>{text}</span>
      </span>
      <span className="go ink">{go} →</span>
    </Link>
  );
}

/** One turn of a transcript thread: speaker label, hairline, no bubble. */
export function Turn({ who, children, className = "" }: { who: string; children: ReactNode; className?: string }) {
  return <div className={`turn ${className}`}><p className="who">{who}</p>{children}</div>;
}

const TAG_CLASS: Record<Source, string> = { job_post: "post", web: "web", resume: "", general: "gen" };
/** Source tag for one researched fact. General knowledge shows "not verified". */
export function SourceTag({ fact }: { fact: Pick<Fact, "source" | "url"> }) {
  const label = fact.source === "general" ? "General knowledge · not verified" : SOURCE_LABEL[fact.source];
  const cls = `tag ${TAG_CLASS[fact.source]}`;
  return fact.source === "web" && fact.url
    ? <a className={cls} href={fact.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>{label} ↗</a>
    : <span className={cls}>{label}</span>;
}

const FIT_WORD = { met: "Met", partly: "Partly", missing: "Missing" } as const;
export function RoundFitList({ items }: { items: RoundFit }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
      {items.map((f, i) => (
        <div key={i} className="card" style={{ padding: 22, display: "flex", gap: 14, alignItems: "center", borderColor: f.status === "missing" ? "var(--garnet)" : undefined }}>
          <span aria-hidden="true" style={{
            width: 28, height: 28, flex: "none", borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 14,
            ...(f.status === "met" ? { background: "var(--olive)", color: "var(--on-olive)" }
              : f.status === "partly" ? { border: "1px solid var(--olive)", background: "linear-gradient(90deg, var(--olive) 50%, transparent 50%)" }
              : { border: "1px solid var(--garnet)", color: "var(--garnet)" }),
          }}>{f.status === "met" ? "✓" : f.status === "missing" ? "✕" : ""}</span>
          <div>
            <p className="ink" style={{ fontWeight: 400 }}>{f.expectation}</p>
            <p style={{ fontSize: 13 }}>{FIT_WORD[f.status]}{f.note ? ` · ${f.note}` : ""}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SwotGrid({ swot, compact }: { swot: Swot; compact?: boolean }) {
  const cells: [string, string, string[]][] = [
    ["Strengths", "olive", swot.strengths], ["Weaknesses", "garnet", swot.weaknesses],
    ["Opportunities", "", swot.opportunities], ["Threats", "", swot.threats],
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1, background: "var(--hair)", border: "1px solid var(--hair)" }}>
      {cells.map(([name, color, items]) => (
        <div key={name} style={{ background: "var(--paper)", padding: compact ? 18 : 22 }}>
          <span className={`eyebrow ${color}`}>{name}</span>
          <p className="ink" style={{ fontSize: compact ? 14 : 15, paddingTop: 8 }}>{items.join(" ")}</p>
        </div>
      ))}
    </div>
  );
}

/** Staged loading list: finished steps get a tick, the current one a spinner. */
export function Steps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }} aria-live="polite">
      {steps.map((s, i) => (
        <div key={s} className="step" style={{ animationDelay: `${i * 100}ms`, opacity: i > current ? 0.35 : undefined, animation: i > current ? "none" : undefined }}>
          {i < current
            ? <svg className="tick" viewBox="0 0 18 18" fill="none" stroke="var(--olive)" strokeWidth="1.4" aria-hidden="true"><path d="M3 9.5l4 4 8-9" /></svg>
            : i === current ? <span className="spin" aria-hidden="true" /> : <span style={{ width: 14, flex: "none" }} />}
          <span className={i <= current ? "ink" : ""}>{s}</span>
        </div>
      ))}
    </div>
  );
}

export const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
export const fmtDate = (d: string, opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" }) =>
  new Date(`${d.slice(0, 10)}T12:00:00`).toLocaleDateString("en-GB", opts);
