"use client";

import { useQuery } from "@tanstack/react-query";
import { lisbonCredentialNameFromPassport } from "@/lib/passport/display-name";

export type EnsStampOk = {
  ok: true;
  credentialName: string;
  title: string;
  eligibilityLabel: string;
  activityLabel: string;
  issuedBy: string;
  verifiedOnEns: true;
};

export type EnsStampErr = {
  ok: false;
  credentialName: string;
  code: string;
  message: string;
};

async function fetchStamp(name: string): Promise<EnsStampOk | EnsStampErr> {
  const res = await fetch(`/api/ens/credential/${encodeURIComponent(name)}`, {
    cache: "no-store",
  });
  const body = (await res.json()) as EnsStampOk | EnsStampErr;
  if (!res.ok || !body.ok) {
    return {
      ok: false,
      credentialName: name,
      code:
        !body.ok && "code" in body
          ? String(body.code)
          : "RESOLVER_UNAVAILABLE",
      message:
        !body.ok && "message" in body
          ? String(body.message)
          : "Credential unavailable.",
    };
  }
  return body;
}

/**
 * Load a published Lisbon credential for the given Passport ensName.
 * Never falls back to Victor or any other demo credential.
 */
export function useEnsCredentialStamp(ensName: string | null | undefined) {
  const credentialName = lisbonCredentialNameFromPassport(ensName);

  const query = useQuery({
    queryKey: ["ens", "credential", credentialName],
    queryFn: () => fetchStamp(credentialName as string),
    enabled: Boolean(credentialName),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  return {
    stamp: credentialName ? query.data ?? null : null,
    isLoading: Boolean(credentialName) && query.isLoading,
    isError:
      Boolean(credentialName) &&
      (query.isError || (query.data != null && query.data.ok === false)),
    hasCredentialTarget: Boolean(credentialName),
    refetch: () => {
      if (!credentialName) return;
      void query.refetch();
    },
  };
}
