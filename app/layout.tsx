import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Open_Sans } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";

// Swap the display serif here if the team gets IvyPresto Display.
const serif = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
});
const sans = Open_Sans({ variable: "--font-open-sans", subsets: ["latin"], weight: ["300", "400"] });

export const metadata: Metadata = {
  title: { default: "InterviewX", template: "%s · InterviewX" },
  description: "Practice the right part at the right time. Interview practice built around the job and each round.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Light unless the account chose Dark. Never follows the OS setting. Set on the server: no flash.
  const theme = (await cookies()).get("theme")?.value === "dark" ? "dark" : "light";
  return (
    <html lang="en" data-theme={theme} className={`${serif.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
