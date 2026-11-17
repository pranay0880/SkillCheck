import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Brand } from "@/components/Brand";
import { Loading } from "@/components/ui";
import { testsCol } from "@/lib/db";
import { pluralize } from "@/lib/format";
import { JoinForm } from "./JoinForm";

export const metadata: Metadata = { title: "Join test", referrer: "no-referrer" };

export default function JoinPage({ params }: PageProps<"/join/[code]">) {
  return (
    <>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <Brand />
        </div>
      </header>
      <main id="main" className="mx-auto max-w-md px-4 py-10">
        <Suspense fallback={<Loading />}>
          <Join params={params} />
        </Suspense>
      </main>
    </>
  );
}

async function Join({ params }: { params: Promise<{ code: string }> }) {
  await connection();
  const { code } = await params;
  const test = /^[\w-]{10,40}$/.test(code)
    ? await (await testsCol()).findOne(
        { links: { $elemMatch: { code, enabled: true } } },
        { projection: { title: 1, description: 1, durationMinutes: 1, questionIds: 1 } },
      )
    : null;

  if (!test) {
    return (
      <div className="card">
        <h1 className="mb-2 text-xl">Link not active</h1>
        <p className="text-muted">This test link is not valid or has been turned off. Please check with your admin.</p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h1 className="mb-1 text-xl">{test.title}</h1>
      <p className="mb-4 text-sm text-muted">
        {pluralize(test.questionIds.length, "question")} · {test.durationMinutes} minutes
      </p>
      <p className="mb-5">
        Enter your employee email and employee ID. We will email you a one-time code to confirm it is you. You will see the
        instructions before the timer starts.
      </p>
      <JoinForm code={code} />
    </div>
  );
}
