import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  MOBILE_APP_MAX_WIDTH_PX,
  PRODUCT_NAV_ROUTES,
  buildPassportProofGrid,
  ensFailureStamp,
  isHiddenFromNav,
  isPassportBookOpen,
  mapCredentialTextsToStamp,
  passportBookTitle,
  passportSharePath,
  productNavHrefs,
  publicPassportContainsPii,
  recordProvesGovernmentId,
  recordProvesOrb,
  resolveLisbonExploreState,
  sanitizePublicPassportPayload,
  stampUsesForbiddenCopy,
  togglePassportBookState,
} from "./passport-product-helpers.mjs";

describe("mobile layout shell", () => {
  it("centers a ~430px mobile application container", () => {
    assert.equal(MOBILE_APP_MAX_WIDTH_PX, 430);
  });

  it("exposes only Explore and Passport in product nav", () => {
    assert.deepEqual(productNavHrefs(), ["/explore", "/passport"]);
    assert.equal(PRODUCT_NAV_ROUTES.length, 2);
  });

  it("keeps internal ENS execution routes out of normal nav", () => {
    assert.equal(isHiddenFromNav("/testing/ensv2-stage5a"), true);
    assert.equal(isHiddenFromNav("/spikes/world"), true);
    assert.equal(isHiddenFromNav("/user-proofs"), true);
    assert.equal(productNavHrefs().includes("/testing/ensv2-stage5a"), false);
  });
});

describe("Explore eligibility mapping", () => {
  it("never invents Eligible without a backend credential", () => {
    assert.equal(resolveLisbonExploreState({}), "unknown");
    assert.equal(
      resolveLisbonExploreState({ credentials: [], journeys: [] }),
      "unknown"
    );
  });

  it("maps real Lisbon eligible credential", () => {
    assert.equal(
      resolveLisbonExploreState({
        credentials: [{ credentialKey: "NOMADIC_LISBON_HOUSE_ELIGIBLE" }],
      }),
      "eligible"
    );
  });
});

describe("closed and open Passport", () => {
  it("toggles booklet state", () => {
    assert.equal(togglePassportBookState("closed"), "open");
    assert.equal(togglePassportBookState("open"), "closed");
    assert.equal(isPassportBookOpen("open"), true);
    assert.equal(isPassportBookOpen("closed"), false);
  });

  it("derives Victor’s Passport title and share path from ENS", () => {
    assert.equal(
      passportBookTitle("victor.nomadic-passport.eth"),
      "Victor’s Passport"
    );
    assert.equal(
      passportSharePath("victor.nomadic-passport.eth"),
      "/p/victor.nomadic-passport.eth"
    );
  });
});

describe("proof grid mapping", () => {
  it("shows incomplete Unique human / Gov ID / Country without Orb or document signals", () => {
    const grid = buildPassportProofGrid([
      { type: "WORLD_IDENTITY_CHECK", status: "COMPLETED" },
    ]);
    const unique = grid.find((p) => p.id === "unique_human");
    const age = grid.find((p) => p.id === "age_18");
    const gov = grid.find((p) => p.id === "government_id");
    const country = grid.find((p) => p.id === "country");
    assert.equal(unique.status, "incomplete");
    assert.equal(age.status, "verified");
    assert.equal(gov.status, "incomplete");
    assert.equal(country.status, "incomplete");
    assert.equal(unique.privacy, "Private");
    assert.equal(age.privacy, "Private");
  });

  it("only marks Unique human verified when Orb is explicit", () => {
    assert.equal(
      recordProvesOrb({
        type: "WORLD_IDENTITY_CHECK",
        status: "COMPLETED",
      }),
      false
    );
    assert.equal(
      recordProvesOrb({
        type: "WORLD_IDENTITY_CHECK",
        status: "COMPLETED",
        verificationLevel: "orb",
      }),
      true
    );
  });

  it("does not claim Government ID from Identity Check alone", () => {
    assert.equal(
      recordProvesGovernmentId({
        type: "WORLD_IDENTITY_CHECK",
        status: "COMPLETED",
      }),
      false
    );
    assert.equal(
      recordProvesGovernmentId({
        type: "WORLD_IDENTITY_CHECK",
        status: "COMPLETED",
        documentVerified: true,
      }),
      true
    );
  });

  it("marks future proofs as Soon placeholders", () => {
    const grid = buildPassportProofGrid([]);
    const soon = grid.filter((p) => p.placeholder);
    assert.equal(soon.length, 4);
    assert.deepEqual(
      soon.map((p) => p.title),
      ["Contributions", "Skills", "References", "Attendance"]
    );
    assert.ok(soon.every((p) => p.status === "soon"));
  });

  it("keeps incomplete identity proofs incomplete", () => {
    const grid = buildPassportProofGrid([]);
    assert.ok(
      grid
        .filter((p) => !p.placeholder)
        .every((p) => p.status === "incomplete")
    );
  });
});

describe("ENS Lisbon credential stamp", () => {
  it("maps real ENS texts to Eligible / Active stamp copy", () => {
    const stamp = mapCredentialTextsToStamp(
      "lisbon-house.victor.nomadic-passport.eth",
      {
        status: "active",
        issuedAt: "2026-01-01",
        expiresAt: "",
        metadata: "issuer-demo-stage4-verified",
      }
    );
    assert.equal(stamp.ok, true);
    assert.equal(stamp.title, "Lisbon House");
    assert.equal(stamp.eligibilityLabel, "Eligible");
    assert.equal(stamp.activityLabel, "Active");
    assert.equal(stamp.issuedBy, "Nomadic Lisbon House");
    assert.equal(stamp.verifiedOnEns, true);
    assert.equal(stampUsesForbiddenCopy(stamp), false);
  });

  it("surfaces ENS failure without mock verified success", () => {
    assert.equal(
      mapCredentialTextsToStamp("lisbon-house.victor.nomadic-passport.eth", {
        status: "",
        issuedAt: "",
        expiresAt: "",
        metadata: "",
      }),
      null
    );
    const fail = ensFailureStamp(
      "lisbon-house.victor.nomadic-passport.eth",
      "RESOLVER_UNAVAILABLE"
    );
    assert.equal(fail.ok, false);
    assert.equal(fail.code, "RESOLVER_UNAVAILABLE");
  });
});

describe("public Passport sanitization", () => {
  it("strips PII keys and reports contamination", () => {
    const dirty = {
      passportName: "victor.nomadic-passport.eth",
      displayName: "Victor’s Passport",
      primaryWallet: "0xd114FA765bA4811219AAe364c93CE8A81Ad39B17",
      email: "secret@example.com",
      nullifier: "abc",
      country: "PT",
      stamps: [],
      verifiedOnEns: true,
    };
    assert.equal(publicPassportContainsPii(dirty), true);
    const clean = sanitizePublicPassportPayload(dirty);
    assert.equal(publicPassportContainsPii(clean), false);
    assert.equal("email" in clean, false);
    assert.equal("nullifier" in clean, false);
    assert.equal("country" in clean, false);
  });
});
