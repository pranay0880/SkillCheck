"use client";

import { useId, useState, useTransition } from "react";
import { setManualScore } from "../../../actions";

interface ManualScoreProps {
  memberId: string;
  questionId: string;
  points: number;
  autoScore?: number;
  manualScore?: number;
  note?: string;
}

export function ManualScore({ memberId, questionId, points, autoScore, manualScore, note }: ManualScoreProps) {
  const fieldId = useId();
  const [score, setScore] = useState(manualScore === undefined ? "" : String(manualScore));
  const [comment, setComment] = useState(note ?? "");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const save = (clear: boolean) =>
    startTransition(async () => {
      const value = clear || score.trim() === "" ? null : Number(score);
      const result = await setManualScore(memberId, questionId, value, comment);
      if (clear && result.ok) setScore("");
      setMessage({ ok: result.ok, text: result.message ?? (result.ok ? "Saved." : "Could not save.") });
    });

  return (
    <div className="mt-4 rounded-md border border-line bg-surface-2 p-3">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="label mb-1 block" htmlFor={`${fieldId}-score`}>
            Your mark (0–{points})
          </label>
          <input
            id={`${fieldId}-score`}
            type="number"
            min={0}
            max={points}
            step={0.5}
            className="max-w-[110px]"
            value={score}
            placeholder={autoScore === undefined ? "" : String(autoScore)}
            onChange={(e) => setScore(e.target.value)}
          />
        </div>
        <div className="min-w-[220px] flex-1">
          <label className="label mb-1 block" htmlFor={`${fieldId}-note`}>
            Reviewer note (private)
          </label>
          <input id={`${fieldId}-note`} type="text" value={comment} onChange={(e) => setComment(e.target.value)} />
        </div>
        <button type="button" className="btn btn-sm" onClick={() => save(false)} disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </button>
        {manualScore !== undefined && (
          <button type="button" className="btn btn-sm" onClick={() => save(true)} disabled={pending}>
            Use automatic score
          </button>
        )}
      </div>
      <p className="hint mt-2">Leave the mark empty to keep the automatic score. A mark you enter overrides it.</p>
      {message && (
        <p role="status" className={`mt-1 text-sm ${message.ok ? "text-success" : "text-danger"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
