import * as compactRuntime from '@midnight-ntwrk/compact-runtime'
import { Contract, ledger } from '../managed/contract/index.js'

console.log('Testing genuine Compact runtime execution of GrantShield contract...')

// 1. Define witnesses that supply private values into the circuit
let currentAge = 22n
let currentGpaTimesTen = 84n
let currentHouseholdIncome = 320000n
let currentEnrollment = 1n

const witnesses = {
  get_age(context) {
    return [context.privateState, currentAge]
  },
  get_gpa_times_ten(context) {
    return [context.privateState, currentGpaTimesTen]
  },
  get_household_income(context) {
    return [context.privateState, currentHouseholdIncome]
  },
  get_enrollment_status(context) {
    return [context.privateState, currentEnrollment]
  },
}

const contract = new Contract(witnesses)
console.log('✓ Initialized GrantShield Compact Contract instance')

// 2. Initialize contract state
const constructorContext = {
  initialPrivateState: {},
  initialZswapLocalState: { coinPublicKey: new Uint8Array(32) },
}

const initialResult = contract.initialState(constructorContext)
console.log('✓ Initial state created:')
const initialLedger = ledger(initialResult.currentContractState.data)
console.log('  Initial verifiedClaims:', initialLedger.verifiedClaims.toString())
console.log('  Initial nullifiers size:', initialLedger.nullifiers.size().toString())

// 3. Prepare circuit call
const circuitContext = compactRuntime.createCircuitContext(
  compactRuntime.dummyContractAddress(),
  new Uint8Array(32),
  initialResult.currentContractState.data,
  initialResult.currentPrivateState
)

const sampleNullifier = new Uint8Array(32)
for (let i = 0; i < 32; i++) sampleNullifier[i] = i + 1

console.log('→ Executing circuit verify_eligibility with Compact ZK constraints...')
const callResult = contract.circuits.verify_eligibility(circuitContext, sampleNullifier)

console.log('✅ Circuit execution succeeded!')
console.log('  Circuit result:', callResult.result)
console.log('  Gas cost metrics:', callResult.gasCost)
console.log('  Proof transcript inputs count:', callResult.proofData.input.value.length)
console.log('  Private transcript outputs (witness commitments):', callResult.proofData.privateTranscriptOutputs.length)

const updatedLedger = ledger(callResult.context.currentQueryContext.state)
console.log('  Updated verifiedClaims:', updatedLedger.verifiedClaims.toString())
console.log('  Updated nullifiers size:', updatedLedger.nullifiers.size().toString())
console.log('  Is nullifier registered:', updatedLedger.nullifiers.member(sampleNullifier))

// 4. Test duplicate claim protection (nullifier reuse)
console.log('→ Testing duplicate nullifier claim assertion (should fail)...')
try {
  const duplicateContext = compactRuntime.createCircuitContext(
    compactRuntime.dummyContractAddress(),
    new Uint8Array(32),
    callResult.context.currentQueryContext.state,
    callResult.context.currentPrivateState
  )
  contract.circuits.verify_eligibility(duplicateContext, sampleNullifier)
  console.error('❌ Error: duplicate nullifier was accepted!')
} catch (err) {
  console.log('✅ Correctly asserted duplicate nullifier prevention:', err.message)
}

// 5. Test failing constraints (e.g., GPA < 7.0)
console.log('→ Testing failing constraint: GPA < 7.0 (should fail)...')
try {
  currentGpaTimesTen = 65n // GPA 6.5
  const freshNullifier = new Uint8Array(32)
  freshNullifier[0] = 99
  const failingContext = compactRuntime.createCircuitContext(
    compactRuntime.dummyContractAddress(),
    new Uint8Array(32),
    callResult.context.currentQueryContext.state,
    callResult.context.currentPrivateState
  )
  contract.circuits.verify_eligibility(failingContext, freshNullifier)
  console.error('❌ Error: GPA failure not asserted!')
} catch (err) {
  console.log('✅ Correctly asserted GPA constraint failure:', err.message)
}
