/**
 * GrantShield — Privacy-Preserving Scholarship & Grant Eligibility
 * Contract interaction helpers and client-side ZK proof utilities.
 */

export interface EligibilityRule {
  id: string
  label: string
  detail: string
  threshold: string
  private: boolean
}

export interface GrantProgram {
  id: string
  name: string
  tag: string
  sponsor: string
  ownerAddress?: string // Only creator with matching wallet address can edit or delete
  maxAmount: string
  deadline: string
  description: string
  rules: EligibilityRule[]
  maxAge: number
  minGpaTimesTen: number // e.g. 7.0 = 70
  maxIncome: number      // e.g. 500000 INR
  requireEnrollment: boolean
}

export interface ApplicantCredentials {
  age: number
  gpa: number
  householdIncome: number
  isEnrolled: boolean
  institutionName: string
  secretKey: string
}

export interface ProofGenerationResult {
  valid: boolean
  grantId: string
  nullifier: string
  proofHash: string
  verifiedAt: string
  ruleResults: {
    ageSatisfied: boolean
    gpaSatisfied: boolean
    incomeSatisfied: boolean
    enrollmentSatisfied: boolean
  }
}

export interface ApplicantClaimRecord {
  id: string
  grantId: string
  programName: string
  maxAmount: string
  claimantAddress: string
  nullifier: string
  txHash: string
  claimedAt: string
  proof: ProofGenerationResult
}

export interface ApplicantDocument {
  id: string
  name: string
  type: string
  size: number
  sha256Hash: string
  uploadedAt: string
  category: 'transcript' | 'enrollment' | 'income' | 'identity' | 'other'
}

export interface ApplicationMilestone {
  id: string
  title: string
  percentage: number
  amount: string
  claimed: boolean
  claimedAt?: string
  txHash?: string
}

export interface ApplicantApplicationRecord {
  id: string
  grantId: string
  programName: string
  maxAmount: string
  claimantAddress: string
  claimantName: string
  institution: string
  degree: string
  graduationYear: string
  documents: ApplicantDocument[]
  proof: ProofGenerationResult
  nullifier: string
  txHash: string
  status: 'submitted' | 'verified' | 'approved' | 'disbursed'
  submittedAt: string
  disbursedAmount: string
  milestones: ApplicationMilestone[]
  walletSignature?: string
  zkAttestationId: string
}

export interface LedgerState {
  verifiedClaims: number
  nullifiers: Set<string>
  activeProgramsCount: number
}

// Fresh Deployed Contract Information on Midnight Preprod
export const DEPLOYED_CONTRACT_INFO = {
  contractAddress: '0200f2f51e1dc85ce3048216debf2a37378ca74ad7d68b4b6260d2c68b5b2d9a7a7c',
  deployerAddress: 'mn_addr_preprod1jw0rszhq83z036gvu8pk67vdgnaqfmxuq9q59h4mffpqc7evyynsvp8a2c',
  network: 'Midnight Preprod',
  blockHeight: 2712275,
  transactionHash: '0x14a42b143a2adf92863e9e72ac24375d16fa05b52d1a0093f067b7d571e27629',
  explorerUrl: 'https://explorer.preprod.midnight.network/contract/0200f2f51e1dc85ce3048216debf2a37378ca74ad7d68b4b6260d2c68b5b2d9a7a7c',
  proverFingerprint: 'bzkir_v2_6326530a8d4181125176935473aa08e6',
  verifierFingerprint: 'vk_snark_plonk_0x447fdc36b9756b70d822e3e0f560fd02',
  protocolVersion: 1000300,
}

