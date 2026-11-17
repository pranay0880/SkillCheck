"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useOrigin } from "@/lib/browser-hooks";
import type { ActionResult, LinkAudience } from "@/lib/types";
import { createTestLink, deleteTestLink, emailTestLink, setTestLinkEnabled } from "../../../actions";

export interface LinkView {
  code: string;
  label: string;
  audience: LinkAudience;
  roles: string[];
  userNames: string[];
  enabled: boolean;
  eligibleCount: number;
  pendingCount: number;
  lastEmailedAt: string | null;
  lastEmailedCount: number;
}

export interface PickUser {
  id: string;
  name: string;
  employeeId: string;
  role: string;
}

interface TestLinksCardProps {
  testId: string;
  links: LinkView[];
  users: PickUser[];
  roles: string[];
  emailReady: boolean;
}

function audienceText(link: LinkView): string {
  if (link.audience === "roles") return `Role: ${link.roles.join(", ")}`;
  if (link.audience === "users") {
    const names = link.userNames.slice(0, 3).join(", ");
    const more = link.userNames.length > 3 ? ` +${link.userNames.length - 3} more` : "";
    return `Selected: ${names}${more}`;
  }
  return "All employees";
}

export function TestLinksCard({ testId, links, users, roles, emailReady }: TestLinksCardProps) {
  const [creating, setCreating] = useState(links.length === 0);
  return (
    <section className="card" aria-labelledby="test-links-heading">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h2 id="test-links-heading">Test links</h2>
        {!creating && (
          <button type="button" className="btn btn-sm btn-primary" onClick={() => setCreating(true)}>
            New link
          </button>
        )}
      </div>
      <p className="mb-4 text-sm text-muted">
        Share a link with the people in its audience. To open it, an employee enters their email and employee ID, then a
        one-time code sent to their email. The test is then locked to them.
      </p>

      {!emailReady && (
        <p className="alert alert-warning text-sm">
          Email is not set up yet (RESEND_API_KEY and EMAIL_FROM), so codes and invites can&apos;t be emailed. In local
          development the code is shown on screen instead.
        </p>
      )}

      {creating && (
        <NewLinkForm testId={testId} users={users} roles={roles} onDone={() => setCreating(false)} canCancel={links.length > 0} />
      )}

      {links.length === 0 && !creating && <p className="text-muted">No links yet.</p>}
      {links.length > 0 && (
        <ul className="flex flex-col gap-3">
          {links.map((link) => (
            <LinkRow key={link.code} testId={testId} link={link} emailReady={emailReady} />
          ))}
        </ul>
      )}
    </section>
  );
}

function LinkRow({ testId, link, emailReady }: { testId: string; link: LinkView; emailReady: boolean }) {
  const origin = useOrigin();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  const url = `${origin}/join/${link.code}`;
  let emailBlockedReason: string | null = null;
  if (!emailReady) emailBlockedReason = "Email is not set up (RESEND_API_KEY and EMAIL_FROM).";
  else if (!link.enabled) emailBlockedReason = "Turn the link on to email it.";
  else if (link.eligibleCount === 0) emailBlockedReason = "No employees match this link's audience.";
  else if (link.pendingCount === 0) {
    emailBlockedReason =
      link.eligibleCount === 1
        ? "Nothing to send: this employee has already submitted."
        : "Nothing to send: everyone in this link's audience has already submitted.";
  }

  const run = (action: () => Promise<ActionResult>, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    startTransition(async () => setResult(await action()));
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  };

  return (
    <li className={`rounded-lg border border-line p-4 ${link.enabled ? "" : "opacity-70"}`}>
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="m-0 font-semibold">
            {link.label || audienceText(link)}{" "}
            <span className={`badge ${link.enabled ? "badge-success" : ""}`}>{link.enabled ? "On" : "Off"}</span>
          </p>
          <p className="m-0 text-[13px] text-muted">
            {link.label ? `${audienceText(link)} · ` : ""}
            {link.eligibleCount} employee{link.eligibleCount === 1 ? "" : "s"} · {link.pendingCount} not submitted yet
            {link.lastEmailedAt && ` · last emailed to ${link.lastEmailedCount} on ${new Date(link.lastEmailedAt).toLocaleString()}`}
          </p>
        </div>
      </div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <code className="break-all rounded-md border border-line bg-surface-2 px-2.5 py-1.5 text-[13px]">{url}</code>
        <button type="button" className="btn btn-sm" onClick={copy} disabled={!link.enabled}>
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="btn btn-sm btn-primary"
          disabled={pending || emailBlockedReason !== null}
          title={emailBlockedReason ?? undefined}
          aria-describedby={emailBlockedReason ? `email-reason-${link.code}` : undefined}
          onClick={() =>
            run(
              () => emailTestLink(testId, link.code),
              link.pendingCount === 1
                ? "Email this link to the 1 employee in its audience who hasn't submitted yet?"
                : `Email this link to the ${link.pendingCount} employees in its audience who haven't submitted yet?`,
            )
          }
        >
          {pending ? "Working…" : "Email this link"}
        </button>
        <button type="button" className="btn btn-sm" disabled={pending} onClick={() => run(() => setTestLinkEnabled(testId, link.code, !link.enabled))}>
          {link.enabled ? "Turn off" : "Turn on"}
        </button>
        <button
          type="button"
          className="btn btn-sm btn-danger"
          disabled={pending}
          onClick={() => run(() => deleteTestLink(testId, link.code), "Delete this link? It will stop working immediately. Results already submitted are kept.")}
        >
          Delete
        </button>
        {emailBlockedReason && !result?.message && (
          <span id={`email-reason-${link.code}`} className="text-[13px] text-muted">
            {emailBlockedReason}
          </span>
        )}
        {result?.message && (
          <span role="status" className={`text-sm ${result.ok ? "text-success" : "text-danger"}`}>
            {result.message}
          </span>
        )}
      </div>
    </li>
  );
}

