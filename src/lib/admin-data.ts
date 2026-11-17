import "server-only";
import { questionsCol } from "./db";
import type { PickableQuestion } from "@/app/admin/(panel)/tests/TestForm";

export async function loadPickableQuestions(): Promise<PickableQuestion[]> {
  const questions = await (await questionsCol())
    .find({}, { projection: { title: 1, type: 1, level: 1, skill: 1, points: 1 } })
    .sort({ skill: 1, level: 1, type: 1, title: 1 })
    .toArray();
  return questions.map((question) => ({
    id: String(question._id),
    title: question.title,
    type: question.type,
    level: question.level,
    skill: question.skill,
    points: question.points,
  }));
}
