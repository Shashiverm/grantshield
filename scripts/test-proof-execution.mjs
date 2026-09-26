import { executeCompactCircuitProof } from '../src/utils/compactProof.ts'
import { DEFAULT_PROGRAM } from '../src/utils/contract.ts'

async function run() {
  console.log('Testing executeCompactCircuitProof with valid credentials...')
  const creds = {
    age: 21,
    gpa: 8.2,
    householdIncome: 300000,
    isEnrolled: true,
    institutionName: 'Apex Institute',
    secretKey: 'applicant_secret_key_99',
  }

  const proof = await executeCompactCircuitProof(creds, DEFAULT_PROGRAM)
  console.log('Proof result:')
  console.log('  Valid:', proof.valid)
  console.log('  Nullifier:', proof.nullifier)
  console.log('  Proof Hash:', proof.proofHash)
  console.log('  Gas readTime:', proof.gasMetrics.readTimeNs, 'ns')
  console.log('  Gas computeTime:', proof.gasMetrics.computeTimeNs, 'ns')
  console.log('  Witness commitments count:', proof.witnessCommitmentsCount)
  console.log('  Prover fingerprint:', proof.proverKeyFingerprint)

  console.log('\nTesting with failing GPA (6.2 < 7.0)...')
  try {
    await executeCompactCircuitProof({ ...creds, gpa: 6.2 }, DEFAULT_PROGRAM)
    console.error('FAILED: expected circuit to throw!')
  } catch (err) {
    console.log('✓ Successfully caught assertion error:', err.message)
  }
}

run()
