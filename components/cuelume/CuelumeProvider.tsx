"use client";

import { useEffect } from "react";
import { bind } from "cuelume";

/**
 * Wires Cuelume once for the whole app.
 * Declarative `data-cuelume-*` attributes keep working across route changes.
 */
export function CuelumeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    bind();
  }, []);

  return <>{children}</>;
}
