/**
 * Passport provision integration — Pass 2.5B
 * Run: npm run test:passport-provision
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createPlatformAdvanceGuard,
  mapBackendStatusToProductPhase,
  needsPlatformAdvance,
  parseMintAdapterStatus,
  parseUserPlan,
  productMessageForProvisionError,
} from "./passport-provision-helpers.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

function section(title) {
  console.log(`\n== ${title} ==`);
}

section("Adapter unavailable keeps Create gated");
const disabled = parseMintAdapterStatus(
  {
    error: "MINT_ADAPTER_UNAVAILABLE",
    code: "MINT_ADAPTER_UNAVAILABLE",
    reason: "FEATURE_DISABLED",
  },
  false
);
assert.equal(disabled.available, false);
assert.equal(
  productMessageForProvisionError("MINT_ADAPTER_UNAVAILABLE"),
  "Passport creation is temporarily unavailable."
);
assert.ok(!productMessageForProvisionError("FEATURE_DISABLED").includes("FEATURE"));
const enabled = parseMintAdapterStatus(
  { available: true, profile: "explorer-v1-r2", chainId: 11155111 },
  true
);
assert.equal(enabled.available, true);
console.log("ok — adapter");

section("Product phase mapping");
assert.equal(mapBackendStatusToProductPhase("RESERVED"), "preparing");
assert.equal(mapBackendStatusToProductPhase("PLATFORM_STEP_PENDING"), "creating");
assert.equal(mapBackendStatusToProductPhase("AWAITING_USER_PARENT"), "confirming");
assert.equal(mapBackendStatusToProductPhase("VERIFYING"), "verifying");
assert.equal(mapBackendStatusToProductPhase("ISSUED"), "complete");
console.log("ok — phases");

section("User transaction plan parsing — backend is source of truth");
const plan = parseUserPlan({
  step: "parent",
  to: "0x8fB12e7Ab9B192503d7d02a43e0507c484e27280",
  data: "0xabcdef",
  value: "0x0",
});
assert.ok(plan);
assert.equal(plan.step, "parent");
assert.equal(parseUserPlan({ step: "parent", to: "nope", data: "0x" }), null);
console.log("ok — plan");

section("Platform advance mutex — no concurrent advances");
const guard = createPlatformAdvanceGuard();
let concurrent = 0;
const p1 = guard.advance(async () => {
  concurrent += 1;
  await new Promise((r) => setTimeout(r, 20));
  concurrent -= 1;
  return "a";
});
const p2 = guard.advance(async () => "b");
const [r1, r2] = await Promise.all([p1, p2]);
assert.equal(r1.skipped, false);
assert.equal(r2.skipped, true);
assert.equal(guard.calls, 1);
assert.equal(
  needsPlatformAdvance({
    nextAction: "platform_advance",
    status: "RESERVED",
  }),
  true
);
assert.equal(
  needsPlatformAdvance({ nextAction: "done", status: "ISSUED" }),
  false
);
console.log("ok — platform mutex");

section("Architecture — eth_sendTransaction only, singleton Magic");
const magicSend = read("lib/passport/provision/magic-send.ts");
assert.ok(magicSend.includes("eth_sendTransaction"));
assert.ok(magicSend.includes("getSepoliaMagic"));
assert.ok(magicSend.includes("countMagicIframes"));
assert.ok(magicSend.includes("Please refresh the page and try again."));
assert.ok(!magicSend.includes("wallet_switchEthereumChain"));
assert.ok(!magicSend.includes("eth_signTransaction"));
assert.ok(!magicSend.includes("privateKey"));
assert.ok(!magicSend.includes("chainId"));
assert.ok(!magicSend.includes("nonce"));
const flow = read("hooks/usePassportProvisionFlow.ts");
assert.ok(flow.includes("advancePlatform"));
assert.ok(flow.includes("submitUserTx"));
assert.ok(flow.includes("createIdempotencyKey"));
assert.ok(flow.includes("readProvisionResume"));
assert.ok(flow.includes("confirmIssuedWithMe") || flow.includes("fetchPrivatePassport"));
assert.ok(flow.includes("MAX_POLL_ATTEMPTS") || flow.includes("pollCount"));
assert.ok(flow.includes("getProvision"));
assert.ok(!flow.includes("new Magic("));
// Ambiguous platform failure re-reads status before retrying advance.
assert.ok(flow.includes("Timeout / ambiguous") || flow.includes("re-read"));
console.log("ok — Magic + orchestration");

section("Canary resume — no second Magic before Continue / eth_sendTransaction");
const sessionDid = read("lib/passport/session-did.ts");
assert.ok(sessionDid.includes("getSepoliaMagic"));
assert.ok(!sessionDid.includes("new Magic("));
assert.ok(!sessionDid.includes('from "magic-sdk"'));
const loginUser = read("components/LoginUser.tsx");
assert.ok(loginUser.includes("getSepoliaMagic"));
assert.ok(!loginUser.includes("new Magic("));
assert.ok(!loginUser.includes('from "magic-sdk"'));
const startScreen = read("components/onboarding/StartOnboardingScreen.tsx");
assert.ok(startScreen.includes("resolveSessionDidToken"));
assert.ok(startScreen.includes("continueUserSignature"));
assert.ok(startScreen.includes("resetMessage"));
// Continue path must clear stale guard copy then resolve DID via Sepolia singleton.
const continueIdx = startScreen.indexOf("onContinueSignature");
assert.ok(continueIdx > 0);
const continueSlice = startScreen.slice(continueIdx, continueIdx + 900);
assert.ok(continueSlice.includes("resetMessage"));
assert.ok(continueSlice.includes("resolveSessionDidToken"));
assert.ok(continueSlice.includes("continueUserSignature"));
assert.equal(mapBackendStatusToProductPhase("AWAITING_USER_PARENT"), "confirming");
console.log("ok — single Magic on Continue resume");

section("BFF routes exist and strip wallet fields");
const provisionRoute = read("app/api/passport/provision/route.ts");
assert.ok(provisionRoute.includes("idempotencyKey"));
assert.ok(provisionRoute.includes("label"));
assert.ok(!provisionRoute.includes("ownerWallet"));
const mintAdapterRoute = read("app/api/passport/mint-adapter/route.ts");
assert.ok(mintAdapterRoute.includes("mint-adapter"));
assert.ok(mintAdapterRoute.includes("Passport creation is temporarily unavailable."));
assert.ok(!mintAdapterRoute.includes("FEATURE_DISABLED"));
assert.ok(
  !mintAdapterRoute.includes("reason:") ||
    mintAdapterRoute.includes("Strips internal reasons")
);
assert.ok(
  read("app/api/passport/provision/[id]/platform/advance/route.ts").includes(
    "platform/advance"
  )
);
assert.ok(
  read(
    "app/api/passport/provision/[id]/user-transaction/route.ts"
  ).includes("transactionHash")
);
const bffProxy = read("lib/passport/provision/bff-proxy.ts");
assert.ok(bffProxy.includes('delete row.reason'));
assert.ok(bffProxy.includes("Passport creation is temporarily unavailable."));
console.log("ok — BFF");

section("Resume storage is non-sensitive");
const resume = read("lib/passport/provision/resume-storage.ts");
assert.ok(resume.includes("provisioningId"));
assert.ok(resume.includes("idempotencyKey"));
assert.ok(!resume.includes("didToken"));
assert.ok(!resume.includes("privateKey"));
assert.ok(!resume.includes("signedTransaction"));
assert.ok(!resume.includes("ENS_SEPOLIA_RPC_URL"));
console.log("ok — resume storage");

section("UI — Create gated when adapter unavailable; no fake success");
const start = read("components/onboarding/StartOnboardingScreen.tsx");
assert.ok(start.includes("mintAdapter"));
assert.ok(start.includes("temporarily unavailable") || start.includes("gate.canCreate"));
assert.ok(start.includes("usePassportProvisionFlow"));
assert.ok(start.includes("ProvisionProgress"));
assert.ok(!start.includes("ensStatus = \"ISSUED\""));
const progress = read("components/onboarding/ProvisionProgress.tsx");
assert.ok(progress.includes("Continue creating Passport"));
assert.ok(progress.includes("Development details"));
const phases = read("lib/passport/provision/product-phase.ts");
assert.ok(phases.includes("Confirmation cancelled. You can continue when ready."));
console.log("ok — UI");

section("Error mapping product copy");
assert.equal(
  productMessageForProvisionError("LABEL_TAKEN"),
  "That Passport name is no longer available."
);
assert.equal(
  productMessageForProvisionError("PASSPORT_ALREADY_EXISTS"),
  "This wallet already has a Passport."
);
assert.equal(
  productMessageForProvisionError("MINT_ADAPTER_UNAVAILABLE", "FEATURE_DISABLED"),
  "Passport creation is temporarily unavailable."
);
assert.equal(
  productMessageForProvisionError("unknown_code", "FEATURE_DISABLED"),
  "Passport creation is temporarily unavailable."
);
assert.ok(
  !productMessageForProvisionError("MINT_ADAPTER_UNAVAILABLE").includes("FEATURE")
);
console.log("ok — errors");

section("No client platform secrets");
for (const f of [
  "hooks/usePassportProvisionFlow.ts",
  "lib/passport/provision/client.ts",
  "components/onboarding/StartOnboardingScreen.tsx",
]) {
  const src = read(f);
  assert.ok(!/ENS_SEPOLIA_RPC_URL/.test(src), f);
  assert.ok(!/ENS_PASSPORT_MINT_ENABLED/.test(src), f);
  assert.ok(!/PRIVATE_KEY/.test(src), f);
}
console.log("ok — no secrets / no gate flip");

console.log("\nAll passport provision tests passed.");
