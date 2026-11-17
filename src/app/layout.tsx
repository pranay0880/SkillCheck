import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "SkillCheck", template: "%s · SkillCheck" },
  description: "Internal coding and multiple-choice assessments for developers.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body suppressHydrationWarning>
        <a
          href="#main"
          className="absolute -left-[9999px] top-2 z-50 rounded-md bg-surface px-3 py-2 focus:left-2"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
