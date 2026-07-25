"use client";

import { cn } from "@/lib/utils";
import type { PassportCredential } from "@/lib/passport/types";

export type PassportCredentialsProps = {
  credentials: PassportCredential[];
  className?: string;
};

/**
 * Backend `passport.credentials` is the only source of truth for issued credentials.
 */
export function PassportCredentials({
  credentials,
  className,
}: PassportCredentialsProps) {
  if (!credentials.length) {
    return (
      <article
        className={cn(
          "w-full rounded-2xl border border-dashed border-black/30 bg-white/70 p-5 text-left",
          className
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold leading-tight">No credentials yet</h3>
          <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
            Empty
          </span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">
          Credentials issued by communities will appear here.
        </p>
      </article>
    );
  }

  return (
    <ul className={cn("space-y-3", className)}>
      {credentials.map((credential) => (
        <li
          key={`${credential.credentialKey}-${credential.claimedAt ?? "issued"}`}
          className="rounded-2xl border border-black/10 bg-white p-5 text-left shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-bold leading-tight">
              {credential.displayName || credential.credentialKey}
            </h3>
            <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
              Issued
            </span>
          </div>
          {credential.description ? (
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              {credential.description}
            </p>
          ) : null}
          <p className="mt-2 font-mono text-xs text-gray-400">
            {credential.credentialKey}
          </p>
        </li>
      ))}
    </ul>
  );
}

/** @deprecated Prefer PassportCredentials — kept as alias for older imports. */
export const CredentialCard = PassportCredentials;
