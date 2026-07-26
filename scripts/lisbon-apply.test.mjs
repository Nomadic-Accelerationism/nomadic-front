import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  fixtureCannotInventBackendState,
  getLisbonApplyReadiness,
  lisbonApplicationStatusLabel,
  lisbonCredentialDisplay,
  mergePassportProofs,
  passportProofStatusLabel,
} from "./passport-me-helpers.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

test("Identity proof rendered from backend as Verified", () => {
  const merged = mergePassportProofs([
    {
      type: "WORLD_IDENTITY_CHECK",
      status: "VERIFIED",
      verifiedAt: "2026-07-25T12:00:00.000Z",
    },
  ]);
  const identity = merged.find((p) => p.id === "WORLD_IDENTITY_CHECK");
  assert.equal(identity.status, "completed");
  assert.equal(passportProofStatusLabel(identity.status), "Verified");
  assert.equal(identity.verifiedAt, "2026-07-25T12:00:00.000Z");
});

test("Selfie proof rendered from backend action key", () => {
  const merged = mergePassportProofs([
    { action: "apply_lisbon_house_v1", status: "VERIFIED" },
  ]);
  const selfie = merged.find((p) => p.id === "WORLD_SELFIE_CHECK");
  assert.equal(selfie.status, "completed");
  assert.equal(passportProofStatusLabel(selfie.status), "Verified");
});

test("normal UI labels never include nullifier wording", () => {
  const identity = mergePassportProofs([
    { type: "WORLD_IDENTITY_CHECK", status: "VERIFIED" },
  ])[0];
  const label = `${passportProofStatusLabel(identity.status)} with World`;
  assert.equal(label.includes("nullifier"), false);
  assert.equal(JSON.stringify(identity).includes("nullifier"), false);
});

test("Identity only keeps Apply disabled", () => {
  const readiness = getLisbonApplyReadiness([
    { type: "WORLD_IDENTITY_CHECK", status: "VERIFIED" },
  ]);
  assert.equal(readiness.identityVerified, true);
  assert.equal(readiness.selfieVerified, false);
  assert.equal(readiness.canSubmit, false);
});

test("both proofs enable Apply", () => {
  const readiness = getLisbonApplyReadiness([
    { type: "lisbon_identity_v1", status: "VERIFIED" },
    { type: "apply_lisbon_house_v1", status: "VERIFIED" },
  ]);
  assert.equal(readiness.canSubmit, true);
});

test("backend still rejects missing requirements (frontend readiness)", () => {
  const readiness = getLisbonApplyReadiness([]);
  assert.equal(readiness.canSubmit, false);
});

test("application SUBMITTED is not rendered as ACCEPTED", () => {
  assert.equal(
    lisbonApplicationStatusLabel("SUBMITTED"),
    "Application submitted",
  );
  assert.notEqual(lisbonApplicationStatusLabel("SUBMITTED"), "Accepted");
  assert.notEqual(lisbonApplicationStatusLabel("SUBMITTED"), "Approved");
});

test("credential display only after backend issuance key", () => {
  const display = lisbonCredentialDisplay({
    credentialKey: "NOMADIC_LISBON_HOUSE_ELIGIBLE",
    claimedAt: "2026-07-25T13:00:00.000Z",
  });
  assert.equal(display.title, "Lisbon House Eligibility");
  assert.equal(display.policyKey, "lisbon_house_policy_v1");
});

test("credential does not appear for empty credentials list", () => {
  const merged = mergePassportProofs([]);
  assert.equal(
    merged.every((p) => p.status === "not_completed"),
    true,
  );
  const display = lisbonCredentialDisplay(null);
  assert.notEqual(display.title, "Lisbon House Eligibility");
});

test("Journey fixture cannot invent proof/application/credential state", () => {
  const fixture = {
    source: "frontend-fixture",
    application: { state: "not_started" },
    proofs: {
      identityCheck: { status: "not_started" },
      selfieCheck: { status: "not_started" },
    },
  };
  assert.equal(fixtureCannotInventBackendState(fixture), true);
  assert.equal(
    fixtureCannotInventBackendState({
      source: "frontend-fixture",
      application: { state: "not_started", credentialIssued: true },
    }),
    false,
  );
});

test("repeated submission label stays submitted not accepted", () => {
  const first = lisbonApplicationStatusLabel("SUBMITTED");
  const second = lisbonApplicationStatusLabel("SUBMITTED");
  assert.equal(first, second);
  assert.equal(first, "Application submitted");
});

test("World Identity + Selfie actions live inside Passport cover, not Journey", () => {
  const passportScreen = read("components/passport/PassportScreen.tsx");
  const passportCover = read("components/passport/PassportCover.tsx");
  const applyScreen = read("components/journeys/LisbonHouseApplyScreen.tsx");
  const worldPanel = read("components/world/WorldVerificationPanel.tsx");
  const proofs = read("components/passport/PassportProofs.tsx");
  const brand = read("components/shell/NomadicBrand.tsx");

  // Checks must be children of PassportCover (inside dark card DOM).
  assert.ok(passportCover.includes("children"));
  assert.ok(passportCover.includes('data-passport-cover-card="true"'));
  assert.ok(passportCover.includes('data-passport-cover-slot="world"'));
  const coverOpen = passportScreen.indexOf("<PassportCover");
  const coverClose = passportScreen.indexOf("</PassportCover>");
  const panelIdx = passportScreen.indexOf("<WorldVerificationPanel");
  assert.ok(coverOpen >= 0 && coverClose > coverOpen);
  assert.ok(panelIdx > coverOpen && panelIdx < coverClose);
  assert.ok(passportScreen.includes('variant="cover"'));
  assert.equal(applyScreen.includes("WorldVerificationPanel"), false);
  assert.ok(applyScreen.includes("/passport#world-verification"));

  // Brand assets are branding-only — never check icons.
  assert.ok(brand.includes("/images/nomadic-logo-26.png"));
  assert.ok(brand.includes("/images/nomadic-logo-26-horizontal.svg"));
  assert.equal(worldPanel.includes("/images/nomadic-logo-26.png"), false);
  assert.equal(
    worldPanel.includes("/images/nomadic-logo-26-horizontal.svg"),
    false,
  );
  assert.ok(worldPanel.includes("IdCard"));
  assert.ok(worldPanel.includes("ScanFace"));
  assert.ok(worldPanel.includes('beginCheck("identity")'));
  assert.ok(worldPanel.includes('beginCheck("selfie")'));
  assert.ok(worldPanel.includes("Start Identity Check"));
  assert.ok(worldPanel.includes("Start Selfie Check"));
  assert.ok(proofs.includes("/passport#world-verification"));
  assert.equal(proofs.includes("Complete via Lisbon House apply"), false);

  const mark = readFileSync(join(root, "public/images/nomadic-logo-26.png"));
  const horizontal = readFileSync(
    join(root, "public/images/nomadic-logo-26-horizontal.svg"),
  );
  assert.ok(mark.length > 1000);
  assert.ok(horizontal.length > 1000);
});

test("shared brand surfaces use the official wordmark and mark", () => {
  const shell = read("components/shell/MobileAppShell.tsx");
  const landing = read("components/Landing.tsx");
  const login = read("components/LoginUser.tsx");
  assert.ok(shell.includes("NomadicWordmark"));
  assert.equal(shell.includes("NomadicEmblem"), false);
  assert.ok(landing.includes("NomadicMark"));
  assert.ok(login.includes("NomadicWordmark"));
});
