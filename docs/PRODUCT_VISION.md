# Nomadic — Product Vision

> North-star product definition for Nomadic.  
> The ETHGlobal Lisbon 2026 hackathon slice is documented in [`LISBON_MVP.md`](./LISBON_MVP.md).  
> This file explains **what Nomadic is**, so World and ENS never replace the product.

---

## 1. Definition

```text
Nomadic is a portable identity, eligibility and reputation passport
for people moving between temporary communities.

Communities create journeys and define what participants need to prove.
Users privately satisfy those policies with World and carry the resulting
credentials through an ENS-controlled identity.
```

Nomadic must **not** become:

- a World KYC / age-verification app;
- a technical ENS minting demo;
- a “Connect → verify → mint → done” sponsor checklist.

The core flow remains:

```text
Discover a place
→ understand its community
→ apply privately
→ participate
→ carry the experience forward
```

---

## 2. Original idea vs stronger idea

### Original (hackathon scaffolding)

```text
Person
→ discovers a hacker house or journey
→ demonstrates certain proofs
→ participates
→ accumulates reputation
→ moves to the next community
```

### Stronger (product direction)

```text
Person
→ has a Nomadic Passport
→ discovers a Journey or community
→ reviews its entry policy
→ privately proves they meet the requirements
→ receives a verifiable credential
→ the credential stays on their Passport
→ they reuse reputation in the next community
```

That is still Nomadic. Identity, proofs, and journeys now work for real.

---

## 3. Five product entities

### 3.1 Passport

The user’s portable identity container.

**Contains:**

- wallet;
- ENS name / avatar (alias layer);
- credentials;
- previous journeys;
- communities;
- granted permissions / delegations (later).

**Does not contain:**

- legal name;
- passport / ID numbers;
- photos of documents;
- date of birth as stored PII;
- full World payloads.

**Routes (Lisbon):** private `/passport`; public `/p/[identifier]`.

P0.1 already shipped a Passport **shell** in `nomadic-front`. The shell is the destination after Journey flows — not the whole product.

### 3.2 Community

A hacker house, residency, event, collective, or pop-up city.

Examples: Nomadic Lisbon House, Zuzalu Residency, ETHGlobal Lisbon, a developer collective.

A community can:

- create journeys;
- define eligibility policies;
- issue credentials;
- verify existing credentials presented by applicants.

### 3.3 Journey

A **temporary opportunity** — one of Nomadic’s original core ideas. Journeys must not disappear; they are the context where verification makes sense.

Example:

```text
Lisbon Hacker House
July 20–27
20 places
Accommodation included
Application required
```

### 3.4 Eligibility Policy

Each Journey declares a versioned policy. This replaces the old flat `requiredProofs` list with a stronger product concept while preserving the same intent.

Example:

```text
Lisbon House Policy v1
Required:
- 18 or older
- eligible jurisdiction
- unique verified document
- verified developer or hacker credential (when available)
Optional:
- previous hacker house participation
- ETHGlobal credential
- community references
```

The community defines the policy. World proves only the attributes the policy needs. Nomadic stores satisfaction results — not the underlying legal identity.

### 3.5 Credential

The portable outcome.

Examples:

- Meets Lisbon House Policy v1  
- Nomadic Lisbon House — Eligible  
- Stayed at Nomadic Lisbon House  
- ETHGlobal Hacker (only with organizer evidence)  
- Community Contributor  
- Returning Nomadic Member  

**Issuance model:** World verifies conditions; the **community** issues (or authorizes) the credential; ENS lets the user own and transport it.

---

## 4. How World fits without eating the product

### Identity Check = private eligibility engine

World does **not** decide who “deserves” a hacker house.

Flow:

```text
Community asks:
  Over 18?
  Eligible jurisdiction?
  Unique verified document?
World answers:
  true / true / true
```

Nomadic must **not** receive (unless strictly required and explicitly consented):

- legal name;
- date of birth;
- document number;
- photograph;
- street address;
- exact country when a coarser eligibility bit suffices.

Nomadic stores approximately:

```text
policySatisfied
verificationProvider
timestamp
policyVersion
uniquenessReference
```

So the product is **not** “an app to verify passports”.

It is:

```text
A platform where communities create access policies
and users privately prove they satisfy them.
```

### Selfie Check = continuity

Selfie Check is not an arbitrary extra button.

Inside Nomadic it should:

- recognize a returning user;
- limit abuse;
- prevent multiple applications to the same Journey by the same verified identity;
- allow return without repeating full document onboarding;
- bind future interactions to the same Passport continuity signal.

