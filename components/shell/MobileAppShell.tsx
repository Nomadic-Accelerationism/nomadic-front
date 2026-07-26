"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { BottomNav } from "@/components/shell/BottomNav";
import { NomadicEmblem } from "@/components/shell/NomadicEmblem";
import { MOBILE_APP_MAX_WIDTH_PX } from "@/lib/shell/constants";
import { cn } from "@/lib/utils";

export type MobileAppShellProps = {
  children: React.ReactNode;
  /** Show bottom Explore / Passport tabs (default true). */
  showNav?: boolean;
  /** Compact top brand bar (default true). */
  showHeader?: boolean;
  className?: string;
  contentClassName?: string;
};

export function MobileAppShell({
  children,
  showNav = true,
  showHeader = true,
  className,
  contentClassName,
}: MobileAppShellProps) {
  const router = useRouter();
  const { logout, isAuthenticated } = useUser();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div
      className={cn(
        "min-h-dvh w-full bg-[var(--nomadic-browser-bg)]",
        className
      )}
    >
      <div
        className="mx-auto flex min-h-dvh w-full flex-col bg-[var(--nomadic-app-bg)] shadow-[0_0_0_1px_var(--nomadic-border)]"
        style={{ maxWidth: MOBILE_APP_MAX_WIDTH_PX }}
        data-mobile-shell
        data-max-width={MOBILE_APP_MAX_WIDTH_PX}
      >
        {showHeader ? (
          <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--nomadic-border)] px-4">
            <Link href="/explore" className="flex items-center gap-2">
              <NomadicEmblem size={28} />
              <span className="font-display text-base font-bold tracking-display text-[var(--nomadic-ink)]">
                Nomadic
              </span>
            </Link>
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="btn-nomadic btn-nomadic-quiet !min-h-9 gap-1.5 px-2.5 py-1.5 text-[11px]"
                aria-label="Log out"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden />
                Log out
              </button>
            ) : null}
          </header>
        ) : null}

        <main
          className={cn(
            "flex flex-1 flex-col overflow-y-auto px-4 pb-4 pt-4",
            contentClassName
          )}
        >
          {children}
        </main>

        {showNav ? <BottomNav /> : null}
      </div>
    </div>
  );
}
