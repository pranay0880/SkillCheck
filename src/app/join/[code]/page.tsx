import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AuthShell } from "@/components/AuthShell";
import { testsCol } from "@/lib/db";
import { pluralize } from "@/lib/format";
import { JoinForm } from "./JoinForm";

export const metadata: Metadata = { title: "Start your test", referrer: "no-referrer" };

const SIDE = {
  sideTitle: "Ready for your assessment?",
  sideText: "Confirm it's you with your work email, employee ID and a code we send to your inbox.",
  sidePoints: ["Use a laptop or desktop computer", "Set aside enough time: the timer doesn't pause", "Read the instructions before you press Start"],
};

export default function JoinPage({ params }: PageProps<"/join/[code]">) {
  return (
    <Suspense
      fallback={
        <AuthShell {...SIDE} title="Loading your test…">
          <p role="status" className="m-0" style={{ color: "#75665b" }}>
            One moment.
          </p>
        </AuthShell>
      }
    >
      <Join params={params} />
    </Suspense>
  );
}

async function Join({ params }: { params: Promise<{ code: string }> }) {
  await connection();
  const { code } = await params;
  const test = /^[\w-]{10,40}$/.test(code)
    ? await (await testsCol()).findOne(
        { links: { $elemMatch: { code, enabled: true } } },
        { projection: { title: 1, durationMinutes: 1, questionIds: 1 } },
      )
    : null;

  if (!test) {
    return (
      <AuthShell
        {...SIDE}
        title="Link not active"
        subtitle="This test link isn't valid, or it has been turned off."
        footer={
          <Link href="/" className="font-medium" style={{ color: "#3b5bdb" }}>
            Back to home
          </Link>
        }
      >
        <p className="m-0">Please check the link in your email, or ask your team lead to send it again.</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      {...SIDE}
      title={test.title}
      subtitle={
        <span className="flex flex-wrap gap-2">
          <span className="rounded-full px-3 py-1 text-[13px]" style={{ background: "#e8edff", color: "#3a2e28" }}>
            {pluralize(test.questionIds.length, "question")}
          </span>
          <span className="rounded-full px-3 py-1 text-[13px]" style={{ background: "#e8edff", color: "#3a2e28" }}>
            {test.durationMinutes} minutes
          </span>
        </span>
      }
      footer="You'll see the instructions before the timer starts."
    >
      <JoinForm code={code} />
    </AuthShell>
  );
}
