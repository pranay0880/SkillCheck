"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SkillsInput } from "@/components/SkillsInput";
import Link from "next/link";
import type { CatalogRole } from "@/lib/types";
import { saveUser } from "../../actions";

export interface UserFormValue {
  name: string;
  employeeId: string;
  role: string;
  email: string;
  skills: string[];
}

const EMPTY: UserFormValue = { name: "", employeeId: "", role: "", email: "", skills: [] };

function Required() {
  return (
    <span className="text-danger" aria-hidden="true">
      {" "}
      *
    </span>
  );
}

export function UserForm({ id, initial, roles }: { id?: string; initial?: UserFormValue; roles: CatalogRole[] }) {
  const start = initial ?? EMPTY;
  const router = useRouter();
  const [name, setName] = useState(start.name);
  const [employeeId, setEmployeeId] = useState(start.employeeId);
  const [role, setRole] = useState(start.role);
  const [email, setEmail] = useState(start.email);
  const [skills, setSkills] = useState<string[]>(start.skills);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const roleSkills = roles.find((item) => item.name === role)?.skills ?? [];
  const otherSkills = skills.filter((skill) => !roleSkills.some((item) => item.toLowerCase() === skill.toLowerCase()));

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await saveUser(id ?? null, { name, employeeId, role, email, skills });
      if (!result.ok) {
        setError(result.message ?? "Could not save.");
        return;
      }
      if (!id) {
        setName(EMPTY.name);
        setEmployeeId(EMPTY.employeeId);
        setRole(EMPTY.role);
        setEmail(EMPTY.email);
        setSkills(EMPTY.skills);
      }
      router.push("/admin/users");
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} noValidate className="card max-w-3xl">
      <p className="hint mb-4">
        Fields marked <span className="text-danger">*</span> are required.
      </p>
      {error && (
        <p role="alert" className="alert alert-error">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <div className="field">
          <label className="label" htmlFor="user-name">
            Name
            <Required />
          </label>
          <input
            id="user-name"
            type="text"
            autoComplete="off"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            aria-required="true"
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="user-employee-id">
            Employee ID
            <Required />
          </label>
          <input
            id="user-employee-id"
            type="text"
            autoComplete="off"
            className="font-mono"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            required
            aria-required="true"
            aria-describedby="user-employee-id-hint"
          />
          <span id="user-employee-id-hint" className="hint">
            Must be unique. Letters, numbers and . _ / -
          </span>
        </div>
        <div className="field">
          <label className="label" htmlFor="user-role">
            Role
            <Required />
          </label>
          <select
            id="user-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
            aria-required="true"
            aria-describedby="user-role-hint"
          >
            <option value="">Choose a role</option>
            {roles.map((item) => (
              <option key={item.id} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
          <span id="user-role-hint" className="hint">
            Missing a role? Add it on <Link href="/admin/roles">Roles &amp; skills</Link>.
          </span>
        </div>
        <div className="field">
          <label className="label" htmlFor="user-email">
            Employee email
            <Required />
          </label>
          <input
            id="user-email"
            type="email"
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-required="true"
            aria-describedby="user-email-hint"
          />
          <span id="user-email-hint" className="hint">
            Must be unique.
          </span>
        </div>
      </div>

      <div className="field">
        <label className="label" htmlFor="user-skills">
          Skills
          <Required />
        </label>
        <SkillsInput
          id="user-skills"
          value={skills}
          onChange={setSkills}
          suggestions={roleSkills}
          describedBy="user-skills-hint"
        />
        <span id="user-skills-hint" className="hint">
          {role ? `Pick from the ${role} skills below. Add at least one.` : "Choose a role first to see its skills."}{" "}
          Skills must exist on <Link href="/admin/roles">Roles &amp; skills</Link>.
        </span>
        {role && otherSkills.length > 0 && (
          <p className="hint mt-1">Not part of {role}: {otherSkills.join(", ")}.</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? "Saving…" : id ? "Save changes" : "Add user"}
        </button>
        <button className="btn" type="button" onClick={() => router.push("/admin/users")}>
          Cancel
        </button>
      </div>
    </form>
  );
}
