import type { Metadata } from "next";

/**
 * Stage 5A is an internal testing route — keep it out of search / normal nav.
 * Product navigation must not link here.
 */
export const metadata: Metadata = {
  title: "ENSv2 Stage 5A (internal)",
  robots: {
    index: false,
    follow: false,
  },
};

export default function EnsV2Stage5ALayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
