import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/server";
import { SignInForm } from "@/components/account/SignInForm";
import { safeNext } from "@/components/account/shared";

export const metadata: Metadata = { title: "Sign in" };

const PAD = "48px clamp(16px, 5vw, 64px)";

export default async function SignIn({ searchParams }: { searchParams: Promise<{ next?: string | string[]; error?: string | string[] }> }) {
  const { next, error } = await searchParams;
  const dest = safeNext(next);
  const { user } = await getUser();
  if (user) redirect(dest ?? "/jobs");

  return (
    <div style={{ display: "flex", flexWrap: "wrap", minHeight: "100vh" }}>
      <aside style={{ flex: "1 1 520px", background: "var(--ivory)", padding: PAD, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 48 }}>
        <Link className="mark rise" href="/">Interview<i>X</i></Link>
        <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 520 }}>
          <p className="eyebrow rise d1">Before you begin</p>
          <p className="serif rise d2" style={{ fontSize: "clamp(40px, 6vw, 58px)", lineHeight: 1.05 }}>
            Your next interview, <span className="ital">rehearsed</span> until it feels familiar.
          </p>
        </div>
        <p className="rise d3" style={{ fontSize: 14 }}>No password. We send you a one-time link.</p>
      </aside>
      <main style={{ flex: "1 1 520px", padding: PAD, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <SignInForm next={dest} expired={error === "expired"} />
        </div>
      </main>
    </div>
  );
}
