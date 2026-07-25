# Nomadic — Project Context (ETHGlobal Lisbon 2026)

> Status of this document: high-level context after reading product direction and inspecting **only** the repository structure of `Nomadic-Accelerationism/nomadic-front`.  
> No application functionality was implemented or modified for this document.  
> Runtime behaviour of existing features has **not** been verified.

---

## How to read this document

| Category | Meaning |
| --- | --- |
| **Known project information** | Stated product/history context, or structural facts observed in this repository (files, folders, declared dependencies). Not claims that features work. |
| **Tentative product direction** | Intended Lisbon demo / product goals. Not a confirmed implementation plan. |
| **Needs investigation** | Technical or product questions that require reading code, running the app, or inspecting other repositories. |

---

## 1. What Nomadic is

**Known project information (product intent):**

Nomadic is intended to become a portable identity, participation, and reputation passport for people who move between hacker houses, hackathons, crypto communities, events, temporary residences, and collaborative projects.

A user should be able to maintain a public or selectively shareable profile containing, among other things:

- identity linked to a wallet;
- event participation;
- community credentials;
- journeys;
- hacker-house participation;
- reputation signals;
- proofs or credentials earned over time.

The core idea is **continuity**: a person should not have to rebuild their identity and reputation every time they enter a new community.

---

## 2. Lisbon 2026 objective

**Tentative product direction:**

Nomadic is being revived for **ETHGlobal Lisbon 2026** as a **continuity project**:

- substantial work existed before the hackathon;
- pre-existing work must be documented honestly;
- new hackathon work must be clearly separated;
- repository history should remain understandable;
- we must not pretend old functionality was built during Lisbon.

The Lisbon version should focus on a simple **Nomadic Passport**, with an approximate intended flow:

1. User connects a wallet.
2. Nomadic resolves their wallet identity.
3. User creates or opens their Nomadic Passport.
4. User sees credentials, journeys, or participation history.
5. User opens an event or community credential.
6. User proves they are a real person.
7. The credential is claimed.
8. Duplicate claims by the same real person are prevented.
9. The credential appears on their passport.
10. The passport can be shared through a public route.

This flow is product direction only. How much of it already exists, and how much must be built, is still unknown.

**Hackathon branch convention (this workstream):** work for Lisbon should live on a dedicated branch (currently `lisboa2026`) so `main` remains undisturbed.

---

## 3. Planned role of ENS

**Tentative product direction — primary integration:**

ENS should be a meaningful part of the identity layer. Candidate uses (not all must ship):

- resolve the connected wallet’s ENS name;
- display ENS avatar / profile information;
- find a Nomadic Passport by ENS name;
- use ENS as the human-readable identity of a Nomadic profile;
- optionally use ENS records or subnames if justified.

**Constraint:** do not implement every ENS feature. Final selection must be based on demo value and feasibility after inspecting existing auth/identity code.

**Needs investigation:** whether any ENS-related code, dependencies, or UI already exist in this frontend or in `nomadic-back`.

---

## 4. Planned role of World Selfie Check

**Tentative product direction — primary integration:**

World should **not** be used only as generic login. Intended use:

- one real person can claim a particular event/community credential only once;
- Selfie Check acts as abuse-prevention, fairness, and continuity signal;
- Nomadic verifies the proof **server-side**;
- duplicate credential claims are rejected;
- the app does not collect unnecessary identity information.

Expected track: **World Selfie Check Beta** — beta access and technical details still need confirmation with the World team.

**Structural observation (not verified behaviour):** this frontend already references World-related proof naming and assets (e.g. `WORLD_ID_POH`, `world-id-icon.png`). That does **not** mean Selfie Check, server-side verification, or anti-duplicate claim logic exists or works.

---

## 5. Optional role of Walrus / Sui

**Tentative product direction — secondary / optional:**

Possible uses after ENS and World flows work:

- passport metadata;
- journey metadata;
- credential metadata;
- images or supporting files.

**Constraint:** Walrus must not be added merely to name another sponsor. Only after ENS and World are functional.

**Needs investigation:** whether any Walrus/Sui code or storage patterns already exist in any Nomadic repository.

