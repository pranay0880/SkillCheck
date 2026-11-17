"use client";

import { useId, useState, type Dispatch, type SetStateAction } from "react";

interface SkillsInputProps {
  id: string;
  value: string[];
  onChange: Dispatch<SetStateAction<string[]>>;
  suggestions: string[];
  describedBy?: string;
}

export function SkillsInput({ id, value, onChange, suggestions, describedBy }: SkillsInputProps) {
  const listId = useId();
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const parts = raw
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    onChange((current) => {
      const existing = new Set(current.map((skill) => skill.toLowerCase()));
      const next = [...current];
      for (const part of parts) {
        if (!existing.has(part.toLowerCase())) {
          existing.add(part.toLowerCase());
          next.push(part);
        }
      }
      return next;
    });
    setDraft("");
  };

  const remove = (skill: string) => onChange((current) => current.filter((item) => item !== skill));

  const unused = suggestions.filter((skill) => !value.some((item) => item.toLowerCase() === skill.toLowerCase()));

  return (
    <div>
      {value.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-1.5" aria-label="Selected skills">
          {value.map((skill) => (
            <li key={skill} className="inline-flex items-center gap-1 rounded-full bg-info-soft py-0.5 pl-2.5 pr-1 text-sm font-medium text-primary">
              {skill}
              <button
                type="button"
                onClick={() => remove(skill)}
                aria-label={`Remove ${skill}`}
                className="grid h-5 w-5 cursor-pointer place-items-center rounded-full text-primary hover:bg-surface"
              >
                <span aria-hidden="true">×</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          id={id}
          type="text"
          list={listId}
          value={draft}
          aria-describedby={describedBy}
          placeholder="Type a skill and press Enter"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
              remove(value[value.length - 1]);
            }
          }}
          onBlur={() => add(draft)}
        />
        <button type="button" className="btn" onClick={() => add(draft)}>
          Add
        </button>
      </div>
      <datalist id={listId}>
        {unused.map((skill) => (
          <option key={skill} value={skill} />
        ))}
      </datalist>
      {unused.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[13px] text-muted">Quick add:</span>
          {unused.map((skill) => (
            <button key={skill} type="button" className="badge cursor-pointer hover:bg-line" onClick={() => add(skill)}>
              + {skill}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
