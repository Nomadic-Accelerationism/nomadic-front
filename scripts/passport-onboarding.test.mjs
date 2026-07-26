/**
 * Passport onboarding Pass 2 — validation, availability path, create gate.
 * Run: npm run test:passport-onboarding
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  NOMADIC_PASSPORT_USER_REGISTRY,
  getPassportProvisioningStatus,
  isPassportMintAdapterAvailable,
  normalizePassportHandle,
  validatePassportHandle,
} from "./passport-onboarding-helpers.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

function section(title) {
  console.log(`\n== ${title} ==`);
}

section("Label validation");
assert.equal(normalizePassportHandle("  Maria "), "maria");
assert.equal(validatePassportHandle("ab").ok, false);
assert.equal(validatePassportHandle("a".repeat(21)).ok, false);
assert.equal(validatePassportHandle("-maria").ok, false);
assert.equal(validatePassportHandle("maria-").ok, false);
assert.equal(validatePassportHandle("ma--ria").ok, false);
assert.equal(validatePassportHandle("maria.eth").ok, false);
assert.equal(validatePassportHandle("mar ia").ok, false);
assert.equal(validatePassportHandle("admin").ok, false);
assert.equal(validatePassportHandle("administrator").ok, false);
assert.equal(validatePassportHandle("platform").ok, false);
assert.equal(validatePassportHandle("nomadic-passport").ok, false);
assert.equal(validatePassportHandle("lisbon-house").ok, false);
assert.equal(validatePassportHandle("world").ok, false);
assert.equal(validatePassportHandle("Maria").ok, true);
assert.equal(
  validatePassportHandle("Maria").passportName,
  "maria.nomadic-passport.eth"
);
console.log("ok — validation");

section("Create gate — no fake success");
assert.equal(isPassportMintAdapterAvailable(), false);
const status = getPassportProvisioningStatus();
assert.equal(status.reasonCode, "BLOCKED_MISSING_MINT_ADAPTER");
assert.match(status.userMessage, /temporarily unavailable/i);
assert.equal(status.mintAdapterAvailable, false);
console.log("ok — gate blocked");

section("Architecture — no second Magic, no forbidden APIs, no jargon");
const startUi = read("components/onboarding/StartOnboardingScreen.tsx");
assert.ok(startUi.includes("UserLoginComponent") || startUi.includes("LoginUser"));
assert.ok(!startUi.includes("new Magic("));
assert.ok(!startUi.includes("wallet_switchEthereumChain"));
assert.ok(!startUi.includes("wallet_addEthereumChain"));
assert.ok(!startUi.includes("eth_signTransaction"));
assert.ok(!startUi.includes("Privy"));
assert.ok(!/\bSepolia\b/i.test(startUi), "product UI must not say Sepolia");
assert.ok(!/\bENS\b/.test(startUi), "product UI must not say ENS");
console.log("ok — start UI hygiene");

const createRoute = read("app/api/ens/passport/create/route.ts");
assert.ok(createRoute.includes("isPassportMintAdapterAvailable"));
assert.ok(createRoute.includes("checkPassportHandleAvailability"));
assert.ok(!createRoute.includes("NEXT_PUBLIC_"));
console.log("ok — create route refused + rechecks");

section("Availability — UserRegistry findOwner");
const avail = read("lib/ensv2/passport-availability.ts");
assert.ok(avail.includes("findRegistryOwner") || avail.includes("findOwner"));
assert.ok(avail.includes("PassportAvailability"));
const explorer = read("lib/ensv2/explorer-r2.ts");
assert.ok(
  explorer.toLowerCase().includes(NOMADIC_PASSPORT_USER_REGISTRY.toLowerCase())
);
assert.ok(explorer.includes("findOwner"));
const availRoute = read("app/api/passport/availability/route.ts");
assert.ok(availRoute.includes("checkPassportHandleAvailability"));
assert.ok(!availRoute.includes("private key"));
console.log("ok — live registry availability path");

section("Existing Passport detection");
const existing = read("lib/passport/existing-passport.ts");
assert.ok(existing.includes("existingPassportFromBackend"));
assert.ok(existing.includes("findOwner"));
assert.ok(existing.includes("0xd114FA765bA4811219AAe364c93CE8A81Ad39B17") || existing.includes("STAGE5A_EXPECTED_SIGNER"));
assert.ok(existing.includes("victor") || existing.includes("passportNameFromLabel"));
console.log("ok — existing Passport sources");

section("Login redirects to /start");
const login = read("components/LoginUser.tsx");
assert.ok(login.includes('"/start"') || login.includes("'/start'"));
console.log("ok — login → /start");

section("No client platform secret");
const gate = read("lib/passport/provisioning-gate.ts");
assert.ok(!gate.includes("PRIVATE_KEY"));
assert.ok(gate.includes("isPassportMintAdapterAvailable"));
const bundlish = [
  "components/onboarding/StartOnboardingScreen.tsx",
  "lib/passport/provisioning-gate.ts",
  "hooks/usePassportHandleAvailability.ts",
];
for (const f of bundlish) {
  const src = read(f);
  assert.ok(!/ENS_SEPOLIA_RPC_URL/.test(src), `${f} must not reference server RPC env`);
}
console.log("ok — no client secrets");

section("Generic Passport never inherits Victor Lisbon credential");
const stampHook = read("hooks/useEnsCredentialStamp.ts");
assert.ok(!stampHook.includes("DEFAULT_LISBON_CREDENTIAL_NAME"));
assert.ok(stampHook.includes("lisbonCredentialNameFromPassport"));
assert.ok(stampHook.includes("enabled: Boolean(credentialName)"));
const stampsUi = read("components/passport/PassportCommunityStamps.tsx");
assert.ok(stampsUi.includes("stamps-empty"));
assert.ok(stampsUi.includes("No community credentials published yet."));
assert.ok(!stampsUi.includes("DEFAULT_LISBON_CREDENTIAL_NAME"));
console.log("ok — no Victor stamp fallback");

section("Product passport surfaces hide chain jargon");
const cover = read("components/passport/PassportCover.tsx");
assert.ok(cover.includes("Nomadic Passport"));
const openSheet = read("components/passport/PassportOpenSheet.tsx");
assert.ok(!openSheet.includes("Onchain details"));
assert.ok(!openSheet.includes("PASSPORT_ENS_RESOLVER"));
const publicScreen = read("components/passport/PublicPassportScreen.tsx");
assert.ok(!publicScreen.includes("Verified on ENS"));
console.log("ok — product copy");

console.log("\nAll passport onboarding tests passed.");