---

## 6. Known constraints

**Known project information (team & process):**

- Currently developed primarily by one person (designer-led), with heavy use of Cursor / Codex / ChatGPT.
- Architecture must stay understandable; avoid unnecessary complexity.
- Generated code should be easy to review; changes should be incremental.
- Application should remain deployable throughout the hackathon.
- Features must be prioritized around a convincing working demo.
- Continuity honesty: separate pre-existing work from Lisbon work.

**Known project information (this repository, structural):**

- Repository inspected: `Nomadic-Accelerationism/nomadic-front`.
- Stack (from `package.json`): Next.js 14 App Router, React 18, TypeScript, Tailwind, Privy (`@privy-io/react-auth`), Magic SDK, Axios, TanStack Query, Radix/shadcn-style UI.
- Env placeholders in `.env.example`: `NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY`, `NEXT_PUBLIC_NOMADIC_API_URL`, `NEXT_PUBLIC_PRIVY_APP_ID`.
- High-level areas present by route/folder name: landing, user/house login, home-user / home-house, journeys (create/edit/preview/apply/success), hacker journeys, house detail, user proofs, nacc tokens, generate single-use id, API auth proxy routes under `app/api/auth/`.
- Domain vocabulary in interfaces includes `Proof` and `Journey` (see terminology below).
- README is still the default create-next-app boilerplate; it does not document Nomadic product behaviour.
- No `docs/` directory existed before this file.

**Do not (for early Lisbon setup / until explicitly decided):**

- redesign the whole interface;
- delete existing features;
- rename major domain concepts prematurely;
- create a new application or monorepo;
- expose secret values;
- assume what currently works.

---

## 7. Open technical and product questions

1. **Passport model:** Does a “Nomadic Passport” already exist as a first-class entity, or is it assembled from profile + proofs + journeys?
2. **Public share route:** Is there already a public profile/passport URL, or must it be designed for Lisbon?
3. **Meaning of `Proof`:** In the current model, is a proof a verification check for journey eligibility, a claimable credential, both, or something else?
4. **Proof vs Credential:** For Lisbon UX, should “Credential” be a product label only, while keeping `Proof` in code?
5. **Auth reality:** Which of Privy, Magic, wallet connect, and OTP/bearer flows are actually used end-to-end today?
6. **Backend dependency:** What does `NEXT_PUBLIC_NOMADIC_API_URL` point to in practice, and is `nomadic-back` the live API for this frontend?
7. **World today vs Selfie Check:** What does existing World / `WORLD_ID_POH` do today, and how far is it from Selfie Check + server-side anti-duplicate claims?
8. **ENS:** Any existing resolution/display of ENS anywhere in front or back?
9. **Duplicate-person prevention:** Any uniqueness keyed to a real-person signal today, or only wallet/address uniqueness?
10. **Demo scope:** Minimum path for a convincing Lisbon demo (wallet → passport → claim → share)?
11. **Other repos:** What reusable work lives in `nomadic-back`, older `Nomadic-App` / `Nomadic-Backend`, `nomadic-contracts`, `Nomadic-nillion`, and `Design`?
12. **Deployability:** Current production/preview deploy status and env readiness for a continuous demo URL?
13. **World beta access:** Confirmed Selfie Check Beta access and verification API details?
14. **Feature triage:** Which of journeys, hacker houses, budgets, X verification, Sozu proofs, NACC tokens, single-use IDs belong in the Lisbon demo vs later?

---

## 8. Assumptions that still need verification from repositories

These are **assumptions**, not confirmed facts:

| Assumption | Why it needs verification |
| --- | --- |
| `nomadic-front` is the correct Lisbon frontend base | Older frontends may contain better or more complete work. |
| `nomadic-back` is the matching backend | Only env naming suggests an external Nomadic API; backend not inspected here. |
| Existing login/home/journey/proof screens are partially reusable for a Passport demo | Structure suggests related concepts; behaviour unknown. |
| Privy and/or Magic are active auth paths | Both appear in dependencies/env; usage and health unknown. |
| “Proofs” can evolve into Lisbon “Credentials” without a full rewrite | Domain overlap is plausible; data model and UX mapping unknown. |
| World-related assets/enums indicate prior World interest | Presence ≠ working Selfie Check or claim anti-abuse. |
| Journey / hacker-house flows are secondary for Lisbon | Product direction says Passport-first; code may be journey-centric. |
| No ENS / Walrus integration exists yet in this frontend | Not observed in high-level structure; deeper search and other repos still needed. |
| The app is currently deployable with working API connectivity | Not verified. |

