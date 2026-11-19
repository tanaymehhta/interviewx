import Link from "next/link";
import { getUser } from "@/lib/server";
import { Button } from "@/components/ui";
import { CountUp } from "@/components/CountUp";
import { LeadForm } from "@/components/landing/LeadForm";

// Sections sit at least 96px apart on desktop and closer on phones.
const GAP = "clamp(72px, 11vw, 128px)";
const H2 = { fontSize: "clamp(40px, 5.5vw, 56px)", lineHeight: 1.05 };
const SIGNIN = "/signin";

const STEPS = [
  ["Add the job", "Paste a link, or pick a company and a role title."],
  ["We research every round", "How many rounds, what each one asks, what each one expects, and what the company wants."],
  ["Practice out loud", "Full interviews, quick calls on the go, single questions. Your words appear as you speak."],
  ["See what is improving", "A scorecard for each job and round, and a plan that moves to your weakest skill."],
];
const TOOLS = [
  ["i.", "Full interview", "A spoken mock of the real round, with follow-ups."],
  ["ii.", "Call", "Three quick questions, hands-free, on the go."],
  ["iii.", "Feedback", "Your scorecard: strong, weak, improving."],
  ["iv.", "Single questions", "Practice one answer. Every answer is scored."],
  ["v.", "Chat", "Ask anything. It knows your jobs and scores."],
];
// The only statistics allowed on this page. Each one shows its source beside it.
const STATS = [
  { to: 19, unit: "%", text: "fewer jobs than expected for workers aged 22–25 in the roles most exposed to AI.", source: "Stanford Digital Economy Lab, 2026" },
  { to: 7, unit: "×", text: "more likely: entry-level postings in AI-exposed jobs asking for senior skills like judgment.", source: "PwC 2026 Global AI Jobs Barometer" },
  { to: 700, unit: "+", text: "universities already pay for an AI interview practice tool.", source: "Big Interview, company claim" },
];
// Hero sample answer: [word, delay in seconds, still settling].
const WORDS: [string, number, boolean?][] = [
  ["In", 1.6], ["my", 1.8], ["second", 1.95], ["year", 2.1], ["at", 2.25], ["Northwind", 2.4], ["we", 2.7], ["lost", 2.85], ["a", 3],
  ["$400k", 3.15], ["renewal.", 3.4], ["I", 3.9], ["rebuilt", 4.05], ["our", 4.2], ["qualification", 4.4, true], ["process", 4.6, true],
];

