export type ReviewScreen = {
  title: string;
  route: string;
  access: "public" | "session" | "legacy" | "internal";
  preview?: "passport-name" | "explore" | "passport" | "journey" | "apply";
};

export type ReviewScreenGroup = {
  title: string;
  description: string;
  screens: ReviewScreen[];
};

export const DESIGN_REVIEW_GROUPS: ReviewScreenGroup[] = [
  {
    title: "Demo flow",
    description: "The screens that tell the Nomadic Lisbon story.",
    screens: [
      { title: "Landing", route: "/", access: "public" },
      { title: "Nomad email login", route: "/login-user", access: "public" },
      {
        title: "Choose Passport name",
        route: "/start",
        access: "session",
        preview: "passport-name",
      },
      {
        title: "Explore",
        route: "/explore",
        access: "session",
        preview: "explore",
      },
      {
        title: "Passport",
        route: "/passport",
        access: "session",
        preview: "passport",
      },
      {
        title: "Lisbon House Journey",
        route: "/journeys/lisbon-house",
        access: "session",
        preview: "journey",
      },
      {
        title: "Lisbon House application",
        route: "/journeys/lisbon-house/apply",
        access: "session",
        preview: "apply",
      },
      {
        title: "Public Passport",
        route: "/p/testinggg",
        access: "public",
      },
    ],
  },
  {
    title: "House and legacy",
    description: "Older routes kept reachable but outside the current demo path.",
    screens: [
      { title: "House login", route: "/login-house", access: "legacy" },
      { title: "House home", route: "/home-house", access: "legacy" },
      { title: "House detail", route: "/house-detail", access: "legacy" },
      { title: "Hacker Journeys", route: "/hacker-journeys", access: "legacy" },
      { title: "Create Journey", route: "/journey-create", access: "legacy" },
      { title: "Edit Journey", route: "/journey-edit", access: "legacy" },
      { title: "Journey preview", route: "/journey-preview", access: "legacy" },
      { title: "Journey application", route: "/journey-apply", access: "legacy" },
      { title: "Journey success", route: "/journey-success", access: "legacy" },
      { title: "User proofs", route: "/user-proofs", access: "legacy" },
      { title: "NACC tokens", route: "/nacc-tokens", access: "legacy" },
      {
        title: "Single-use ID",
        route: "/generate-single-use-id",
        access: "legacy",
      },
      {
        title: "Lisbon credential placeholder",
        route: "/credentials/lisbon-2026",
        access: "legacy",
      },
    ],
  },
  {
    title: "Internal testing",
    description: "Engineering surfaces; these are not part of the product UI.",
    screens: [
      { title: "World spike", route: "/spikes/world", access: "internal" },
      {
        title: "ENS v2 stage 5A",
        route: "/testing/ensv2-stage5a",
        access: "internal",
      },
      {
        title: "Lisbon feedback",
        route: "/testing/lisbon-feedback",
        access: "internal",
      },
    ],
  },
];

export const DESIGN_PREVIEW_KEYS = [
  "passport-name",
  "explore",
  "passport",
  "journey",
  "apply",
] as const;

export type DesignPreviewKey = (typeof DESIGN_PREVIEW_KEYS)[number];

export function isDesignPreviewKey(value: string): value is DesignPreviewKey {
  return (DESIGN_PREVIEW_KEYS as readonly string[]).includes(value);
}
