# GrantShield — Privacy-Preserving Scholarship & Grant Eligibility
*Midnight Builder Challenge — Approved Product Proposal*

---

## Executive Summary

**GrantShield** is a privacy-preserving infrastructure for scholarships, grants, fellowships, and financial-aid programs. It allows applicants to prove that they satisfy an organization's eligibility requirements without exposing sensitive personal, academic, financial, or identity records used to determine that eligibility.

Today, scholarship and grant applications generally require applicants to submit large amounts of sensitive information: exact age, transcripts, cumulative GPA, family income, tax returns, enrollment status, government IDs, and supporting documents. Different organizations then store, process, and verify that information, creating severe privacy risks, regulatory liabilities (FERPA, GDPR), and applicant hesitation. In almost all cases, the verifier needs to know only **whether an applicant satisfies a particular rule**, but the applicant must disclose the underlying information to prove it.

GrantShield changes this model from:
> **"Share the data to prove the fact"** ➔ **"Prove the fact without unnecessarily revealing the data."**

---

## How It Works

A scholarship or grant sponsor creates a program and defines its eligibility policy. For example:
- Applicant must be under a certain age (e.g. `< 35 years`)
- GPA must be above a specified threshold (e.g. `≥ 7.0 / 10.0`)
- Household income must be below a specified threshold (e.g. `< ₹5,00,000 / year`)
- Applicant must be currently enrolled in an accredited institution
- Applicant must belong to an eligible region or discipline
- Applicant must possess a valid credential

The applicant keeps the underlying information private in their local browser and generates a zero-knowledge proof that the required conditions are satisfied.

For example, an applicant privately has:
- `Age = 22`
- `GPA = 8.1`
- `Household income = ₹3.2 lakh`
- `Enrollment status = valid`

The sponsor does not receive any of those raw values. Instead, GrantShield provides a verifiable result on Midnight:
- ✓ Age requirement satisfied
- ✓ GPA requirement satisfied
- ✓ Income requirement satisfied
- ✓ Enrollment requirement satisfied
- ✓ Eligibility proof valid & claim nullifier registered

The underlying values remain private.

---

## Privacy Model & Selective Disclosure

GrantShield is designed around **selective disclosure**:

### 1. Private Information (Kept in Browser / Private Witnesses)
- Full legal identity & government IDs
- Student or employee ID numbers
- Exact age and date of birth
- Exact cumulative GPA and letter grades
- Exact household income and tax documentation
- Supporting institutional credentials
- Applicant secret keys

### 2. Public Information (On-Chain Midnight State)
- Grant or scholarship program identifier
- Program eligibility policy commitments
- Circuit proof validity (boolean)
- Application and claim status
- Aggregate program statistics
- Publicly verifiable distribution records
- Cryptographic claim nullifier (preventing duplicate claims)

---

## Duplicate Claim Prevention (Nullifier Mechanism)

A key risk in grant disbursements is duplicate applications or double claims. GrantShield solves this through cryptographic nullifiers:
$$\text{Nullifier} = \text{PoseidonHash}(\text{ApplicantSecretKey}, \text{ProgramID})$$

When an eligibility proof is verified on-chain, the Midnight Compact contract checks:
```compact
assert(!nullifiers.member(nullifier), "Grant already claimed");
nullifiers.insert(nullifier);
verifiedClaims = (verifiedClaims + 1) as Uint<32>;
```
If the same applicant attempts to submit another claim for the same program, the nullifier collision triggers an immediate on-chain revert—without disclosing the applicant's identity or linking their claims across programs.

---

## Sponsor Console

Grant sponsors receive a dashboard for creating and managing programs. Sponsors can monitor:
- **Grant Budget:** ₹10,00,000
- **Applications:** 143
- **Eligible Applicants:** 87
- **Approved:** 50
- **Claims Completed:** 48
- **Recent Proofs:** Cryptographic nullifiers and timestamps without PII

---

## Why Midnight?

Midnight is uniquely suited for GrantShield because the core challenge is not simply storing encrypted records in a decentralized database; it is **proving mathematical statements about private data while minimizing what is disclosed**.

GrantShield uses Midnight for:
1. **Private Witnesses & State:** Credentials remain private on the client device.
2. **Compact ZK Circuits:** Enforces range proofs and threshold assertions (`age < 35`, `gpa >= 70`, `income < 500000`).
3. **Selective Disclosure:** Only the claim nullifier and proof validity are disclosed to the ledger.
4. **On-Chain Nullifier Set:** Enforces one-time disbursement guarantees.
5. **Preprod Testnet Verifiability:** Provides immutable, publicly auditable assurance to donors, sponsors, and auditors.
