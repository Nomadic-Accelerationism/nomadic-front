import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DesignReviewScreen } from "@/components/design-review/DesignReviewScreen";
import {
  DESIGN_PREVIEW_KEYS,
  isDesignPreviewKey,
} from "@/lib/design-review/screens";

export const metadata: Metadata = {
  title: "Nomadic screen preview",
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return DESIGN_PREVIEW_KEYS.map((screen) => ({ screen }));
}

export default function DesignReviewPreviewPage({
  params,
}: {
  params: { screen: string };
}) {
  if (
    process.env.NODE_ENV !== "development" ||
    !isDesignPreviewKey(params.screen)
  ) {
    notFound();
  }

  return <DesignReviewScreen screen={params.screen} />;
}
