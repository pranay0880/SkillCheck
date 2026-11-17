"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      {children}
    </svg>
  );
}

const LINKS: { href: string; label: string; icon: ReactNode }[] = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: (
      <Icon>
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </Icon>
    ),
  },
  {
    href: "/admin/questions",
    label: "Questions",
    icon: (
      <Icon>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14" />
        <path d="M12 17h.01" />
      </Icon>
    ),
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: (
      <Icon>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
        <path d="M16 4.5a3.5 3.5 0 0 1 0 7" />
        <path d="M18.5 14.5A6.5 6.5 0 0 1 21.5 20" />
      </Icon>
    ),
  },
  {
    href: "/admin/tests",
    label: "Tests",
    icon: (
      <Icon>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M9 8h6M9 12h6M9 16h4" />
      </Icon>
    ),
  },
  {
    href: "/admin/results",
    label: "Results",
    icon: (
      <Icon>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </Icon>
    ),
  },
];

interface NavProps {
  onNavigate?: () => void;
}

export function AdminNav({ onNavigate }: NavProps) {
  return <NavLinks pathname={usePathname()} onNavigate={onNavigate} />;
}

export function AdminNavFallback({ onNavigate }: NavProps) {
  return <NavLinks pathname="" onNavigate={onNavigate} />;
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Admin">
      <ul className="flex flex-col gap-1">
        {LINKS.map((link) => {
          const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className="flex items-center gap-2.5 rounded-md px-3 py-2 font-medium text-muted no-underline hover:bg-surface-2 hover:text-fg aria-[current=page]:bg-info-soft aria-[current=page]:font-semibold aria-[current=page]:text-primary"
              >
                {link.icon}
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
