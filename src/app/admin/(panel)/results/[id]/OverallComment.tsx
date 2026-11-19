"use client";

import { useState, useTransition } from "react";
import { OVERALL_COMMENT_LIMIT } from "@/lib/types";
import { saveOverallComment } from "../../../actions";

interface OverallCommentProps {
  memberId: string;
  comment?: string;
  savedAt?: string;
}

export function OverallComment({ memberId, comment, savedAt }: OverallCommentProps) {
  const [text, setText] = useState(comment ?? "");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const changed = text.trim() !== (comment ?? "");

  const save = () =>
    startTransition(async () => {
      const result = await saveOverallComment(memberId, text);
      setMessage({ ok: result.ok, text: result.message ?? (result.ok ? "Saved." : "Could not save.") });
    });

  return (
    <section aria-labelledby="overall-comment" className="card">
      <h2 id="overall-comment" className="mb-1">
        Examiner&apos;s overall comment
      </h2>
      <p className="hint mb-3">
        Your summary of this attempt: strengths, gaps and a recommendation. Only admins see it; it is included in the PDF report and the CSV.
      </p>
      <label className="sr-only" htmlFor="overall-comment-text">
        Overall comment
      </label>
      <textarea
        id="overall-comment-text"
        rows={5}
        maxLength={OVERALL_COMMENT_LIMIT}
        value={text}
        placeholder="For example: Strong on JavaScript basics and wrote clean code. Needs practice with async/await. Recommended for the frontend team."
        onChange={(e) => {
          setText(e.target.value);
          setMessage(null);
        }}
      />
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-primary btn-sm" onClick={save} disabled={pending || !changed}>
          {pending ? "Saving…" : "Save comment"}
        </button>
        <span className="text-sm text-muted">
          {text.length} / {OVERALL_COMMENT_LIMIT}
        </span>
        {savedAt && !message && <span className="text-sm text-muted">Last saved {savedAt}</span>}
        {message && (
          <span role="status" className={`text-sm ${message.ok ? "text-success" : "text-danger"}`}>
            {message.text}
          </span>
        )}
      </div>
    </section>
  );
}
