import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { loadPickableQuestions } from "@/lib/admin-data";
import { loadCatalog } from "@/lib/catalog";
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
  const [questions, { roles }] = await Promise.all([loadPickableQuestions(), loadCatalog()]);
  return <TestForm questions={questions} roles={roles} />;
}