---

## 9. Distinction summary

### Known project information

- Product intent: portable identity / participation / reputation passport across communities.
- Lisbon is a continuity revival for ETHGlobal 2026 with honest separation of old vs new work.
- Team constraint: solo developer, AI-assisted, demo-first, keep architecture simple.
- This repo (`nomadic-front`) is a Next.js 14 frontend with routes and modules named around login, homes, journeys, hacker houses, proofs, tokens, and API auth proxies.
- Declared integrations visible at dependency/env level include Privy, Magic, and an external Nomadic API URL.
- Terminology in code currently includes `Proof` and `Journey`.

### Tentative product direction

- Simple Nomadic Passport demo flow (connect → resolve identity → passport → claim credential with uniqueness → share).
- ENS as primary identity-layer integration (scoped to demo value).
- World Selfie Check as primary uniqueness / fairness integration (server-side verify; no unnecessary PII).
- Walrus/Sui optional and only after ENS + World work.
- Prefer product language “Credential” for Lisbon UX; do not rename code concepts yet.

### Technical facts that still need investigation

- Whether any feature above actually works end-to-end.
- Exact data model and API contracts for users, proofs, journeys, houses.
- Backend repository contents and alignment with this frontend.
- Contents and usefulness of older public/private Nomadic repositories.
- Current World implementation depth vs Selfie Check Beta requirements.
- Presence/absence of ENS and Walrus anywhere in the stack.
- What to keep, freeze, or hide for the Lisbon demo without deleting history.

---

## 10. High-level structure observed in `nomadic-front`

Structural map only (names as found; not a functional audit):

```
nomadic-front/
├── app/                      # Next.js App Router pages
│   ├── page.tsx              # landing entry
│   ├── login-user/
│   ├── login-house/
│   ├── home-user/
│   ├── home-house/
│   ├── journey-*             # create, edit, preview, apply, success
│   ├── hacker-journeys/
│   ├── house-detail/
│   ├── user-proofs/
│   ├── nacc-tokens/
│   ├── generate-single-use-id/
│   └── api/auth/             # many auth-related API route handlers
├── components/               # UI for the routes above + shadcn-style ui/
├── contexts/                 # e.g. UserContext
├── services/                 # e.g. auth-service
├── interfaces/               # Journey, ProofItem, Participant, ...
├── hooks/, lib/, types/, data/
├── public/                   # brand images, proof icons (incl. world-id)
├── package.json              # Next 14, Privy, Magic, etc.
└── README.md                 # default Next.js boilerplate
```

Related repositories believed to exist but **not inspected in this pass**:

- `Nomadic-Accelerationism/nomadic-back` (backend)
- Older: `Nomadic-App`, `Nomadic-Backend`, `nomadic-contracts`, `Nomadic-nillion`, `Design`

---

## 11. Suggested next documentation / investigation steps

Without implementing product features yet:

1. Inventory routes and user flows in `nomadic-front` (what each page is for).
2. Map frontend API calls to backend endpoints; inspect `nomadic-back` structure and models.
3. Classify existing features: working / partial / broken / out of Lisbon scope / later.
4. Define Lisbon demo MVP and explicitly list what is pre-existing vs new.
5. Confirm World Selfie Check Beta access and ENS demo slice.

---

## Document metadata

| Field | Value |
| --- | --- |
| Created for | ETHGlobal Lisbon 2026 continuity workstream |
| Repository inspected | `Nomadic-Accelerationism/nomadic-front` |
| Inspection depth | High-level repository structure + package/env surface + interface naming for terminology questions |
| Application code changed | None (documentation only) |
| Branch intended for Lisbon work | `lisboa2026` |
