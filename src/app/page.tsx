import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Bookshelf, serif, WARM } from "@/components/warm-theme";
import { DEFAULT_ROLES } from "@/data/skills";
import { loadPublicCatalog } from "@/lib/catalog";

export const metadata: Metadata = {
  title: { absolute: "SkillCheck" },
  description:
    "SkillCheck is our in-house tool for understanding the technical skills across our team, through short multiple choice, written and coding tests.",
};

const C = WARM;
const PAGE_BG = "#e8edff";
const PANEL_BG = "#ffffff";
const ACCENT = "#3b5bdb";
const SKILL_COLORS = ["#ddd6f3", "#f6c9bb", "#f7e2a6", "#c9e8d7", "#cfe0f7", "#f4cfe0", "#d9ecc4", "#f9d9b8"];

const STEPS = [
  {
    title: "Open your link",
    text: "Your team lead emails it to you. It only works for you.",
    tile: "#ddd6f3",
    icon: (
      <>
        <rect x="10" y="18" width="44" height="30" rx="4" />
        <path d="M10 22l22 15 22-15" />
      </>
    ),
  },
  {
    title: "Confirm it's you",
    text: "Enter your work email and employee ID, then the 6-digit code we email you.",
    tile: "#f6c9bb",
    icon: (
      <>
        <rect x="16" y="28" width="32" height="22" rx="4" />
        <path d="M22 28v-6a10 10 0 0 1 20 0v6" />
        <circle cx="32" cy="39" r="3" />
      </>
    ),
  },
  {
    title: "Press Start",
    text: "Read the short instructions. The test opens in full screen and the timer begins.",
    tile: "#f7e2a6",
    icon: (
      <>
        <circle cx="32" cy="34" r="17" />
        <path d="M32 24v10l7 5M27 12h10" />
      </>
    ),
  },
  {
    title: "Answer and submit",
    text: "Answers save as you go. Submit when you're done, or it submits when time is up.",
    tile: "#c9e8d7",
    icon: (
      <>
        <rect x="16" y="12" width="32" height="40" rx="4" />
        <path d="M23 33l6 6 12-13" />
      </>
    ),
  },
];

const CHECKLIST = [
  "A laptop or desktop computer, not a phone",
  "A good internet connection and your charger",
  "Your work email open, for the code",
  "Other tabs and apps closed",
  "Enough quiet time to finish in one go",
];

const GOOD_TO_KNOW = [
  { title: "One try", text: "Each test can be submitted once." },
  { title: "The clock keeps going", text: "Once you press Start, the timer doesn't stop, even if you close the page." },
  { title: "One computer", text: "Use one device and one browser tab for the whole test." },
  { title: "Full screen", text: "Leaving full screen or switching tabs is noted for your reviewer." },
  { title: "Your own work", text: "Please don't ask others or use AI tools for answers." },
];

const FAQ = [
  { q: "I didn't get a link", a: "Check your spam folder. If it's not there, ask your team lead to send it again." },
  { q: "My internet dropped or the page closed", a: "Your answers are saved. Open the same link again on the same computer to carry on." },
  { q: "Can I take a break?", a: "No. The timer keeps running, so start only when you have enough time." },
  { q: "When will I get my result?", a: "Your team lead reviews it and will share the result with you." },
];

function SectionTitle({ id, eyebrow, children }: { id: string; eyebrow: string; children: ReactNode }) {
  return (
    <div className="mb-10 text-center">
      <p className="mb-2 text-sm font-medium uppercase tracking-[0.14em]" style={{ color: ACCENT }}>
        {eyebrow}
      </p>
      <h2 id={id} className={`${serif} text-3xl leading-tight sm:text-4xl`} style={{ color: C.ink }}>
        {children}
      </h2>
    </div>
  );
}

async function LiveRoles() {
  const { roles } = await loadPublicCatalog();
  return <RoleList roles={roles.filter((role) => role.skills.length > 0)} />;
}