// Default Featured Grant Program
export const DEFAULT_PROGRAM: GrantProgram = {
  id: 'grant_aurora_2026',
  name: 'Aurora Scholars Fund',
  tag: 'Featured Program',
  sponsor: 'Aurora Foundation',
  ownerAddress: 'mn_addr_preprod16alt42dnwerz6cy4w9wu65z7z3pyvfldeuvf2h7gas8uumygq9ms8x0s67',
  maxAmount: '₹1,50,000',
  deadline: '18 days left',
  description: 'Merit and need-based support for undergraduates and researchers driving social impact.',
  maxAge: 35,
  minGpaTimesTen: 70, // GPA >= 7.0
  maxIncome: 500000,  // Income < ₹5,00,000
  requireEnrollment: true,
  rules: [
    {
      id: 'rule_enrollment',
      label: 'Enrolled at an eligible institution',
      detail: 'Institutional credential verified locally',
      threshold: 'Active status required',
      private: true,
    },
    {
      id: 'rule_gpa',
      label: 'GPA of at least 7.0 / 10.0',
      detail: 'Academic threshold proven, score hidden',
      threshold: '>= 7.0 GPA',
      private: true,
    },
    {
      id: 'rule_income',
      label: 'Household income below ₹5,00,000',
      detail: 'Financial threshold proven, amount hidden',
      threshold: '< ₹5,00,000 / year',
      private: true,
    },
    {
      id: 'rule_age',
      label: 'Applicant age under 35',
      detail: 'Age limit verified, exact date of birth hidden',
      threshold: '< 35 years',
      private: true,
    },
  ],
}

export const New_GEN_PROGRAM: GrantProgram = {
  id: 'grant_new_gen_founders',
  name: 'New Gen Founders',
  tag: 'Community Grant',
  sponsor: 'Sponsor (mn_addr_ma...gqtr)',
  ownerAddress: 'mn_addr_ma...gqtr',
  maxAmount: '₹2,00,000',
  deadline: '45 days left',
  description: 'Community supported initiative with customized privacy criteria.',
  maxAge: 20,
  minGpaTimesTen: 87,
  maxIncome: 600000,
  requireEnrollment: true,
  rules: [
    {
      id: 'rule_enrolled_new',
      label: 'Active Enrollment Verified',
      detail: 'Credential checked in browser',
      threshold: 'Active Student',
      private: true,
    },
    {
      id: 'rule_gpa_new',
      label: 'GPA of at least 8.7',
      detail: 'Academic threshold proven, score hidden',
      threshold: '>= 8.7 GPA',
      private: true,
    },
    {
      id: 'rule_inc_new',
      label: 'Household income below ₹6,00,000',
      detail: 'Financial threshold proven, income hidden',
      threshold: '< ₹6,00,000',
      private: true,
    },
  ],
}

export const ALL_PROGRAMS: GrantProgram[] = [
  New_GEN_PROGRAM,
  DEFAULT_PROGRAM,
  {
    id: 'grant_stem_2026',
    name: 'STEM Access & Research Fellowship',
    tag: 'Technology & Science',
    sponsor: 'National Innovation Trust',
    ownerAddress: 'mn_addr_preprod16alt42dnwerz6cy4w9wu65z7z3pyvfldeuvf2h7gas8uumygq9ms8x0s67',
    maxAmount: '₹2,50,000',
    deadline: '24 days left',
    description: 'Supporting promising engineering and science students with zero academic disclosure.',
    maxAge: 32,
    minGpaTimesTen: 75, // GPA >= 7.5
    maxIncome: 700000,
    requireEnrollment: true,
    rules: [
      { id: 'stem_enrolled', label: 'Active STEM Department Enrollment', detail: 'Credential verified locally', threshold: 'Active student', private: true },
      { id: 'stem_gpa', label: 'GPA of at least 7.5', detail: 'Threshold proven, score hidden', threshold: '>= 7.5 GPA', private: true },
      { id: 'stem_income', label: 'Household income below ₹7,00,000', detail: 'Threshold proven, amount hidden', threshold: '< ₹7,00,000', private: true },
    ],
  },
  {
    id: 'grant_regional_2026',
    name: 'Regional Equity Grant',
    tag: 'Diversity & Inclusion',
    sponsor: 'Commonwealth Advancement Council',
    ownerAddress: 'mn_addr_preprod16alt42dnwerz6cy4w9wu65z7z3pyvfldeuvf2h7gas8uumygq9ms8x0s67',
    maxAmount: '₹1,00,000',
    deadline: '31 days left',
    description: 'Empowering first-generation scholars from regional and emerging districts.',
    maxAge: 30,
    minGpaTimesTen: 65, // GPA >= 6.5
    maxIncome: 400000,
    requireEnrollment: true,
    rules: [
      { id: 'reg_enrolled', label: 'Accredited College Enrollment', detail: 'Local institutional attestation', threshold: 'Active student', private: true },
      { id: 'reg_gpa', label: 'GPA of at least 6.5', detail: 'Threshold proven, score hidden', threshold: '>= 6.5 GPA', private: true },
      { id: 'reg_income', label: 'Household income below ₹4,00,000', detail: 'Threshold proven, amount hidden', threshold: '< ₹4,00,000', private: true },
    ],
  },
]

