import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { Loading, PageHead } from "@/components/ui";
import { QuestionForm } from "../QuestionForm";

export const metadata: Metadata = { title: "New question" };

export default function NewQuestionPage() {
  return (
    <>
      <PageHead title="New question" />
      <Suspense fallback={<Loading />}>
        <Guarded />
      </Suspense>
    </>
  );
}

async function Guarded() {
  await requireAdmin();
  return <QuestionForm />;
}
