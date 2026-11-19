// Style reference: every token and primitive in both themes. Public, not linked from the app.
import type { Metadata } from "next";
import { Accent, Bar, Button, Card, Eyebrow, ScoreNumeral, SourceTag, Sparkline, Steps, SwotGrid, TextLink, ToolTile, Turn } from "@/components/ui";

export const metadata: Metadata = { title: "Tokens", robots: { index: false } };

const TOKENS = ["paper", "ivory", "ink", "stone", "olive", "on-olive", "garnet", "gold", "gold-soft", "hair"];

function Sheet({ theme }: { theme: "light" | "dark" }) {
  return (
    <section data-theme={theme} style={{ padding: "48px 0" }}>
      <div className="wrap" style={{ display: "flex", flexDirection: "column", gap: 36 }}>
        <Eyebrow>{theme} theme</Eyebrow>
        <h1 className="serif" style={{ fontSize: 57, lineHeight: 1.05 }}>Practice the right part at the right <Accent>time.</Accent></h1>
        <p style={{ maxWidth: 560 }}>Body text is Open Sans 300 at 16px with 1.8 line height, in stone. Headings, questions and numbers use Cormorant Garamond 300 in ink.</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 8 }}>
          {TOKENS.map((t) => (
            <div key={t} style={{ border: "1px solid var(--hair)" }}>
              <div style={{ height: 56, background: `var(--${t})` }} />
              <p style={{ fontSize: 12, padding: "6px 8px" }}>{t}</p>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
          <Button arrow>Get started</Button>
          <Button variant="secondary">Back to round</Button>
          <Button small>Send</Button>
          <Button variant="danger" small>End call</Button>
          <Button disabled>Begin interview</Button>
          <TextLink>Mark as not an answer</TextLink>
          <button type="button" className="choice on">30 min</button>
          <button type="button" className="choice">45 min</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: 20 }}>
          <Card style={{ padding: 28, display: "flex", flexDirection: "column", gap: 14 }}>
            <Eyebrow>Card · hairline</Eyebrow>
            <ScoreNumeral value={64} label="readiness" />
            <Sparkline points={[50, 48, 53, 55, 61, 64]} />
          </Card>
          <Card soft style={{ padding: 28, display: "flex", flexDirection: "column", gap: 14 }}>
            <Eyebrow>Card · ivory</Eyebrow>
            <ScoreNumeral value={48} label="weakest skill" garnet />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <SourceTag fact={{ source: "job_post", url: null }} />
              <SourceTag fact={{ source: "web", url: "https://example.com" }} />
              <SourceTag fact={{ source: "resume", url: null }} />
              <SourceTag fact={{ source: "general", url: null }} />
            </div>
          </Card>
          <ToolTile n="i." name="Full interview" text="15, 30 or 45 minutes, spoken, with follow-ups." go="Start" href="/tokens" />
        </div>

        <div className="field" style={{ maxWidth: 360 }}>
          <label htmlFor={`email-${theme}`}>Email</label>
          <input id={`email-${theme}`} className="inp" type="email" placeholder="you@school.edu" />
        </div>

        <div>
          <Turn who="You"><p className="ink">Let me practice “tell me about yourself” for this round.</p></Turn>
          <Turn who="InterviewX">
            <p className="ink"><span className="cut">So, um, this was a long time ago.</span> <span className="keep">We lost a $400k renewal.</span> <span className="tight">We never really confirmed the buyer.</span> Revenue grew <span className="ph">[X%]</span>.</p>
          </Turn>
        </div>

        <SwotGrid compact swot={{ strengths: ["Owns a real loss."], weaknesses: ["No result number yet."], opportunities: ["Fits their value."], threats: ["Sounds old."] }} />
        <Steps steps={["Reading 6 answers", "Scoring structure and impact", "Writing your upgraded answers"]} current={1} />
        <Bar value={61} />
      </div>
    </section>
  );
}

export default function TokensPage() {
  return (<><Sheet theme="light" /><Sheet theme="dark" /></>);
}
