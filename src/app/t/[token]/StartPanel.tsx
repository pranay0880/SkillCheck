"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startTest } from "../actions";
import { enterFullscreen } from "./TestRunner";

export function StartPanel({ token, requireFullscreen }: { token: string; requireFullscreen: boolean }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const start = () => {
    if (requireFullscreen) enterFullscreen();
    startTransition(async () => {
      const result = await startTest(token);
      if (!result.ok) {
        setError(result.message ?? "Could not start the test.");
        return;
      }
      router.refresh();
    });
  };

  return (
    <div>
      {error && (
        <p role="alert" className="alert alert-error">
          {error}
        </p>
      )}
      <label className="mb-4 flex items-start gap-2 rounded-md border border-line bg-surface-2 p-3">
        <input type="checkbox" className="mt-1 h-4 w-4 shrink-0" checked={ready} onChange={(e) => setReady(e.target.checked)} />
        <span>
          I have read the recommendations, guidelines and warnings above. I will complete this test on my own, without help
          from other people or AI tools.
        </span>
      </label>
      <button className="btn btn-primary" type="button" onClick={start} disabled={!ready || pending}>
        {pending ? "Starting…" : requireFullscreen ? "Start test in fullscreen" : "Start test"}
      </button>
    </div>
  );
}
