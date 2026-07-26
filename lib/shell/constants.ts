/** Mobile product shell — intentionally phone-first. */
export const MOBILE_APP_MAX_WIDTH_PX = 430;

export const PRODUCT_NAV_ROUTES = [
  { id: "explore", label: "Explore", href: "/explore" },
  { id: "passport", label: "Passport", href: "/passport" },
] as const;

export type ProductNavId = (typeof PRODUCT_NAV_ROUTES)[number]["id"];

/** Routes kept reachable by direct URL but excluded from normal navigation. */
export const HIDDEN_FROM_NAV_ROUTES = [
  "/testing/ensv2-stage5a",
  "/testing/lisbon-feedback",
  "/spikes/world",
  "/user-proofs",
  "/hacker-journeys",
  "/nacc-tokens",
  "/generate-single-use-id",
  "/journey-create",
  "/journey-edit",
  "/journey-preview",
  "/journey-apply",
  "/journey-success",
  "/home-house",
  "/house-detail",
  "/login-house",
  "/credentials/lisbon-2026",
] as const;

export const VISIBLE_PRODUCT_ROUTES = [
  "/explore",
  "/passport",
  "/start",
  "/journeys/lisbon-house",
  "/journeys/lisbon-house/apply",
  "/p",
  "/",
  "/login-user",
] as const;
