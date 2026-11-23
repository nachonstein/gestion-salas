# Domain Landscape

Level: <2 (Domain) | 1 (Global)>
Scope: Strategic
Category: Domain Model
Purpose: [Describe the bounded contexts, glossary, and relationships captured, and who uses this landscape.]

Version: 0.1

Owner: <name/role>

Last updated: <YYYY-MM-DD>

Status: Draft | Active

## Purpose

Guidance: Provide a minimal map of domains, responsibilities, boundaries, and shared language.

Guidance: This is not full DDD. It's enough to scope Feature Specs and place code correctly.

## Domains and responsibilities

Guidance: Define the major domains and what each owns. Keep it concise.

Example:

- Identity & Access: users, authentication, authorization, roles

- Onboarding: verification orchestration, workflow state, provisioning triggers

- Payments: billing profiles, invoices, payment methods

## Domain boundaries (what this domain does NOT own)

Guidance: Prevent cross-domain drift.

Example:

Onboarding does not own authentication logic; it consumes Identity & Access services.

## Ubiquitous language (key terms)

Guidance: Define a small set of terms to prevent naming divergence.

Example:

- Applicant: user who started onboarding but is not yet verified

- Verified Customer: user with completed KYC and active account

- Provisioning: creation of account and initial entitlements

## Cross-domain interactions (high level)

Guidance: Who depends on whom and why; no protocols here.

Example:

Onboarding requests identity verification → Identity & Access validates identity → Onboarding triggers provisioning.

## Client artifacts (optional)

Guidance: If the client has DDD outputs, bounded context maps, event storming, link them here.

- <link to bounded context map>

- <link to event storming outputs>