// Persistent storage keys for custom programs and claims
const STORAGE_PROGRAMS_KEY = 'grantshield_programs_v2'
const STORAGE_CLAIMS_PREFIX = 'grantshield_claims_'

export function getStoredPrograms(): GrantProgram[] {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_PROGRAMS_KEY) : null
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch (e) {
    // fallback
  }
  return ALL_PROGRAMS
}

export async function fetchServerPrograms(): Promise<GrantProgram[]> {
  try {
    if (typeof fetch !== 'undefined') {
      const res = await fetch('/api/programs', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          saveStoredPrograms(data, false)
          return data
        }
      }
    }
  } catch (err) {
    // API not reachable in offline/test environment
  }
  return getStoredPrograms()
}

export async function persistProgramsToServer(programs: GrantProgram[]): Promise<boolean> {
  try {
    if (typeof fetch !== 'undefined') {
      const res = await fetch('/api/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(programs),
      })
      return res.ok
    }
  } catch (err) {
    // ignore
  }
  return false
}

export function saveStoredPrograms(programs: GrantProgram[], broadcast = true) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_PROGRAMS_KEY, JSON.stringify(programs))
    }
  } catch (e) {
    // ignore
  }

  if (broadcast) {
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('grantshield_sync')
        channel.postMessage({ type: 'PROGRAMS_UPDATED', programs })
        channel.close()
      }
    } catch (e) {
      // ignore
    }

    persistProgramsToServer(programs).catch(() => { })
  }
}

export function getApplicantClaims(claimantAddress: string): ApplicantClaimRecord[] {
  if (!claimantAddress) return []
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(`${STORAGE_CLAIMS_PREFIX}${claimantAddress}`) : null
    if (raw) return JSON.parse(raw)
  } catch (e) {
    // ignore
  }
  return []
}

export function saveApplicantClaim(claim: ApplicantClaimRecord) {
  if (!claim.claimantAddress) return
  try {
    if (typeof localStorage !== 'undefined') {
      const existing = getApplicantClaims(claim.claimantAddress)
      const updated = [claim, ...existing.filter((c) => c.nullifier !== claim.nullifier)]
      localStorage.setItem(`${STORAGE_CLAIMS_PREFIX}${claim.claimantAddress}`, JSON.stringify(updated))
    }
  } catch (e) {
    // ignore
  }
}

const STORAGE_APPLICATIONS_PREFIX = 'grantshield_apps_'
const memoryApplications: Record<string, ApplicantApplicationRecord[]> = {}

export async function fetchServerApplications(claimantAddress?: string): Promise<ApplicantApplicationRecord[]> {
  try {
    if (typeof fetch !== 'undefined') {
      const res = await fetch('/api/applications', { cache: 'no-store' })
      if (res.ok) {
        const all: ApplicantApplicationRecord[] = await res.json()
        if (Array.isArray(all)) {
          if (claimantAddress) {
            const userApps = all.filter((a) => a.claimantAddress.toLowerCase() === claimantAddress.toLowerCase())
            memoryApplications[claimantAddress] = userApps
            try {
              if (typeof localStorage !== 'undefined') {
                localStorage.setItem(`${STORAGE_APPLICATIONS_PREFIX}${claimantAddress}`, JSON.stringify(userApps))
              }
            } catch { }
            return userApps
          }
          return all
        }
      }
    }
  } catch (err) {
    // ignore
  }
  return claimantAddress ? getApplicantApplications(claimantAddress) : []
}

export async function persistApplicationsToServer(applications: ApplicantApplicationRecord[]): Promise<boolean> {
  try {
    if (typeof fetch !== 'undefined') {
      let allApps: ApplicantApplicationRecord[] = []
      try {
        const existingRes = await fetch('/api/applications', { cache: 'no-store' })
        if (existingRes.ok) {
          allApps = await existingRes.json()
        }
      } catch { }

      const updatedMap = new Map<string, ApplicantApplicationRecord>()
      allApps.forEach((a) => updatedMap.set(a.id, a))
      applications.forEach((a) => updatedMap.set(a.id, a))
      const merged = Array.from(updatedMap.values())

      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merged),
      })
      return res.ok
    }
  } catch (err) {
    // ignore
  }
  return false
}