function NewLinkForm({
  testId,
  users,
  roles,
  onDone,
  canCancel,
}: {
  testId: string;
  users: PickUser[];
  roles: string[];
  onDone: () => void;
  canCancel: boolean;
}) {
  const [label, setLabel] = useState("");
  const [audience, setAudience] = useState<LinkAudience>("all");
  const [chosenRoles, setChosenRoles] = useState<string[]>([]);
  const [chosenUsers, setChosenUsers] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return users.filter(
      (user) =>
        (!needle || user.name.toLowerCase().includes(needle) || user.employeeId.toLowerCase().includes(needle)) &&
        (!roleFilter || user.role === roleFilter),
    );
  }, [users, query, roleFilter]);
  const allShownChosen = shown.length > 0 && shown.every((user) => chosenUsers.includes(user.id));

  const toggleIn = (list: string[], value: string) => (list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);

  const submit = () =>
    startTransition(async () => {
      setError(null);
      const result = await createTestLink(testId, { label, audience, roles: chosenRoles, userIds: chosenUsers });
      if (!result.ok) {
        setError(result.message ?? "Could not create the link.");
        return;
      }
      onDone();
    });

  return (
    <div className="mb-4 rounded-lg border border-primary/40 bg-info-soft/40 p-4">
      <h3 className="mb-3">New link</h3>
      {error && (
        <p role="alert" className="alert alert-error">
          {error}
        </p>
      )}
      <div className="field">
        <label className="label" htmlFor="link-label">
          Label <span className="font-normal text-muted">(optional, e.g. “QA team — November”)</span>
        </label>
        <input id="link-label" type="text" value={label} maxLength={60} onChange={(e) => setLabel(e.target.value)} />
      </div>

      <fieldset>
        <legend>Who can use this link</legend>
        <div className="flex flex-col gap-2">
          <label className="flex items-start gap-2">
            <input type="radio" name="link-audience" className="mt-1" checked={audience === "all"} onChange={() => setAudience("all")} />
            <span>
              All employees <span className="text-[13px] text-muted">({users.length} on the Users page)</span>
            </span>
          </label>
          <label className="flex items-start gap-2">
            <input type="radio" name="link-audience" className="mt-1" checked={audience === "roles"} onChange={() => setAudience("roles")} />
            <span>By role (department)</span>
          </label>
          <label className="flex items-start gap-2">
            <input type="radio" name="link-audience" className="mt-1" checked={audience === "users"} onChange={() => setAudience("users")} />
            <span>Selected employees</span>
          </label>
        </div>
      </fieldset>

      {audience === "roles" && (
        <div className="mb-4">
          {roles.length === 0 ? (
            <p className="text-muted">
              No roles yet. <Link href="/admin/users/new">Add users</Link> with a role first.
            </p>
          ) : (
            <div role="group" aria-label="Roles" className="flex flex-wrap gap-1.5">
              {roles.map((role) => {
                const count = users.filter((user) => user.role === role).length;
                return (
                  <button
                    key={role}
                    type="button"
                    aria-pressed={chosenRoles.includes(role)}
                    onClick={() => setChosenRoles((current) => toggleIn(current, role))}
                    className="badge cursor-pointer aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-on-primary"
                  >
                    {role} · {count}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {audience === "users" && (
        <div className="mb-4">
          <div className="mb-2 flex flex-wrap items-end gap-3">
            <div className="min-w-[180px] flex-1">
              <label className="label mb-1 block" htmlFor="link-user-search">
                Search
              </label>
              <input id="link-user-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name or employee ID" />
            </div>
            <div>
              <label className="label mb-1 block" htmlFor="link-user-role">
                Role
              </label>
              <select id="link-user-role" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="">All roles</option>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() =>
                setChosenUsers((current) =>
                  allShownChosen
                    ? current.filter((id) => !shown.some((user) => user.id === id))
                    : Array.from(new Set([...current, ...shown.map((user) => user.id)])),
                )
              }
              disabled={shown.length === 0}
            >
              {allShownChosen ? "Unselect shown" : `Select shown (${shown.length})`}
            </button>
          </div>
          <p role="status" className="mb-2 text-sm">
            <strong>{chosenUsers.length}</strong> selected
          </p>
          <ul className="max-h-64 divide-y divide-line overflow-y-auto rounded-md border border-line bg-surface" aria-label="Employees">
            {shown.length === 0 && <li className="px-3 py-3 text-center text-muted">No employees match.</li>}
            {shown.map((user) => (
              <li key={user.id}>
                <label className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-surface-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={chosenUsers.includes(user.id)}
                    onChange={() => setChosenUsers((current) => toggleIn(current, user.id))}
                  />
                  <span className="flex-1">
                    {user.name} <span className="font-mono text-[13px] text-muted">{user.employeeId}</span>
                    <span className="block text-[13px] text-muted">{user.role}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary" onClick={submit} disabled={pending}>
          {pending ? "Creating…" : "Create link"}
        </button>
        {canCancel && (
          <button type="button" className="btn" onClick={onDone} disabled={pending}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