export default async function Landing() {
  const { user } = await getUser();
  const account = user ? { href: "/jobs", label: "My Jobs" } : { href: SIGNIN, label: "Sign in" };

  return (
    <>
      <div className="wrap">
        <header className="topbar rise">
          <Link className="mark" href="/">Interview<i>X</i></Link>
          <nav aria-label="Main" style={{ display: "flex", gap: 28, flex: 1, justifyContent: "center", flexWrap: "wrap" }}>
            <a className="nav" href="#how">How it works</a>
            <a className="nav" href="#tools">The five tools</a>
            <a className="nav" href="#centers">For career centers</a>
          </nav>
          <Link className="nav" href={account.href}>{account.label}</Link>
          <Button small href={SIGNIN}>Get started</Button>
        </header>
      </div>

      <main>
        <div className="wrap">
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 460px), 1fr))", gap: 64, alignItems: "center", paddingBlock: GAP }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              <p className="eyebrow rise d1">Interview coaching for MBA candidates</p>
              <h1 className="serif rise d2" style={{ fontSize: "clamp(52px, 7vw, 92px)", lineHeight: 1.02 }}>Practice the right part at the right <span className="ital">time.</span></h1>
              <p className="rise d3" style={{ fontSize: 19, maxWidth: 470 }}>Add the job. We research every round, plan your days up to the interview, and let you rehearse out loud until the hard part feels easy.</p>
              <div className="rise d4" style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
                <Button arrow href={SIGNIN}>Get started</Button>
                <a className="tlink" href="#how">See how it works</a>
              </div>
            </div>
            {/* A fixed sample of the live interview screen, not real data. */}
            <div className="card soft rise d5" aria-hidden="true" style={{ padding: "clamp(20px, 5vw, 36px)", display: "flex", flexDirection: "column", gap: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <span className="eyebrow">Salesforce · Final round</span>
                <span className="num ink" style={{ fontSize: 14 }}>04:12 / 30:00</span>
              </div>
              <p className="eyebrow garnet">Question 3 of 6 · Behavioral</p>
              <p className="serif qin" style={{ fontSize: "clamp(26px, 4vw, 34px)", lineHeight: 1.15, animationDelay: "700ms" }}>Tell me about a deal you lost. What did you change afterwards?</p>
              <div className="ink" style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 400 }}><span className="dot live" /> Listening</div>
              <p className="ink" style={{ fontSize: 17, lineHeight: 1.75, minHeight: 120 }}>
                {WORDS.map(([word, delay, interim]) => (
                  <span key={delay}><span className={`w${interim ? " interim" : ""}`} style={{ animationDelay: `${delay}s` }}>{word}</span> </span>
                ))}
                <span className="caret" />
              </p>
              <div className="bar"><i style={{ width: "70%" }} /></div>
              <p style={{ fontSize: 13 }}>Answer 1:24 of 2:00</p>
            </div>
          </section>
        </div>

      <section style={{ background: "var(--ivory)", paddingBlock: GAP }}>
        <div className="wrap" style={{ display: "flex", flexDirection: "column", gap: 28, alignItems: "center", textAlign: "center" }}>
          <p className="eyebrow">The problem</p>
          <h2 className="serif" style={{ fontSize: "clamp(40px, 5.5vw, 72px)", lineHeight: 1.08, maxWidth: 900 }}>“I knew that answer. I just didn’t <span className="ital">say</span> it.”</h2>
          <p style={{ fontSize: 18, maxWidth: 620 }}>Good candidates lose interviews because they cannot present what they know under pressure. Reading tips does not fix that. Saying it out loud, many times, does.</p>
        </div>
      </section>

      <section id="how" className="wrap" style={{ paddingBlock: GAP, display: "flex", flexDirection: "column", gap: 64 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 640 }}>
          <p className="eyebrow">How it works</p>
          <h2 className="serif" style={H2}>From job post to <span className="ital">ready</span>, in four steps.</h2>
        </div>
        <ol style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 40, listStyle: "none", margin: 0, padding: 0 }}>
          {STEPS.map(([title, text], i) => (
            <li key={title} style={{ display: "flex", flexDirection: "column", gap: 14, borderTop: "1px solid var(--ink)", paddingTop: 22 }}>
              <span className="serif ital" style={{ fontSize: 22 }} aria-hidden="true">0{i + 1}</span>
              <h3 className="serif" style={{ fontSize: 30, lineHeight: 1.15 }}>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="tools" style={{ background: "var(--ivory)", paddingBlock: GAP }}>
        <div className="wrap" style={{ display: "flex", flexDirection: "column", gap: 56 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 24, flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p className="eyebrow">The five tools</p>
              <h2 className="serif" style={H2}>One round. Five ways to <span className="ital">prepare.</span></h2>
            </div>
            <p style={{ maxWidth: 360 }}>Every tool already knows the job, the round, and your resume.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            {TOOLS.map(([n, name, text]) => (
              <Link className="tile" href={SIGNIN} key={name}>
                <span className="n">{n}</span>
                <span style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span className="serif" style={{ fontSize: 30, lineHeight: 1.15 }}>{name}</span>
                  <span style={{ fontSize: 14 }}>{text}</span>
                </span>
                <span className="go ink" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="wrap" aria-label="How InterviewX is different" style={{ paddingBlock: GAP, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))", gap: 24 }}>
        <div className="card" style={{ padding: "clamp(28px, 6vw, 48px)", display: "flex", flexDirection: "column", gap: 18 }}>
          <p className="eyebrow">Other tools</p>
          <h3 className="serif" style={{ fontSize: "clamp(34px, 5vw, 44px)", lineHeight: 1.1, color: "var(--stone)" }}>Grade your answer.</h3>
          <p>One answer, one score, no idea if it would have worked.</p>
        </div>
        <div className="card" style={{ padding: "clamp(28px, 6vw, 48px)", display: "flex", flexDirection: "column", gap: 18, background: "var(--olive)", borderColor: "var(--olive)", color: "var(--on-olive)" }}>
          <p className="eyebrow" style={{ color: "inherit" }}>InterviewX</p>
          {/* The mock sets "offers." in gold. Gold on the dark theme's olive is too faint, so gold underlines it instead. */}
          <h3 className="serif" style={{ fontSize: "clamp(34px, 5vw, 44px)", lineHeight: 1.1, color: "inherit" }}>
            Learns which answers got <span style={{ fontStyle: "italic", textDecoration: "underline 2px var(--gold)", textUnderlineOffset: 6 }}>offers.</span>
          </h3>
          <p>You log each real round. Over time we see which practice leads to an offer, and coach toward it.</p>
        </div>
      </section>

      <section aria-label="Why this matters now" style={{ borderTop: "1px solid var(--hair)", borderBottom: "1px solid var(--hair)" }}>
        <div className="wrap" style={{ paddingBlock: 96, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 48 }}>
          {STATS.map((s) => (
            <div key={s.source} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span className="serif num" style={{ fontSize: 88, lineHeight: 1 }}><CountUp to={s.to} />{s.unit}</span>
              <p className="ink" style={{ fontWeight: 400 }}>{s.text}</p>
              <p style={{ fontSize: 12 }}>Source: {s.source}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap" style={{ paddingBlock: GAP, display: "flex", flexDirection: "column", gap: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", flexWrap: "wrap", gap: 16 }}>
          <h2 className="serif" style={H2}>Hear it in <span className="ital">ninety seconds.</span></h2>
          <p style={{ fontSize: 14 }}>Pitch · 1:39 · captions on</p>
        </div>
        <video controls preload="metadata" playsInline src="/pitch.mp4" aria-label="InterviewX pitch video"
          style={{ display: "block", width: "100%", aspectRatio: "16 / 9", background: "var(--ivory)", border: "1px solid var(--hair)" }}>
          <track kind="captions" src="/pitch.vtt" srcLang="en" label="English" default />
        </video>
      </section>

      <section id="centers" style={{ background: "var(--ivory)", paddingBlock: GAP }}>
        <div className="wrap" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))", gap: 64, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <p className="eyebrow">For career centers</p>
            <h2 className="serif" style={H2}>Give every student their <span className="ital">repetitions.</span></h2>
            <p style={{ maxWidth: 440 }}>InterviewX starts with MBA programs. Tell us about your school and we will set up a pilot for your next recruiting season.</p>
          </div>
          <LeadForm />
        </div>
      </section>

      </main>

      <footer className="wrap" style={{ paddingBlock: 56, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
        <span className="mark" style={{ fontSize: 24 }}>Interview<i>X</i></span>
        <p style={{ fontSize: 14 }}>Practice the right part at the right time.</p>
        <Link className="nav" href={account.href}>{account.label}</Link>
      </footer>
    </>
  );
}