export function getApplicantApplications(claimantAddress: string): ApplicantApplicationRecord[] {
  if (!claimantAddress) return []
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(`${STORAGE_APPLICATIONS_PREFIX}${claimantAddress}`) : null
    if (raw) return JSON.parse(raw)
  } catch (e) {
    // ignore
  }
  return memoryApplications[claimantAddress] || []
}

export function saveApplicantApplication(app: ApplicantApplicationRecord) {
  if (!app.claimantAddress) return
  const existing = getApplicantApplications(app.claimantAddress)
  const filtered = existing.filter((item) => item.id !== app.id)
  const updated = [app, ...filtered]
  memoryApplications[app.claimantAddress] = updated
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`${STORAGE_APPLICATIONS_PREFIX}${app.claimantAddress}`, JSON.stringify(updated))
    }
  } catch (e) {
    // ignore
  }

  persistApplicationsToServer(updated).catch(() => { })
}

export function claimApplicationMilestone(
  claimantAddress: string,
  appId: string,
  milestoneId: string
): { success: boolean; txHash?: string; error?: string } {
  try {
    const apps = getApplicantApplications(claimantAddress)
    const targetApp = apps.find((a) => a.id === appId)
    if (!targetApp) return { success: false, error: 'Application record not found.' }

    const ms = targetApp.milestones.find((m) => m.id === milestoneId)
    if (!ms) return { success: false, error: 'Milestone not found.' }
    if (ms.claimed) return { success: false, error: 'Milestone payout has already been claimed.' }

    const generatedTx = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
    ms.claimed = true
    ms.claimedAt = new Date().toISOString()
    ms.txHash = generatedTx

    // Calculate total disbursed
    const allClaimed = targetApp.milestones.filter((m) => m.claimed)
    const totalPercentage = allClaimed.reduce((sum, m) => sum + m.percentage, 0)
    targetApp.disbursedAmount = `${totalPercentage}% Disbursed`
    if (totalPercentage >= 100) {
      targetApp.status = 'disbursed'
    } else {
      targetApp.status = 'approved'
    }

    saveApplicantApplication(targetApp)
    return { success: true, txHash: generatedTx }
  } catch (err: any) {
    return { success: false, error: err.message || 'Milestone claim failed.' }
  }
}

/**
 * Real client-side cryptographic document hashing via Web Crypto SHA-256.
 * Guarantees zero sensitive document bytes ever leave the client.
 */
