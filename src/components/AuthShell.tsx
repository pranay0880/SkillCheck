import Link from "next/link";
import type { ReactNode } from "react";
import { Bookshelf, serif, WARM, type Book } from "./warm-theme";

const AUTH_SHELF: Book[] = [
  { h: 84, w: 20, color: WARM.terracotta, band: WARM.mustard },
  { h: 96, w: 24, color: WARM.navy },
  { h: 76, w: 18, color: WARM.mustard },
  { h: 92, w: 22, color: WARM.teal, band: WARM.cream, label: "React" },
  { h: 70, w: 16, color: WARM.sage, tilt: -9 },
  { h: 0, w: 10, color: "transparent" },
  { h: 98, w: 24, color: WARM.terracotta, band: WARM.cream },
  { h: 86, w: 20, color: WARM.mustard, band: WARM.navy, label: "SQL" },
  { h: 80, w: 18, color: WARM.navy },
  { h: 90, w: 22, color: WARM.teal },
  { h: 74, w: 18, color: WARM.mustard, tilt: 8 },
];

interface AuthShellProps {
  sideTitle: string;
  sideText: string;
  sidePoints?: string[];
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({ sideTitle, sideText, sidePoints, title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="grid min-h-screen place-items-center px-4 py-8 sm:py-12" style={{ background: WARM.cream, color: WARM.ink }}>
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-[0_24px_60px_-28px_rgba(58,46,40,0.35)] md:grid-cols-[1fr_1.05fr]">
        <aside className="relative flex flex-col justify-between gap-8 p-7 sm:p-10" style={{ background: WARM.paper }}>
          <Link href="/" className={`${serif} w-fit text-2xl no-underline`} style={{ color: WARM.ink }}>
            SkillCheck
          </Link>
          <div className="hidden md:block">
            <Bookshelf books={AUTH_SHELF} maxWidth={360} />
          </div>
          <div>
            <h2 className={`${serif} mb-2 text-2xl leading-snug sm:text-3xl`} style={{ color: WARM.ink }}>
              {sideTitle}
            </h2>
            <p className="m-0 text-[15px] leading-relaxed" style={{ color: WARM.muted }}>
              {sideText}
            </p>
            {sidePoints && sidePoints.length > 0 && (
              <ul className="m-0 mt-4 hidden list-none space-y-2 p-0 md:block">
                {sidePoints.map((point) => (
                  <li key={point} className="flex gap-2.5 text-[14px]" style={{ color: WARM.ink }}>
                    <span
                      aria-hidden="true"
                      className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] text-white"
                      style={{ background: WARM.tealDeep }}
                    >
                      ✓
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        <main id="main" className="flex flex-col justify-center px-7 py-10 sm:px-12 sm:py-14">
          <h1 className={`${serif} mb-2 text-3xl leading-tight sm:text-4xl`} style={{ color: WARM.ink }}>
            {title}
          </h1>
          {subtitle && (
            <div className="mb-8 text-[15px]" style={{ color: WARM.muted }}>
              {subtitle}
            </div>
          )}
          <div className="auth-form">{children}</div>
          {footer && (
            <div className="mt-8 text-sm" style={{ color: WARM.muted }}>
              {footer}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
