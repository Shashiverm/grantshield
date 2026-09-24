import { beforeEach, describe, expect, it } from 'vitest'
import {
  ALL_PROGRAMS,
  DEFAULT_PROGRAM,
  auroraRules,
  createLocalProof,
  evaluateEligibilityCircuit,
  generateNullifier,
  midnightLedger,
  DEPLOYED_CONTRACT_INFO,
} from '../src/utils/contract'
import {
  encodeBech32m,
  connectPreprodFundedKeystore,
  generateFreshMidnightWallet,
  importMidnightWallet,
  detectBrowserWallets,
  deriveMidnightAddressFromEth,
  connectLaceExtension,
} from '../src/utils/midnightWallet'

describe('GrantShield Privacy Core & Midnight Compact Verification', () => {
  beforeEach(() => {
    midnightLedger.reset()
  })

  it('defines the Aurora eligibility rules where all sensitive criteria are private', () => {
    expect(auroraRules.length).toBeGreaterThanOrEqual(3)
    expect(auroraRules.every((rule) => rule.private)).toBe(true)
  })

  it('generates a valid zero-knowledge proof payload with valid credentials', () => {
    const proof = createLocalProof({
      age: 22,
      gpa: 8.1,
      householdIncome: 320000,
      isEnrolled: true,
      institutionName: 'Apex Institute',
      secretKey: 'applicant_secret_123',
    })

    expect(proof.valid).toBe(true)
    expect(proof.nullifier).toContain('nullifier_')
    expect(proof.proofHash).toMatch(/^zkp_/)
    expect(proof.ruleResults.ageSatisfied).toBe(true)
    expect(proof.ruleResults.gpaSatisfied).toBe(true)
    expect(proof.ruleResults.incomeSatisfied).toBe(true)
    expect(proof.ruleResults.enrollmentSatisfied).toBe(true)
  })

  it('strictly enforces selective disclosure: sensitive values never exist in proof payload', () => {
    const proof = createLocalProof({
      age: 22,
      gpa: 8.1,
      householdIncome: 320000,
      isEnrolled: true,
      institutionName: 'Apex Institute',
      secretKey: 'applicant_secret_123',
    })

    expect(proof).not.toHaveProperty('gpa')
    expect(proof).not.toHaveProperty('householdIncome')
    expect(proof).not.toHaveProperty('age')
    expect(proof).not.toHaveProperty('institutionName')
    expect(proof).not.toHaveProperty('secretKey')

    const serialized = JSON.stringify(proof)
    expect(serialized).not.toMatch(/320000|8\.1|Apex/i)
  })

  it('fails locally with circuit assertion when GPA is below threshold', () => {
    const evaluation = evaluateEligibilityCircuit({
      age: 22,
      gpa: 6.4, // Requires >= 7.0
      householdIncome: 320000,
      isEnrolled: true,
      institutionName: 'Apex Institute',
      secretKey: 'applicant_secret_123',
    })

    expect(evaluation.valid).toBe(false)
    expect(evaluation.errors.some((err) => err.includes('GPA requirement not satisfied'))).toBe(true)

    expect(() => {
      createLocalProof({
        age: 22,
        gpa: 6.4,
        householdIncome: 320000,
        isEnrolled: true,
        institutionName: 'Apex Institute',
        secretKey: 'applicant_secret_123',
      })
    }).toThrowError(/Circuit assertion failure/i)
  })

  it('fails locally with circuit assertion when household income exceeds threshold', () => {
    const evaluation = evaluateEligibilityCircuit({
      age: 22,
      gpa: 8.5,
      householdIncome: 650000, // Exceeds 500,000 limit
      isEnrolled: true,
      institutionName: 'Apex Institute',
      secretKey: 'applicant_secret_123',
    })

    expect(evaluation.valid).toBe(false)
    expect(evaluation.errors.some((err) => err.includes('Income requirement not satisfied'))).toBe(true)
  })

  it('fails locally when enrollment credential is missing', () => {
    const evaluation = evaluateEligibilityCircuit({
      age: 22,
      gpa: 8.5,
      householdIncome: 300000,
      isEnrolled: false,
      institutionName: '',
      secretKey: 'applicant_secret_123',
    })

    expect(evaluation.valid).toBe(false)
    expect(evaluation.errors.some((err) => err.includes('Enrollment credential not satisfied'))).toBe(true)
  })

  it('fails locally when age requirement is exceeded', () => {
    const evaluation = evaluateEligibilityCircuit({
      age: 38, // Exceeds 35 limit
      gpa: 8.5,
      householdIncome: 300000,
      isEnrolled: true,
      institutionName: 'Apex Institute',
      secretKey: 'applicant_secret_123',
    })

    expect(evaluation.valid).toBe(false)
    expect(evaluation.errors.some((err) => err.includes('Age requirement not satisfied'))).toBe(true)
  })

  it('generates deterministic nullifiers per secret and grant ID', () => {
    const nullifier1 = generateNullifier('secret_A', DEFAULT_PROGRAM.id)
    const nullifier2 = generateNullifier('secret_A', DEFAULT_PROGRAM.id)
    const nullifier3 = generateNullifier('secret_B', DEFAULT_PROGRAM.id)

    expect(nullifier1).toBe(nullifier2)
    expect(nullifier1).not.toBe(nullifier3)
  })

  it('prevents duplicate claims on the simulated Midnight ledger via nullifier checks', () => {
    const nullifier = generateNullifier('unique_applicant_secret', DEFAULT_PROGRAM.id)

    // First claim should succeed
    const firstClaim = midnightLedger.submitVerifiedClaim(nullifier)
    expect(firstClaim.success).toBe(true)
    expect(firstClaim.newTotalClaims).toBe(49)

    // Second claim with the same nullifier should be rejected
    const duplicateClaim = midnightLedger.submitVerifiedClaim(nullifier)
    expect(duplicateClaim.success).toBe(false)
    expect(duplicateClaim.error).toContain('Grant already claimed')
  })

  it('supports multiple grant programs with independent policy thresholds', () => {
    expect(ALL_PROGRAMS.length).toBeGreaterThanOrEqual(3)

    const stemProgram = ALL_PROGRAMS.find((p) => p.id === 'grant_stem_2026')!
    expect(stemProgram).toBeDefined()

    // 7.2 GPA is eligible for Aurora (min 7.0), but ineligible for STEM (min 7.5)
    const evalAurora = evaluateEligibilityCircuit(
      {
        age: 25,
        gpa: 7.2,
        householdIncome: 450000,
        isEnrolled: true,
        institutionName: 'State Tech',
        secretKey: 'applicant_1',
      },
      DEFAULT_PROGRAM
    )

    const evalStem = evaluateEligibilityCircuit(
      {
        age: 25,
        gpa: 7.2,
        householdIncome: 450000,
        isEnrolled: true,
        institutionName: 'State Tech',
        secretKey: 'applicant_1',
      },
      stemProgram
    )

    expect(evalAurora.valid).toBe(true)
    expect(evalStem.valid).toBe(false)
  })

  it('exposes the fresh deployed Midnight Preprod contract address', () => {
    expect(DEPLOYED_CONTRACT_INFO.contractAddress).toMatch(/^0200[a-f0-9]{64}$/)
    expect(DEPLOYED_CONTRACT_INFO.deployerAddress).toMatch(/^mn_addr_preprod1/)
    expect(DEPLOYED_CONTRACT_INFO.network).toBe('Midnight Preprod')
    expect(DEPLOYED_CONTRACT_INFO.blockHeight).toBeGreaterThan(2000000)
    expect(DEPLOYED_CONTRACT_INFO.explorerUrl).toContain(DEPLOYED_CONTRACT_INFO.contractAddress)
  })

  it('derives valid Bech32m Midnight testnet addresses from raw keys', () => {
    const rawKey = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
    const bech32mAddr = encodeBech32m('mn_addr_preprod', rawKey)
    expect(bech32mAddr).toMatch(/^mn_addr_preprod1[a-z0-9]+$/)
  })

  it('provides a deterministic pre-funded testnet dev keystore', () => {
    const keystore = connectPreprodFundedKeystore()
    expect(keystore.address).toMatch(/^mn_addr_preprod1/)
    expect(keystore.balance).toBe('1,250 tDUST')
    expect(keystore.network).toBe('Midnight Preprod')
    expect(keystore.walletType).toBe('keystore')
  })

  it('generates a fresh cryptographic keypair using Web Crypto & Bech32m', async () => {
    const wallet = await generateFreshMidnightWallet()
    expect(wallet.address).toMatch(/^mn_addr_preprod1/)
    expect(wallet.privateKeyHex).toHaveLength(64)
    expect(wallet.publicKeyHex).toHaveLength(64)
    expect(wallet.network).toBe('Midnight Preprod')
  })

  it('imports an existing private key hex and derives correct Midnight address', async () => {
    const sampleHex = '11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff'
    const imported = await importMidnightWallet(sampleHex)
    expect(imported.address).toMatch(/^mn_addr_preprod1/)
    expect(imported.privateKeyHex).toBe(sampleHex)
  })

  it('derives a valid Midnight Preprod address from an EVM / Web3 address', async () => {
    const ethAddr = '0x71C8360d0C888a7B6B0E020b8fa97B1c1fB3654D'
    const midnightAddr = await deriveMidnightAddressFromEth(ethAddr)
    expect(midnightAddr).toMatch(/^mn_addr_preprod1[a-z0-9]+$/)
  })

  it('detects browser wallets safely without window throwing in test environment', () => {
    const detection = detectBrowserWallets()
    expect(detection).toHaveProperty('hasMidnightLace')
    expect(detection).toHaveProperty('hasCardanoLace')
    expect(detection).toHaveProperty('hasInjectedWeb3')
  })

  it('connects to Midnight Lace extension passing valid target network ID (preview or preprod)', async () => {
    const origWindow = (globalThis as any).window
    const passedNetworks: string[] = []

    ;(globalThis as any).window = {
      midnight: {
        mnLace: {
          name: 'Midnight Lace Preview',
          connect: async (netId: string) => {
            passedNetworks.push(`connect:${netId}`)
            return {
              getUnshieldedAddress: async () => 'mn_addr_preview1qq9v8cxu73q5668gslw57kndh6k2z8u3n9hwp3w7q',
              getNetworkId: async () => 'preview',
              getBalance: async () => 1250,
            }
          },
        },
      },
    }

    try {
      const conn = await connectLaceExtension()
      expect(conn.network).toContain('Preview')
      expect(conn.address).toBe('mn_addr_preview1qq9v8cxu73q5668gslw57kndh6k2z8u3n9hwp3w7q')
      expect(passedNetworks).toContain('connect:preview')
    } finally {
      ;(globalThis as any).window = origWindow
    }
  })

  it('automatically probes and resolves network when preview throws Network ID mismatch', async () => {
    const origWindow = (globalThis as any).window
    const attempts: string[] = []

    ;(globalThis as any).window = {
      midnight: {
        mnLace: {
          name: 'Midnight Lace Extension',
          connect: async (netId: string) => {
            attempts.push(netId)
            if (netId === 'preview') {
              throw new Error('Network ID mismatch')
            }
            if (netId === 'preprod') {
              return {
                getUnshieldedAddress: async () => 'mn_addr_preprod1qq9v8cxu73q5668gslw57kndh6k2z8u3n9hwp3w7q',
                getNetworkId: async () => 'preprod',
                getBalance: async () => 1250,
              }
            }
            throw new Error('Network ID mismatch')
          },
        },
      },
    }

    try {
      const conn = await connectLaceExtension()
      expect(conn.network).toContain('Preprod')
      expect(conn.address).toBe('mn_addr_preprod1qq9v8cxu73q5668gslw57kndh6k2z8u3n9hwp3w7q')
      expect(attempts).toEqual(['preview', 'preprod'])
    } finally {
      ;(globalThis as any).window = origWindow
    }
  })

  it('rejects with clean user-friendly error if Lace connection prompt is cancelled', async () => {
    const origWindow = (globalThis as any).window

    ;(globalThis as any).window = {
      midnight: {
        mnLace: {
          name: 'Midnight Lace Preview',
          connect: async () => {
            throw new Error('User rejected the request')
          },
        },
      },
    }

    try {
      await expect(connectLaceExtension()).rejects.toThrowError(
        /Extension connection was cancelled or rejected/i
      )
    } finally {
      ;(globalThis as any).window = origWindow
    }
  })
})

