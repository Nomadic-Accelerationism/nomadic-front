"use client";

import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/contexts/UserContext";
import {
  fetchPrivatePassport,
  PassportMeClientError,
} from "@/lib/passport/fetch-me";
import { resolveSessionDidToken } from "@/lib/passport/session-did";
import type {
  PassportMeErrorCode,
  PrivatePassport,
} from "@/lib/passport/types";

export const PRIVATE_PASSPORT_QUERY_KEY = ["passport", "me"] as const;

export type UsePrivatePassportResult = {
  passport: PrivatePassport | null;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  errorCode: PassportMeErrorCode | null;
  requestId: string | null;
  refetch: () => void;
  /** True when the failure is an auth problem (clear session / re-login). */
  isAuthError: boolean;
  /** True when backend/config failed but the local session may still be valid. */
  isBackendError: boolean;
};

export function usePrivatePassport(): UsePrivatePassportResult {
  const { isAuthenticated, isInitialized, didToken } = useUser();

  const query = useQuery({
    queryKey: [...PRIVATE_PASSPORT_QUERY_KEY, Boolean(didToken)],
    enabled: isInitialized && isAuthenticated && Boolean(didToken),
    queryFn: async () => {
      const resolved = await resolveSessionDidToken(didToken);
      if (!resolved) {
        throw new PassportMeClientError("MISSING_SESSION", 401);
      }
      return fetchPrivatePassport(resolved);
    },
    retry: (failureCount, error) => {
      if (error instanceof PassportMeClientError) {
        if (
          error.code === "MISSING_SESSION" ||
          error.code === "INVALID_SESSION"
        ) {
          return false;
        }
        if (
          error.code === "BACKEND_UNAVAILABLE" ||
          error.code === "PASSPORT_UNAVAILABLE"
        ) {
          return failureCount < 1;
        }
        // 500 / unexpected: no automatic retry
        return false;
      }
      // Network-ish unknown errors: one limited retry
      return failureCount < 1;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const error =
    query.error instanceof PassportMeClientError ? query.error : null;
  const errorCode = error?.code ?? (query.isError ? "UNEXPECTED_ERROR" : null);
  const isAuthError =
    errorCode === "MISSING_SESSION" || errorCode === "INVALID_SESSION";
  const isBackendError =
    errorCode === "BACKEND_UNAVAILABLE" ||
    errorCode === "PASSPORT_UNAVAILABLE" ||
    errorCode === "MISSING_API_CONFIG" ||
    errorCode === "UNEXPECTED_ERROR";

  return {
    passport: query.data?.passport ?? null,
    isLoading: !isInitialized || (query.isLoading && !query.data),
    isFetching: query.isFetching,
    isError: query.isError,
    errorCode,
    requestId: error?.requestId ?? null,
    refetch: () => {
      void query.refetch();
    },
    isAuthError,
    isBackendError,
  };
}
