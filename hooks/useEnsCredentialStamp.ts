"use client";

import { useQuery } from "@tanstack/react-query";
import { DEFAULT_LISBON_CREDENTIAL_NAME } from "@/lib/ensv2/passport-credential-read";
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

export function useEnsCredentialStamp(ensName: string | null | undefined) {
  const credentialName =
    lisbonCredentialNameFromPassport(ensName) || DEFAULT_LISBON_CREDENTIAL_NAME;

  const query = useQuery({
    queryKey: ["ens", "credential", credentialName],
    queryFn: () => fetchStamp(credentialName),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  return {
    stamp: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError || (query.data != null && query.data.ok === false),
    refetch: () => {
      void query.refetch();
    },
  };
}
