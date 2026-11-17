import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { loadPickableQuestions } from "@/lib/admin-data";
import { Loading, PageHead } from "@/components/ui";
import { TestForm } from "../TestForm";

export const metadata: Metadata = { title: "New test" };

export default function NewTestPage() {
  return (
    <>
      <PageHead title="New test" subtitle="Pick questions and set a time limit. You can invite developers after saving." />
      <Suspense fallback={<Loading />}>
        <Form />
      </Suspense>
    </>
  );
}

async function Form() {
  await requireAdmin();
  return <TestForm questions={await loadPickableQuestions()} />;
}
