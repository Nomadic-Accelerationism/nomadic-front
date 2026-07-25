/**
 * ===== FRONTEND PRODUCT FIXTURE (not from backend) =====
 *
 * Seeded Nomadic Lisbon House Journey for ETHGlobal Lisbon 2026 P0 UI.
 * Replace with Journey API (`GET /api/journeys/lisbon-house` → Express) when available.
 *
 * Do not treat these values as authoritative DB rows or issued credentials.
 */

export const LISBON_HOUSE_JOURNEY_SOURCE = "frontend-fixture" as const;

export type ProofRequirementStatus =
  | "not_started"
  | "integration_unavailable"
  | "completed"
  | "failed";

export type PolicyRequirement = {
  id: string;
  title: string;
  summary: string;
  whyRequired: string;
  /** Product concept only until World E2E confirms attributes. */
  confirmationState: "aspirational" | "confirmed";
};

export type LisbonHouseJourneyFixture = {
  source: typeof LISBON_HOUSE_JOURNEY_SOURCE;
  slug: "lisbon-house";
  community: {
    name: string;
    summary: string;
  };
  journey: {
    title: string;
    location: string;
    datesLabel: string;
    startsAt: string;
    endsAt: string;
    capacity: number;
    seatsRemaining: number | null;
    description: string;
    imageSrc: string;
    availabilityLabel: string;
  };
  policy: {
    key: "lisbon_house_policy_v1";
    displayName: string;
    requirements: PolicyRequirement[];
    dataMinimization: {
      designedNotToRetain: string[];
      disclosure: string;
    };
  };
  application: {
    /** Fixture-only; never claim a real application exists. */
    state: "not_started";
    credentialKeyIfIssued: "NOMADIC_LISBON_HOUSE_ELIGIBLE";
  };
  proofs: {
    identityCheck: {
      title: string;
      description: string;
      status: ProofRequirementStatus;
    };
    selfieCheck: {
      title: string;
      description: string;
      status: ProofRequirementStatus;
    };
  };
  routes: {
    detail: string;
    apply: string;
  };
};

export const LISBON_HOUSE_JOURNEY: LisbonHouseJourneyFixture = {
  source: LISBON_HOUSE_JOURNEY_SOURCE,
  slug: "lisbon-house",
  community: {
    name: "Nomadic Lisbon House",
    summary:
      "A temporary hacker-house community in Lisbon during ETHGlobal week — shared work, shared living, portable credentials.",
  },
  journey: {
    title: "Lisbon Hacker House",
    location: "Lisbon",
    datesLabel: "May 2026 · ETHGlobal Lisbon week",
    startsAt: "2026-05-01",
    endsAt: "2026-05-10",
    capacity: 24,
    seatsRemaining: null,
    description:
      "Apply to join Nomadic Lisbon House: a short residency for builders who want community continuity beyond the hackathon weekend. Eligibility is checked privately against Lisbon House Policy v1.",
    imageSrc: "/images/nomadic.webp",
    availabilityLabel: "Applications opening with World verification",
  },
  policy: {
    key: "lisbon_house_policy_v1",
    displayName: "Lisbon House Policy v1",
    requirements: [
      {
        id: "minimum_age_18",
        title: "Minimum age: 18+",
        summary: "Confirm you meet the adult age requirement for shared accommodation.",
        whyRequired:
          "The Lisbon House includes shared accommodation and is available only to adults. Nomadic does not need your exact age or date of birth—only confirmation that you meet the minimum-age requirement.",
        confirmationState: "aspirational",
      },
      {
        id: "document_backed_identity",
        title: "Document-backed Identity Check signal",
        summary:
          "Privately prove the minimum attributes this Journey requires without sharing document details with Nomadic.",
        whyRequired:
          "The community needs a stronger eligibility signal than email alone. Nomadic only needs confirmation that the policy was satisfied, not your document details.",
        confirmationState: "aspirational",
      },
      {
        id: "selfie_check",
        title: "Selfie Check completed",
        summary:
          "Confirm recent presence and help protect the application action.",
        whyRequired:
          "Selfie Check confirms recent presence and helps protect the application from automated or repeated submissions.",
        confirmationState: "aspirational",
      },
      {
        id: "one_application_per_passport",
        title: "One application per verified Passport identity",
        summary:
          "Each verified Passport identity may submit one application for this Journey.",
        whyRequired:
          "Fairness for limited capacity — the same person should not submit multiple competing applications.",
        confirmationState: "aspirational",
      },
    ],
    dataMinimization: {
      designedNotToRetain: [
        "Legal name",
        "Full date of birth",
        "Document number",
        "Document photograph",
        "Selfie image",
        "Raw World proof",
      ],
      disclosure:
        "Nomadic is designed to retain only the minimum result needed to determine whether this Journey's eligibility policy was satisfied.",
    },
  },
  application: {
    state: "not_started",
    credentialKeyIfIssued: "NOMADIC_LISBON_HOUSE_ELIGIBLE",
  },
  proofs: {
    identityCheck: {
      title: "Identity Check",
      description:
        "Privately prove the minimum attributes required by a Journey without sharing the underlying identity data with Nomadic.",
      status: "integration_unavailable",
    },
    selfieCheck: {
      title: "Selfie Check",
      description:
        "Confirm recent presence and protect a Journey application action.",
      status: "integration_unavailable",
    },
  },
  routes: {
    detail: "/journeys/lisbon-house",
    apply: "/journeys/lisbon-house/apply",
  },
};

export function getLisbonHouseJourney(): LisbonHouseJourneyFixture {
  return LISBON_HOUSE_JOURNEY;
}

export function proofStatusLabel(status: ProofRequirementStatus): string {
  switch (status) {
    case "not_started":
      return "Not started";
    case "integration_unavailable":
      return "Integration unavailable";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    default:
      return "Not started";
  }
}
