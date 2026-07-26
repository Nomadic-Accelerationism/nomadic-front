"use client";

import { PublicPassportScreen } from "@/components/passport/PublicPassportScreen";

export default function PublicPassportPage({
  params,
}: {
  params: { identifier: string };
}) {
  let identifier = params.identifier ?? "";
  try {
    identifier = decodeURIComponent(identifier);
  } catch {
    // keep raw
  }

  return <PublicPassportScreen identifier={identifier} />;
}
