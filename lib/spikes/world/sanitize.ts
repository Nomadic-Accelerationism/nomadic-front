/**
 * World spike — sanitize and summarize verify payloads.
 * Never log full proofs or secrets.
 */

import {
  fingerprintNullifier,
  type WorldSpikeVerifySummary,
} from "./types";

type LooseRecord = Record<string, unknown>;

function asRecord(value: unknown): LooseRecord | null {
  return value !== null && typeof value === "object"
    ? (value as LooseRecord)
    : null;
}

function collectNullifier(payload: LooseRecord): string | undefined {
  if (typeof payload.nullifier === "string") return payload.nullifier;

  const results = payload.results;
  if (Array.isArray(results)) {
    for (const item of results) {
      const row = asRecord(item);
      if (row && typeof row.nullifier === "string") return row.nullifier;
    }
  }

  const responses = payload.responses;
  if (Array.isArray(responses)) {
    for (const item of responses) {
      const row = asRecord(item);
      if (row && typeof row.nullifier === "string") return row.nullifier;
    }
  }

  return undefined;
}

function collectIdentifiers(payload: LooseRecord): string[] {
  const out: string[] = [];
  const buckets = [payload.results, payload.responses];
  for (const bucket of buckets) {
    if (!Array.isArray(bucket)) continue;
    for (const item of bucket) {
      const row = asRecord(item);
      if (row && typeof row.identifier === "string") out.push(row.identifier);
    }
  }
  return out;
}

/**
 * Build a sanitized summary from either the IDKit client result or portal verify JSON.
 * Strips proofs, merkle roots, and integrity bundles.
 */
export function summarizeWorldVerifyPayload(
  payload: unknown,
  upstreamHttpStatus: number,
): WorldSpikeVerifySummary {
  const body = asRecord(payload) ?? {};
  const nullifier = collectNullifier(body);
  const sessionId =
    typeof body.session_id === "string" ? body.session_id : undefined;

  const success =
    body.success === true ||
    (upstreamHttpStatus >= 200 &&
      upstreamHttpStatus < 300 &&
      body.success !== false);

  return {
    success,
    action: typeof body.action === "string" ? body.action : undefined,
    protocol_version:
      typeof body.protocol_version === "string"
        ? body.protocol_version
        : undefined,
    environment:
      typeof body.environment === "string" ? body.environment : undefined,
    nullifierPresent: Boolean(nullifier),
    nullifierFingerprint: fingerprintNullifier(nullifier),
    identity_attested:
      typeof body.identity_attested === "boolean"
        ? body.identity_attested
        : undefined,
    user_presence_completed:
      typeof body.user_presence_completed === "boolean"
        ? body.user_presence_completed
        : undefined,
    session_id_present: Boolean(sessionId),
    resultIdentifiers: collectIdentifiers(body),
    upstreamHttpStatus,
  };
}

/** Safe console metadata only. */
export function worldSpikeLogMeta(event: string, meta: Record<string, unknown>) {
  // eslint-disable-next-line no-console
  console.info(`[world-spike] ${event}`, meta);
}
