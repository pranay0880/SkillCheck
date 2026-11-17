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
