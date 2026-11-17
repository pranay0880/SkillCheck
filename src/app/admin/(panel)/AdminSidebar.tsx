"use client";

import Link from "next/link";
import { Suspense, useId, useRef, useState } from "react";
import { Brand } from "@/components/Brand";
import { AdminNav, AdminNavFallback } from "./AdminNav";
import { logout } from "../actions";

export function AdminSidebar() {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);

  const close = () => setOpen(false);

  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape" && open) {
      setOpen(false);
      toggleRef.current?.focus();
    }
  };

  return (
    <aside
      aria-label="Admin sidebar"
      onKeyDown={onKeyDown}
      className="sticky top-0 z-40 border-b border-line bg-surface md:flex md:h-screen md:flex-col md:border-b-0 md:border-r"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 md:block md:py-4">
        <Link href="/admin" className="no-underline" onClick={close}>
          <Brand />
        </Link>
        <button
          ref={toggleRef}
          type="button"
          className="btn btn-sm h-9 w-9 p-0 md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      <div
        id={panelId}
        className={`${open ? "block" : "hidden"} border-t border-line md:flex md:flex-1 md:flex-col md:border-t-0`}
      >
        <div className="px-3 py-3 md:flex-1 md:overflow-y-auto md:pt-0">
          <Suspense fallback={<AdminNavFallback onNavigate={close} />}>
            <AdminNav onNavigate={close} />
          </Suspense>
        </div>
        <form action={logout} className="border-t border-line p-3">
          <button className="btn btn-sm w-full" type="submit">
            Log out
          </button>
        </form>
      </div>
    </aside>
  );
}
