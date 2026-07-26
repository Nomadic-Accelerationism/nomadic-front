"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { BottomNav } from "@/components/shell/BottomNav";
import { NomadicWordmark } from "@/components/shell/NomadicBrand";
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
        "nomadic-app-canvas min-h-dvh w-full",
        className
      )}
    >
      <div
        className="nomadic-shell-frame mx-auto flex min-h-dvh w-full flex-col"
        style={{ maxWidth: MOBILE_APP_MAX_WIDTH_PX }}
        data-mobile-shell
        data-max-width={MOBILE_APP_MAX_WIDTH_PX}
      >
        {showHeader ? (
          <header className="flex h-16 shrink-0 items-center justify-between px-5">
            <Link
              href="/explore"
              className="flex min-w-0 items-center"
              aria-label="Nomadic home"
            >
              <NomadicWordmark height={22} decorative />
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
            "nomadic-screen flex flex-1 flex-col overflow-y-auto px-5 pb-5 pt-4 sm:px-6",
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
