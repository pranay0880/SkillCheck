import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { loadCatalog } from "@/lib/catalog";
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
  const { skills } = await loadCatalog();
  return <QuestionForm skills={skills} />;
}
