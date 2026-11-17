"use client";

import { useCallback, useSyncExternalStore } from "react";

function sections(containerId: string): HTMLDetailsElement[] {
  const container = document.getElementById(containerId);
  return container ? [...container.querySelectorAll<HTMLDetailsElement>(":scope > details")] : [];
}

export function AccordionControls({ containerId }: { containerId: string }) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const container = document.getElementById(containerId);
      container?.addEventListener("toggle", onChange, true);
      return () => container?.removeEventListener("toggle", onChange, true);
    },
    [containerId],
  );

  const allOpen = useSyncExternalStore(
    subscribe,
    () => {
      const list = sections(containerId);
      return list.length > 0 && list.every((details) => details.open);
    },
    () => false,
  );

  const toggleAll = () => {
    for (const details of sections(containerId)) details.open = !allOpen;
  };

  return (
    <button type="button" className="btn btn-sm" onClick={toggleAll} aria-controls={containerId}>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {allOpen ? <path d="M7 15l5-5 5 5" /> : <path d="M7 10l5 5 5-5" />}
      </svg>
      {allOpen ? "Collapse all" : "Expand all"}
    </button>
  );
}
