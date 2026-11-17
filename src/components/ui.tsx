import type { ReactNode } from "react";
import type { Level, MemberStatus, QuestionType } from "@/lib/types";

export function PageHead({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="mb-1">{title}</h1>
        {subtitle && <div className="text-muted">{subtitle}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <p role="status" className="py-10 text-center text-muted">
      {label}
    </p>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="px-4 py-10 text-center text-muted">{children}</div>;
}

export function LevelBadge({ level }: { level: Level }) {
  return <span className={`badge ${level === "junior" ? "badge-info" : ""}`}>{level === "junior" ? "Junior" : "Fresher"}</span>;
}

export const TYPE_LABEL: Record<QuestionType, string> = {
  mcq: "Multiple choice",
  text: "Written",
  code: "Coding",
};

export function TypeBadge({ type }: { type: QuestionType }) {
  return <span className="badge">{TYPE_LABEL[type]}</span>;
}

const STATUS_LABEL: Record<MemberStatus, string> = {
  invited: "Not started",
  in_progress: "In progress",
  submitted: "Submitted",
};

const STATUS_CLASS: Record<MemberStatus, string> = {
  invited: "",
  in_progress: "badge-warning",
  submitted: "badge-success",
};

export function StatusBadge({ status }: { status: MemberStatus }) {
  return <span className={`badge ${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</span>;
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="text-[13px] text-muted">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
