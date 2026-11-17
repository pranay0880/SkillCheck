import type { AnswerRecord, QuestionDoc } from "./types";

export function scoreMcq(correctOptionIds: string[], selected: string[] | undefined, points: number): number {
  if (!selected || selected.length !== correctOptionIds.length) return 0;
  const chosen = new Set(selected);
  return correctOptionIds.every((id) => chosen.has(id)) ? points : 0;
}

export function effectiveScore(answer: AnswerRecord | undefined): number | null {
  if (!answer) return 0;
  if (typeof answer.manualScore === "number") return answer.manualScore;
  if (typeof answer.autoScore === "number") return answer.autoScore;
  return null;
}

export interface ScoreSummary {
  earned: number;
  max: number;
  pendingCodeGrading: boolean;
  pendingWrittenCount: number;
  percent: number;
}

export type ScorableQuestion = Pick<QuestionDoc, "_id" | "type" | "points">;

export function summarize(questions: ScorableQuestion[], answers: Record<string, AnswerRecord>): ScoreSummary {
  let earned = 0;
  let max = 0;
  let pendingCodeGrading = false;
  let pendingWrittenCount = 0;
  for (const question of questions) {
    max += question.points;
    const key = String(question._id);
    const answer = answers[key];
    const score = effectiveScore(answer);
    if (score === null) {
      if (question.type === "code" && answer?.code?.trim()) pendingCodeGrading = true;
      if (question.type === "text" && answer?.text?.trim()) pendingWrittenCount += 1;
    } else {
      earned += score;
    }
  }
  earned = Math.round(earned * 100) / 100;
  return { earned, max, pendingCodeGrading, pendingWrittenCount, percent: max ? Math.round((earned / max) * 100) : 0 };
}

export function deadlineFor(startedAt: Date, durationMinutes: number): Date {
  return new Date(startedAt.getTime() + durationMinutes * 60 * 1000);
}

export const SUBMIT_GRACE_MS = 30 * 1000;
