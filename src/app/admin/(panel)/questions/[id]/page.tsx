import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { questionsCol } from "@/lib/db";
import { toObjectId } from "@/lib/ids";
import { Loading, PageHead } from "@/components/ui";
import { QuestionForm, type QuestionFormValue } from "../QuestionForm";

export const metadata: Metadata = { title: "Edit question" };

export default function EditQuestionPage({ params }: PageProps<"/admin/questions/[id]">) {
  return (
    <>
      <PageHead title="Edit question" />
      <Suspense fallback={<Loading />}>
        <Editor params={params} />
      </Suspense>
    </>
  );
}

async function Editor({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const objectId = toObjectId(id);
  const question = objectId ? await (await questionsCol()).findOne({ _id: objectId }) : null;
  if (!question) notFound();

  const initial: QuestionFormValue = {
    type: question.type,
    title: question.title,
    prompt: question.prompt,
    level: question.level,
    skill: question.skill,
    points: question.points,
    options: question.type === "mcq" ? question.options : [],
    correctOptionIds: question.type === "mcq" ? question.correctOptionIds : [],
    functionName: question.type === "code" ? question.functionName : "",
    starterCode: question.type === "code" ? question.starterCode : "",
    testCases: question.type === "code" ? question.testCases : [],
    markingGuide: question.type === "text" ? question.markingGuide : "",
  };

  return <QuestionForm id={id} initial={initial} />;
}
