"use client";

import { useId, useState, useTransition } from "react";
import { ActionButton } from "@/components/ActionButton";
import type { ActionResult } from "@/lib/types";
import { deleteRole, saveRole } from "../../catalog-actions";

interface RoleFormProps {
  role?: { id: string; name: string; skills: string[] };
  allSkills: string[];
}

export function RoleForm({ role, allSkills }: RoleFormProps) {
  const formId = useId();
  const [name, setName] = useState(role?.name ?? "");
  const [chosen, setChosen] = useState<string[]>(role?.skills ?? []);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  const toggle = (skill: string, on: boolean) =>
    setChosen((current) => (on ? [...current, skill] : current.filter((item) => item !== skill)));

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResult(null);
    startTransition(async () => {
      const outcome = await saveRole(role?.id ?? null, { name, skills: chosen });
      setResult(outcome);
      if (outcome.ok && !role) {
        setName("");
        setChosen([]);
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="field mb-0 max-w-sm">
        <label className="label" htmlFor={`${formId}-name`}>
          Role name
        </label>
        <input id={`${formId}-name`} type="text" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <fieldset className="m-0 border-0 p-0">
        <legend className="label mb-2">
          Skills for this role <span className="font-normal text-muted">({chosen.length} selected)</span>
        </legend>
        <div className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {allSkills.map((skill) => (
            <label key={skill} className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" checked={chosen.includes(skill)} onChange={(e) => toggle(skill, e.target.checked)} />
              {skill}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : role ? "Save role" : "Add role"}
        </button>
        {role && (
          <ActionButton
            action={() => deleteRole(role.id)}
            label="Delete role"
            pendingLabel="Deleting…"
            confirmText={`Delete the role “${role.name}”?`}
            className="btn btn-danger"
          />
        )}
        {result?.message && (
          <span role="status" className={`text-sm ${result.ok ? "text-success" : "text-danger"}`}>
            {result.message}
          </span>
        )}
      </div>
    </form>
  );
}
