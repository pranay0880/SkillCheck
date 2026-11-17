"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

export function useOrigin(): string {
  return useSyncExternalStore(
    noopSubscribe,
    () => window.location.origin,
    () => "",
  );
}

const DARK_QUERY = "(prefers-color-scheme: dark)";

function subscribeDark(callback: () => void) {
  const query = window.matchMedia(DARK_QUERY);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

export function usePrefersDark(): boolean {
  return useSyncExternalStore(
    subscribeDark,
    () => window.matchMedia(DARK_QUERY).matches,
    () => false,
  );
}
