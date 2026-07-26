import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Eye } from "lucide-react";
import { NomadicWordmark } from "@/components/shell/NomadicBrand";
import { DESIGN_REVIEW_GROUPS } from "@/lib/design-review/screens";

export const metadata: Metadata = {
  title: "Nomadic design review",
  robots: { index: false, follow: false },
};

const ACCESS_LABEL = {
  public: "Public",
  session: "Needs login",
  legacy: "Legacy",
  internal: "Internal",
} as const;

export default function DesignReviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();

  return (
    <main className="nomadic-app-canvas min-h-dvh px-5 py-8 text-[var(--nomadic-ink)] sm:px-8 sm:py-12">
      <div className="mx-auto w-full max-w-3xl">
        <NomadicWordmark height={32} decorative className="brightness-0" />
        <p className="mt-10 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--nomadic-muted)]">
          Local design review
        </p>
        <h1 className="font-display mt-2 text-5xl font-black leading-[0.85] tracking-display sm:text-6xl">
          Every screen,
          <br />
          one place.
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-relaxed text-[var(--nomadic-muted)]">
          Open public routes directly. For login-protected demo screens, use the
          safe visual preview: it never creates a fake authentication session.
        </p>

        <div className="mt-10 space-y-10">
          {DESIGN_REVIEW_GROUPS.map((group) => (
            <section
              key={group.title}
              aria-labelledby={`review-${group.title
                .toLowerCase()
                .replaceAll(" ", "-")}`}
            >
              <div>
                <h2
                  id={`review-${group.title
                    .toLowerCase()
                    .replaceAll(" ", "-")}`}
                  className="font-display text-2xl font-bold tracking-display"
                >
                  {group.title}
                </h2>
                <p className="mt-1 text-sm text-[var(--nomadic-muted)]">
                  {group.description}
                </p>
              </div>

              <ul className="mt-4 overflow-hidden rounded-[var(--nomadic-radius-md)] border border-[var(--nomadic-border)] bg-[var(--nomadic-surface)]/72 backdrop-blur">
                {group.screens.map((screen) => (
                  <li
                    key={`${group.title}-${screen.route}`}
                    className="flex min-h-16 items-center gap-3 border-b border-[var(--nomadic-border)] px-4 py-3 last:border-b-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{screen.title}</p>
                      <p className="truncate font-mono text-[11px] text-[var(--nomadic-muted)]">
                        {screen.route}
                      </p>
                    </div>
                    <span className="badge-nomadic badge-nomadic-neutral hidden sm:inline-flex">
                      {ACCESS_LABEL[screen.access]}
                    </span>
                    {screen.preview ? (
                      <Link
                        href={`/design-review/${screen.preview}`}
                        className="btn-nomadic btn-nomadic-primary !min-h-9 px-3 py-1.5 text-xs"
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden />
                        Preview
                      </Link>
                    ) : (
                      <Link
                        href={screen.route}
                        className="btn-nomadic btn-nomadic-quiet !min-h-9 px-3 py-1.5 text-xs"
                      >
                        Open
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
