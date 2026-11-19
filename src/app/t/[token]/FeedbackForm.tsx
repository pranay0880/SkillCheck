"use client";

import Link from "next/link";
import { useState, useTransition, type ReactNode } from "react";
import {
  FEEDBACK_COMMENT_LIMIT,
  FEEDBACK_DIFFICULTIES,
  FEEDBACK_DIFFICULTY_LABEL,
  FEEDBACK_RATING_LABEL,
  FEEDBACK_RATINGS,
  FEEDBACK_TIMING_LABEL,
  FEEDBACK_TIMINGS,
} from "@/lib/types";
import { submitFeedback } from "../actions";

interface ChoiceGroupProps {
  legend: string;
  name: string;
  value: string;
  options: { value: string; label: ReactNode }[];
  onChange: (value: string) => void;
}

function ChoiceGroup({ legend, name, value, options, onChange }: ChoiceGroupProps) {
  return (
    <fieldset>
      <legend>{legend}</legend>
      <div className="flex flex-wrap gap-2 pt-1">
        {options.map((option) => {
          const checked = value === option.value;
          return (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary ${
                checked ? "border-primary bg-info-soft font-semibold" : "border-line bg-surface"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="accent-[var(--primary)]"
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function FeedbackForm({ token }: { token: string }) {
  const [rating, setRating] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [timing, setTiming] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  const send = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!rating || !difficulty || !timing) {
      setError("Please answer the three questions above. The comment is optional.");
      return;
    }
    startTransition(async () => {
      const result = await submitFeedback(token, { rating, difficulty, timing, comment });
      if (result.ok) {
        setSent(true);
        setError(null);
      } else {
        setError(result.message ?? "Could not send your feedback. Please try again.");
      }
    });
  };

  if (sent) {
    return (
      <p role="status" className="alert alert-success mt-4">
        Thanks for your feedback. It helps us improve these tests.
      </p>
    );
  }

  return (
    <form onSubmit={send} className="mt-5 border-t border-line pt-5" aria-labelledby="feedback-title" noValidate>
      <h2 id="feedback-title" className="mb-1 text-lg text-fg">
        How was the test?
      </h2>
      <p className="mb-4 text-sm">Your feedback is optional and does not affect your score.</p>

      <ChoiceGroup
        legend="Overall experience"
        name="rating"
        value={rating}
        onChange={setRating}
        options={FEEDBACK_RATINGS.map((value) => ({
          value: String(value),
          label: (
            <>
              <span aria-hidden="true">{value}</span>
              <span>{FEEDBACK_RATING_LABEL[value]}</span>
            </>
          ),
        }))}
      />
      <ChoiceGroup
        legend="Difficulty of the questions"
        name="difficulty"
        value={difficulty}
        onChange={setDifficulty}
        options={FEEDBACK_DIFFICULTIES.map((value) => ({ value, label: FEEDBACK_DIFFICULTY_LABEL[value] }))}
      />
      <ChoiceGroup
        legend="Time given"
        name="timing"
        value={timing}
        onChange={setTiming}
        options={FEEDBACK_TIMINGS.map((value) => ({ value, label: FEEDBACK_TIMING_LABEL[value] }))}
      />

      <label className="label mb-1 block text-fg" htmlFor="feedback-comment">
        Anything else? <span className="font-normal text-muted">(optional)</span>
      </label>
      <textarea
        id="feedback-comment"
        rows={4}
        maxLength={FEEDBACK_COMMENT_LIMIT}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="For example: a question that was unclear, a technical problem, or a topic you expected."
      />
      <p className="hint mt-1">
        {comment.length} / {FEEDBACK_COMMENT_LIMIT}
      </p>

      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Sending…" : "Send feedback"}
        </button>
        <Link href="/" className="btn no-underline">
          Skip
        </Link>
      </div>
    </form>
  );
}
