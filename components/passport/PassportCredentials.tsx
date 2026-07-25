"use client";

import { cn } from "@/lib/utils";
import type { PassportCredential } from "@/lib/passport/types";
import { toCredentialDisplayModel } from "@/lib/passport/credentials-display";

export type PassportCredentialsProps = {
  credentials: PassportCredential[];
  ensName?: string | null;
  ensStatus?: string | null;
  className?: string;
};

/**
 * Backend `passport.credentials` is the only source of truth for issued credentials.
 */
export function PassportCredentials({
  credentials,
  ensName = null,
  ensStatus = null,
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
      {credentials.map((credential) => {
        const display = toCredentialDisplayModel(credential, {
          ensName,
          ensStatus,
        });
        return (
          <li
            key={`${credential.credentialKey}-${credential.claimedAt ?? "issued"}`}
            className="rounded-2xl border border-black/10 bg-white p-5 text-left shadow-sm"
            data-credential-key={credential.credentialKey}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-bold leading-tight">{display.title}</h3>
              <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
                {display.statusLabel}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              {display.description}
            </p>
            <dl className="mt-3 space-y-1 text-xs text-gray-500">
              {display.policyKey ? (
                <div>
                  <dt className="inline font-medium text-gray-600">Policy: </dt>
                  <dd className="inline">{display.policyKey}</dd>
                </div>
              ) : null}
              {display.issuedAt ? (
                <div>
                  <dt className="inline font-medium text-gray-600">Issued: </dt>
                  <dd className="inline">
                    {new Date(display.issuedAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </dd>
                </div>
              ) : null}
              {display.journeyLabel ? (
                <div>
                  <dt className="inline font-medium text-gray-600">Journey: </dt>
                  <dd className="inline">{display.journeyLabel}</dd>
                </div>
              ) : null}
              <div>
                <dt className="sr-only">ENS</dt>
                <dd>{display.ensStatusLabel}</dd>
              </div>
            </dl>
          </li>
        );
      })}
    </ul>
  );
}

/** @deprecated Prefer PassportCredentials — kept as alias for older imports. */
export const CredentialCard = PassportCredentials;
