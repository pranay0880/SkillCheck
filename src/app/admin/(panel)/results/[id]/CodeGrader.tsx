"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { runCode } from "@/lib/code-runner";
import type { TestCase } from "@/lib/types";
import { saveCodeGrades } from "../../../actions";

export interface GradeItem {
  questionId: string;
  code: string;
  functionName: string;
  testCases: TestCase[];
}

export function CodeGrader({ memberId, items, autoRun }: { memberId: string; items: GradeItem[]; autoRun: boolean }) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const started = useRef(false);

  const grade = useCallback(async () => {
    setRunning(true);
    setStatus(`Running ${items.length} coding answer${items.length === 1 ? "" : "s"} against all test cases…`);
    const grades = [];
    for (const item of items) {
      const outcome = await runCode(item.code, item.functionName, item.testCases);
      grades.push({
        questionId: item.questionId,
        caseResults: outcome.results.map((result) => ({
          passed: result.passed,
          hidden: result.hidden,
          error: (result.error ?? outcome.fatalError)?.slice(0, 500),
        })),
      });
    }
    const saved = await saveCodeGrades(memberId, grades);
    setRunning(false);
    setStatus(saved.ok ? "Code graded." : (saved.message ?? "Could not save grades."));
    router.refresh();
  }, [items, memberId, router]);

  useEffect(() => {
    if (autoRun && !started.current && items.length > 0) {
      started.current = true;
      void grade();
    }
  }, [autoRun, grade, items.length]);

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" className="btn" onClick={() => void grade()} disabled={running}>
        {running ? "Grading…" : "Re-run code grading"}
      </button>
      {status && (
        <span role="status" className="text-sm text-muted">
          {status}
        </span>
      )}
    </div>
  );
}