function RoleList({ roles }: { roles: { name: string }[] }) {
  return (
    <ul className="mx-auto my-0 grid max-w-3xl list-none grid-cols-2 gap-3 p-0 md:grid-cols-4">
      {roles.map((role, index) => (
        <li
          key={role.name}
          className="grid place-items-center rounded-xl px-3 py-3 text-center text-[15px] font-semibold shadow-[0_2px_12px_rgba(58,46,40,0.06)]"
          style={{ background: SKILL_COLORS[index % SKILL_COLORS.length], color: C.ink }}
        >
          {role.name}
        </li>
      ))}
    </ul>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: PAGE_BG, color: C.ink }}>
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-6">
        <Link href="/" className={`${serif} text-2xl no-underline`} style={{ color: C.ink }}>
          SkillCheck
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 text-[15px] sm:gap-6">
          <a href="#how" className="hidden no-underline hover:underline sm:inline" style={{ color: C.ink }}>
            How it works
          </a>
          <a href="#before" className="hidden no-underline hover:underline sm:inline" style={{ color: C.ink }}>
            Before you start
          </a>
          <a href="#questions" className="hidden no-underline hover:underline md:inline" style={{ color: C.ink }}>
            Questions
          </a>
          <Link
            href="/admin"
            className="rounded-full px-4 py-1.5 text-sm no-underline"
            style={{ color: C.ink, border: `1px solid ${C.ink}33`, background: PANEL_BG }}
          >
            Admin
          </Link>
        </nav>
      </header>

      <main id="main">
        <section aria-labelledby="intro" className="px-6 pb-20 pt-10 text-center sm:pt-16">
          <p className="mb-4 text-[15px]" style={{ color: C.muted }}>
            Skill assessments for our team
          </p>
          <h1 id="intro" className={`${serif} mx-auto mb-5 max-w-3xl text-3xl leading-[1.08] sm:text-4xl lg:text-5xl`} style={{ color: C.ink }}>
            Your assessment, in one sitting.
          </h1>
          <p className="mx-auto mb-9 max-w-2xl text-lg leading-relaxed" style={{ color: C.muted }}>
            SkillCheck is our in-house tool for short skill tests. It shows each person&apos;s strengths and where they can grow.
          </p>
          <div className="mb-20 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#before"
              className="rounded-full bg-[#3b5bdb] px-6 py-3 text-[15px] font-medium text-white no-underline shadow-sm hover:bg-[#304bc0]"
            >
              Read before you start
            </a>
            <a href="#how" className="rounded-full px-6 py-3 text-[15px] no-underline hover:underline" style={{ color: C.ink }}>
              How it works →
            </a>
          </div>
          <Bookshelf />
        </section>

        <section id="how" aria-labelledby="how-title" className="scroll-mt-6 px-6 py-20" style={{ background: PANEL_BG }}>
          <div className="mx-auto max-w-6xl">
            <SectionTitle id="how-title" eyebrow="How it works">
              Four simple steps
            </SectionTitle>
            <ol className="m-0 grid list-none gap-6 p-0 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, index) => (
                <li key={step.title} className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgba(58,46,40,0.06)]">
                  <div className="grid h-36 place-items-center" style={{ background: step.tile }}>
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 64 64"
                      width="72"
                      height="72"
                      fill="none"
                      stroke={C.ink}
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {step.icon}
                    </svg>
                  </div>
                  <div className="p-5">
                    <p className="mb-1 text-sm font-medium" style={{ color: ACCENT }}>
                      Step {index + 1}
                    </p>
                    <h3 className="mb-1.5 text-lg font-semibold" style={{ color: C.ink }}>
                      {step.title}
                    </h3>
                    <p className="m-0 text-[15px] leading-relaxed" style={{ color: C.muted }}>
                      {step.text}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="skills-title" className="px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <SectionTitle id="skills-title" eyebrow="What we assess">
              Roles we assess
            </SectionTitle>
            <Suspense fallback={<RoleList roles={DEFAULT_ROLES} />}>
              <LiveRoles />
            </Suspense>
            <p className="mt-8 text-center text-[15px]" style={{ color: C.muted }}>
              Your test covers the skills for your role: multiple choice, short written answers and, for developers, simple coding tasks.
            </p>
          </div>
        </section>

        <section id="before" aria-labelledby="before-title" className="scroll-mt-6 px-6 pb-20">
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
            <div className="rounded-2xl p-8 shadow-[0_2px_12px_rgba(58,46,40,0.06)]" style={{ background: PANEL_BG }}>
              <h2 id="before-title" className={`${serif} mb-6 text-3xl`} style={{ color: C.ink }}>
                Before you start
              </h2>
              <ul className="m-0 list-none space-y-3.5 p-0">
                {CHECKLIST.map((item) => (
                  <li key={item} className="flex gap-3 text-[16px]">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-sm text-white"
                      style={{ background: ACCENT }}
                    >
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl p-8 shadow-[0_2px_12px_rgba(58,46,40,0.06)]" style={{ background: PANEL_BG }}>
              <h2 className={`${serif} mb-6 text-3xl`} style={{ color: C.ink }}>
                Good to know
              </h2>
              <dl className="m-0 space-y-4">
                {GOOD_TO_KNOW.map((item) => (
                  <div key={item.title} className="border-l-[3px] pl-4" style={{ borderColor: ACCENT }}>
                    <dt className="font-semibold">{item.title}</dt>
                    <dd className="m-0 text-[15px]" style={{ color: C.muted }}>
                      {item.text}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        <section id="questions" aria-labelledby="faq-title" className="scroll-mt-6 px-6 pb-24">
          <div className="mx-auto max-w-3xl">
            <SectionTitle id="faq-title" eyebrow="Questions">
              Things people often ask
            </SectionTitle>
            <div className="space-y-3">
              {FAQ.map((item) => (
                <details key={item.q} className="group rounded-xl bg-white shadow-[0_2px_10px_rgba(58,46,40,0.05)]">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 text-[16px] font-medium [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <span aria-hidden="true" className="text-2xl leading-none transition-transform group-open:rotate-45" style={{ color: ACCENT }}>
                      +
                    </span>
                  </summary>
                  <p className="m-0 px-6 pb-5 text-[15px]" style={{ color: C.muted }}>
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer style={{ background: C.navy }} className="px-6 py-12 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-6">
          <div>
            <p className={`${serif} mb-1 text-2xl`}>SkillCheck</p>
            <p className="m-0 text-[15px] text-white/75">Skill assessments for our team. Still unsure? Ask your team lead.</p>
          </div>
          <Link href="/admin" className="rounded-full border border-white/40 px-4 py-1.5 text-sm text-white no-underline hover:bg-white/10">
            Admin login
          </Link>
        </div>
      </footer>
    </div>
  );
}