```text
Identity Check:  Do I satisfy this policy?
Selfie Check:    Am I continuing the same Nomadic identity?
```

---

## 5. How ENS fits without becoming decoration

### 1. Portable identity (Lisbon: Sepolia ENSv2)

```text
victor.nomadic-passport.eth
→ wallet
→ Nomadic Passport
→ public credentials (ENS records + children)
```

Backend identity key remains the wallet. **Product identity** after onboarding is the Passport ENS name. Lisbon mints on **Sepolia** (clearly labeled testnet).

### 2. Credential hierarchy (Lisbon P0)

```text
nomadic-passport.eth
└── victor.nomadic-passport.eth
    └── lisbon-house.victor.nomadic-passport.eth
```

World verifies policy; Nomadic mints the credential child; the app **reloads identity from ENS records**.

### 3. Delegated issuance (Lisbon P0 demo)

Passport owner controls identity; Lisbon House gets **scoped** permission only on the credential child’s public records; user can **revoke** and issuer updates must revert. See [ENS_SEPOLIA_V2_CYCLE.md](./ENS_SEPOLIA_V2_CYCLE.md).

---

## 6. Architecture tree

```text
Nomadic Passport
│
├── Identity
│   ├── Magic account
│   ├── wallet
│   └── ENS Passport name
│
├── Journeys
│   ├── Lisbon Hacker House
│   ├── Residency
│   └── Community event
│
├── Eligibility Policies
│   ├── age constraint
│   ├── jurisdiction constraint
│   ├── document-backed uniqueness
│   └── existing credential requirements
│
├── Private Verification
│   ├── World Identity Check
│   └── World Selfie Check
│
└── Credentials
    ├── stored by Nomadic
    ├── publicly shareable
    ├── represented through ENS
    └── issued through scoped permissions
```

---

## 7. Ideal demo narrative (product story)

1. **Passport ENS** — mint `victor.nomadic-passport.eth` on Sepolia; set primary name.  
2. **Journey** — open Nomadic Lisbon House (dates, capacity, description, policy, apply).  
3. **Transparent policy** — explain what will be proven; state what Nomadic will **not** receive.  
4. **Identity Check** — private eligibility; Nomadic gets policy satisfied.  
5. **Selfie Check** — continuity / one application per verified identity.  
6. **Application** — linked to Journey, user, policy version, attestations, timestamp.  
7. **Credential ENS** — mint `lisbon-house.victor.nomadic-passport.eth` + public records; UI rediscovers from ENS.  
8. **Permissions** — scoped issuer grant + user revoke (issuer update reverts).  
9. **Portability** — `/p/victor.nomadic-passport.eth` reconstructs Passport from ENS across sessions.

---

## 8. Where complexity belongs

UI stays simple. Complexity lives underneath:

| Layer | Complexity |
| --- | --- |
| World | Multi-attribute policies, minimization, Identity + Selfie, action uniqueness, consent, abandonment, testing docs |
| ENS | Passport name, credential subnames, resolver records, roles, issuer delegation, provenance, expiry/revocation, Universal Resolver fallback |
| Nomadic | Journey policy engine, Passport aggregation, credential lifecycle, public/private presentation, continuity across communities |

---

## 9. Anti-patterns

Do **not**:

- make the landing “Verify your age with World”;
- make the product “Mint an ENS subname”;
- make the primary flow “Connect → verify → mint → done”.

Do:

```text
Discover a place
→ understand its community
→ apply privately
→ participate
→ carry the experience forward
```

---

## 10. Lisbon relationship

| Document | Role |
| --- | --- |
| This file | Product north star |
| [`LISBON_MVP.md`](./LISBON_MVP.md) | Hackathon slice: one seeded Journey + policy + World checks + credential + Passport |
| [`LISBON_ARCHITECTURE.md`](./LISBON_ARCHITECTURE.md) | Technical hybrid design for that slice |
| [`LISBON_ROUTES.md`](./LISBON_ROUTES.md) | Contracts for that slice |
| [`LISBON_IMPLEMENTATION_PLAN.md`](./LISBON_IMPLEMENTATION_PLAN.md) | Solo-dev build order |
| [`PREEXISTING_VS_LISBON.md`](./PREEXISTING_VS_LISBON.md) | Continuity honesty |

World is the private verification system.  
ENS is ownership and portability.  
Journeys are where everything happens.  
Credentials are what the user carries forward.
