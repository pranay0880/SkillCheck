"use client";

import { useState, useTransition } from "react";
import type { ActionResult } from "@/lib/types";

interface ActionButtonProps {
  action: () => Promise<ActionResult | void>;
  label: string;
  pendingLabel?: string;
  confirmText?: string;
  className?: string;
}

export function ActionButton({ action, label, pendingLabel, confirmText, className = "btn btn-sm" }: ActionButtonProps) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);

  const onClick = () => {
    if (confirmText && !window.confirm(confirmText)) return;
    startTransition(async () => {
      const outcome = await action();
      setResult(outcome ?? null);
    });
  };

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button type="button" className={className} onClick={onClick} disabled={pending}>
        {pending ? (pendingLabel ?? "Working…") : label}
      </button>
      {result?.message && (
        <span role="status" className={`text-sm ${result.ok ? "text-success" : "text-danger"}`}>
          {result.message}
        </span>
      )}
    </span>
  );
}
