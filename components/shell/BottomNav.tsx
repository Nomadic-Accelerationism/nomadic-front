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
      className="sticky bottom-4 z-40 mx-auto mb-4 w-[11.5rem] rounded-full border border-[var(--nomadic-border-strong)] bg-[var(--nomadic-surface)]/88 p-1.5 shadow-[var(--nomadic-shadow-clay)] backdrop-blur-xl"
    >
      <ul className="grid grid-cols-2 gap-1">
        {PRODUCT_NAV_ROUTES.map((item) => {
          const Icon = ICONS[item.id];
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-11 items-center justify-center rounded-full px-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nomadic-orange-deep)] focus-visible:ring-offset-2",
                  active
                    ? "bg-[var(--nomadic-orange)] text-[var(--nomadic-ink)] shadow-[var(--nomadic-shadow-soft)]"
                    : "text-[var(--nomadic-muted)] hover:bg-[var(--nomadic-ink)]/[0.04] hover:text-[var(--nomadic-ink)]"
                )}
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
                title={item.label}
              >
                <Icon
                  className="h-5 w-5"
                  aria-hidden
                />
                <span className="sr-only">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
