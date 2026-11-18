"use client";

import { useState, useTransition } from "react";
import { ActionButton } from "@/components/ActionButton";
import type { ActionResult } from "@/lib/types";
import { addSkill, deleteSkill, renameSkill } from "../../catalog-actions";

export interface SkillRowData {
  id: string;
  name: string;
  roles: string[];
  questions: number;
  users: number;
}

function Status({ result }: { result: ActionResult | null }) {
  if (!result?.message) return null;
  return (
    <span role="status" className={`text-sm ${result.ok ? "text-success" : "text-danger"}`}>
      {result.message}
    </span>
  );
}

export function AddSkillForm() {
  const [name, setName] = useState("");
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResult(null);
    startTransition(async () => {
      const outcome = await addSkill(name);
      setResult(outcome);
      if (outcome.ok) setName("");
    });
  };

  return (
    <form onSubmit={onSubmit} className="mb-4 flex flex-wrap items-end gap-2">
      <div className="min-w-[220px]">
        <label className="label mb-1 block" htmlFor="new-skill">
          New skill
        </label>
        <input id="new-skill" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Playwright" required />
      </div>
      <button type="submit" className="btn" disabled={pending}>
        {pending ? "Adding…" : "Add skill"}
      </button>
      <Status result={result} />
    </form>
  );
}

export function SkillRow({ skill }: { skill: SkillRowData }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(skill.name);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  const onRename = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResult(null);
    startTransition(async () => {
      const outcome = await renameSkill(skill.id, name);
      setResult(outcome);
      if (outcome.ok) setEditing(false);
    });
  };

  return (
    <tr>
      <td>
        {editing ? (
          <form onSubmit={onRename} className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor={`rename-${skill.id}`}>
              New name for {skill.name}
            </label>
            <input
              id={`rename-${skill.id}`}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="max-w-[220px]"
              required
            />
            <button type="submit" className="btn btn-sm btn-primary" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => {
                setEditing(false);
                setName(skill.name);
                setResult(null);
              }}
            >
              Cancel
            </button>
          </form>
        ) : (
          <span className="font-medium">{skill.name}</span>
        )}
        <Status result={result} />
      </td>
      <td className="text-sm text-muted">{skill.roles.length ? skill.roles.join(", ") : "No role"}</td>
      <td>{skill.questions}</td>
      <td>{skill.users}</td>
      <td className="text-right">
        {!editing && (
          <span className="inline-flex flex-wrap justify-end gap-2">
            <button type="button" className="btn btn-sm" onClick={() => setEditing(true)}>
              Rename
            </button>
            <ActionButton
              action={() => deleteSkill(skill.id)}
              label="Delete"
              pendingLabel="Deleting…"
              confirmText={`Delete the skill “${skill.name}”?`}
              className="btn btn-sm btn-danger"
            />
          </span>
        )}
      </td>
    </tr>
  );
}
