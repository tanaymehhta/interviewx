import type { Metadata } from "next";
import type { ResumeAnalysis } from "@/lib/schemas";
import { requireProfile } from "@/lib/server";
import { TopBar } from "@/components/TopBar";
import { Settings } from "@/components/account/Settings";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { user, profile } = await requireProfile();
  const analysis = profile.resume_analysis as ResumeAnalysis | null;
  return (
    <div className="wrap" style={{ maxWidth: 960 }}>
      <TopBar active="settings" />
      <section style={{ padding: "56px 0 40px" }}>
        <h1 className="serif rise" style={{ fontSize: "clamp(48px, 8vw, 68px)", lineHeight: 1.02 }}>Settings</h1>
      </section>
      <Settings uid={user.id} profile={{
        name: profile.name ?? "", program: profile.program ?? "", roles: profile.target_roles.join(", "),
        theme: profile.theme === "dark" ? "dark" : "light", email: user.email ?? "",
        resume: profile.resume_path ? "pdf" : profile.resume_text ? "text" : null,
        stories: analysis ? analysis.stories.length : null,
      }} />
    </div>
  );
}