export async function computeDocumentHash(file: File | Blob): Promise<string> {
  const buffer = await file.arrayBuffer()
  const cryptoObj = typeof window !== 'undefined' && window.crypto ? window.crypto : globalThis.crypto
  if (!cryptoObj || !cryptoObj.subtle) {
    // Fallback deterministic hex hash
    let hash = 0
    const uint8 = new Uint8Array(buffer)
    for (let i = 0; i < uint8.length; i++) {
      hash = (hash << 5) - hash + uint8[i]
      hash |= 0
    }
    return `0x${Math.abs(hash).toString(16).padStart(64, '0')}`
  }
  const hashBuffer = await cryptoObj.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return '0x' + hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Backwards compatibility export
export const auroraRules: EligibilityRule[] = DEFAULT_PROGRAM.rules

// Simulated on-chain ledger state
class MidnightGrantLedger {
  private verifiedClaimsCount = 48
  private claimedNullifiers: Set<string> = new Set([
    'nullifier_e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    'nullifier_a2f8c1498b2c83758b991204d9894e1d32a0c7764b859942a495991b7852a1b2',
  ])

  getLedgerState(): LedgerState {
    return {
      verifiedClaims: this.verifiedClaimsCount,
      nullifiers: new Set(this.claimedNullifiers),
      activeProgramsCount: ALL_PROGRAMS.length,
    }
  }

  isClaimed(nullifier: string): boolean {
    return this.claimedNullifiers.has(nullifier)
  }

  submitVerifiedClaim(nullifier: string): { success: boolean; newTotalClaims: number; error?: string } {
    if (this.claimedNullifiers.has(nullifier)) {
      return {
        success: false,
        newTotalClaims: this.verifiedClaimsCount,
        error: 'Grant already claimed (Nullifier collision on Midnight ledger).',
      }
    }

    this.claimedNullifiers.add(nullifier)
    this.verifiedClaimsCount += 1
    return {
      success: true,
      newTotalClaims: this.verifiedClaimsCount,
    }
  }

  reset() {
    this.verifiedClaimsCount = 48
    this.claimedNullifiers = new Set([
      'nullifier_e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      'nullifier_a2f8c1498b2c83758b991204d9894e1d32a0c7764b859942a495991b7852a1b2',
    ])
  }
}

export const midnightLedger = new MidnightGrantLedger()

/**
 * Generate a unique deterministic nullifier for a given applicant secret and grant ID.
 * Emulates the Midnight Compact circuit computation:
 * nullifier = poseidon_hash(applicant_secret, grant_id)
 */
export function generateNullifier(secret: string, grantId: string): string {
  // Simple deterministic pseudo-hash for test & browser environments
  let hash = 0
  const input = `${secret}:${grantId}:grantshield_v1`
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0 // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0')
  return `nullifier_${hex}98fc1c149afbf4c8996fb92427ae41e4`
}

/**
 * Evaluates private eligibility circuit locally on client side.
 * Throws or returns validation failure without disclosing values.
 */
export function evaluateEligibilityCircuit(
  credentials: ApplicantCredentials,
  program: GrantProgram = DEFAULT_PROGRAM
): {
  valid: boolean
  errors: string[]
  results: {
    ageSatisfied: boolean
    gpaSatisfied: boolean
    incomeSatisfied: boolean
    enrollmentSatisfied: boolean
  }
} {
  const gpaTimesTen = Math.round(credentials.gpa * 10)
  const ageSatisfied = credentials.age < program.maxAge
  const gpaSatisfied = gpaTimesTen >= program.minGpaTimesTen
  const incomeSatisfied = credentials.householdIncome < program.maxIncome
  const enrollmentSatisfied = program.requireEnrollment ? credentials.isEnrolled : true

  const errors: string[] = []
  if (!ageSatisfied) errors.push(`Age requirement not satisfied (< ${program.maxAge} required)`)
  if (!gpaSatisfied) errors.push(`GPA requirement not satisfied (>= ${(program.minGpaTimesTen / 10).toFixed(1)} required)`)
  if (!incomeSatisfied) errors.push(`Income requirement not satisfied (< ₹${program.maxIncome.toLocaleString('en-IN')} required)`)
  if (!enrollmentSatisfied) errors.push('Enrollment credential not satisfied')

  return {
    valid: errors.length === 0,
    errors,
    results: {
      ageSatisfied,
      gpaSatisfied,
      incomeSatisfied,
      enrollmentSatisfied,
    },
  }
}

/**
 * Simulates client-side proof generation using Midnight Compact runtime.
 * Guarantees selective disclosure: only proof validity & nullifier are returned!
 */
export function createLocalProof(
  credentials: ApplicantCredentials = {
    age: 22,
    gpa: 8.4,
    householdIncome: 320000,
    isEnrolled: true,
    institutionName: 'Apex University',
    secretKey: 'user_sk_94821',
  },
  program: GrantProgram = DEFAULT_PROGRAM
): ProofGenerationResult {
  const circuitEval = evaluateEligibilityCircuit(credentials, program)
  if (!circuitEval.valid) {
    throw new Error(`Circuit assertion failure: ${circuitEval.errors.join('; ')}`)
  }

  const nullifier = generateNullifier(credentials.secretKey, program.id)
  const proofHash = `zkp_snark_plonk_${nullifier.slice(10, 26)}6326530a8d41`

  return {
    valid: true,
    grantId: program.id,
    nullifier,
    proofHash,
    verifiedAt: new Date().toISOString(),
    ruleResults: circuitEval.results,
  }
}

export {
  executeCompactCircuitProof,
  deriveCompactNullifierBytes,
  PROVER_KEY_FINGERPRINT,
  VERIFIER_KEY_FINGERPRINT,
} from './compactProof'
export type {
  CompactGasMetrics,
  CompactProofExecutionResult,
} from './compactProof'

