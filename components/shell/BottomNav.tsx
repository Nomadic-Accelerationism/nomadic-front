"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, BookMarked } from "lucide-react";
import { PRODUCT_NAV_ROUTES } from "@/lib/shell/constants";
import { cn } from "@/lib/utils";

const ICONS = {
  explore: Compass,
  passport: BookMarked,
} as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="sticky bottom-0 z-40 border-t border-[var(--nomadic-border)] bg-[var(--nomadic-bg)]/96 backdrop-blur-[2px]"
    >
      <ul className="grid grid-cols-2">
        {PRODUCT_NAV_ROUTES.map((item) => {
          const Icon = ICONS[item.id];
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-11 flex-col items-center justify-center gap-0.5 px-2 py-2.5 text-[11px] font-semibold tracking-wide transition-colors",
                  active
                    ? "text-[var(--nomadic-orange)]"
                    : "text-[var(--nomadic-muted)] hover:text-[var(--nomadic-ink)]"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    active ? "text-[var(--nomadic-orange)]" : "currentColor"
                  )}
                  aria-hidden
                />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
