import { useState, useEffect } from 'react'
import {
  AlertTriangle,
  Award,
  Check,
  CheckCircle2,
  Copy,
  EyeOff,
  FileCheck,
  Lock,
  RefreshCw,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react'
import {
  ALL_PROGRAMS,
  ApplicantCredentials,
  GrantProgram,
  ProofGenerationResult,
  ApplicantClaimRecord,
  evaluateEligibilityCircuit,
  getApplicantClaims,
  saveApplicantClaim,
} from '../utils/contract'
import { ProvingStatus } from '../hooks/useMidnight'

interface EligibilityVerifierProps {
  walletConnected: boolean
  walletAddress?: string
  programs?: GrantProgram[]
  onConnectWallet: () => void
  provingStatus: ProvingStatus
  stepDetail: string
  error: string | null
  lastProof: ProofGenerationResult | null
  txHash: string | null
  claimCompleted: boolean
  onExecuteProof: (credentials: ApplicantCredentials, program: GrantProgram) => Promise<{ success: boolean; proof?: ProofGenerationResult }>
  onReset: () => void
}

export function EligibilityVerifier({
  walletConnected,
  walletAddress = '',
  programs = ALL_PROGRAMS,
  onConnectWallet,
  provingStatus,
  stepDetail,
  error,
  lastProof,
  txHash,
  claimCompleted,
  onExecuteProof,
  onReset,
}: EligibilityVerifierProps) {
  const [selectedProgram, setSelectedProgram] = useState<GrantProgram>(programs[0] || ALL_PROGRAMS[0])
  const [credentials, setCredentials] = useState<ApplicantCredentials>({
    age: 22,
    gpa: 8.4,
    householdIncome: 320000,
    isEnrolled: true,
    institutionName: 'Delhi Technological University',
    secretKey: 'applicant_secret_key_84920',
  })

  const [copiedNullifier, setCopiedNullifier] = useState(false)
  const [showCertificate, setShowCertificate] = useState(false)
  const [myClaims, setMyClaims] = useState<ApplicantClaimRecord[]>([])
  const [activeCertificateModal, setActiveCertificateModal] = useState<ApplicantClaimRecord | null>(null)

  // Sync selectedProgram when programs list updates
  useEffect(() => {
    if (programs.length > 0 && !programs.find((p) => p.id === selectedProgram.id)) {
      setSelectedProgram(programs[0])
    }
  }, [programs, selectedProgram.id])

  // Load isolated applicant claims for the connected wallet
  useEffect(() => {
    if (walletConnected && walletAddress) {
      setMyClaims(getApplicantClaims(walletAddress))
    } else {
      setMyClaims([])
    }
  }, [walletConnected, walletAddress])

  // Real-time client evaluation for instant feedback
  const localEval = evaluateEligibilityCircuit(credentials, selectedProgram)

  const handleApplyPreset = (preset: 'eligible' | 'lowGpa' | 'highIncome') => {
    if (!walletConnected) {
      onConnectWallet()
      return
    }
    onReset()
    if (preset === 'eligible') {
      setCredentials({
        age: 22,
        gpa: 8.4,
        householdIncome: 320000,
        isEnrolled: true,
        institutionName: 'Delhi Technological University',
        secretKey: `applicant_${walletAddress.slice(-6) || '84920'}`,
      })
    } else if (preset === 'lowGpa') {
      setCredentials({
        age: 23,
        gpa: 6.2, // Below 7.0
        householdIncome: 280000,
        isEnrolled: true,
        institutionName: 'National Institute',
        secretKey: `applicant_${walletAddress.slice(-6) || 'lowgpa'}`,
      })
    } else if (preset === 'highIncome') {
      setCredentials({
        age: 21,
        gpa: 8.8,
        householdIncome: 750000, // Above 500,000
        isEnrolled: true,
        institutionName: 'National Institute',
        secretKey: `applicant_${walletAddress.slice(-6) || 'highinc'}`,
      })
    }
  }

  const handleCopyNullifier = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedNullifier(true)
    setTimeout(() => setCopiedNullifier(false), 2000)
  }

  const isProving =
    provingStatus === 'witnessing' || provingStatus === 'proving' || provingStatus === 'submitting'

  // Submit proof and record claim uniquely for this applicant wallet
  const handleSubmitClaim = async () => {
    if (!walletConnected) {
      onConnectWallet()
      return
    }
    const res = await onExecuteProof(credentials, selectedProgram)
    if (res.success && res.proof && walletAddress) {
      const claimRecord: ApplicantClaimRecord = {
        id: `claim_${Date.now()}`,
        grantId: selectedProgram.id,
        programName: selectedProgram.name,
        maxAmount: selectedProgram.maxAmount,
        claimantAddress: walletAddress,
        nullifier: res.proof.nullifier,
        txHash: txHash || `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        claimedAt: new Date().toISOString(),
        proof: res.proof,
      }
      saveApplicantClaim(claimRecord)
      setMyClaims(getApplicantClaims(walletAddress))
    }
  }

  return (
    <div className="verifier-container">
      {/* Program Selector Bar */}
      <div className="program-selector-bar">
        <span className="selector-label">
          <Award size={16} /> Select Funding Opportunity:
        </span>
        <div className="program-pills">
          {programs.map((prog) => (
            <button
              key={prog.id}
              type="button"
              className={`program-pill ${selectedProgram.id === prog.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedProgram(prog)
                onReset()
              }}
            >
              <span className="pill-title">{prog.name}</span>
              <span className="pill-amount">{prog.maxAmount}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="verifier-grid">
        {/* LEFT COLUMN: Private Applicant Vault (Witness Inputs) */}
        <div className="credentials-card">
          {!walletConnected && (
            <div className="wallet-required-banner">
              <Lock size={16} className="lock-icon" />
              <div className="banner-text">
                <strong>Wallet Connection Required</strong>
                <p>Connect your Midnight wallet to access private witness sliders and submit proofs.</p>
              </div>
              <button type="button" className="btn-mini-connect" onClick={onConnectWallet}>
                <Wallet size={12} /> Connect
              </button>
            </div>
          )}

          <div className="card-header-row">
            <div>
              <div className="badge-shield">
                <Lock size={13} /> Private Witness Inputs
              </div>
              <h3 className="card-heading">Your Private Data Vault</h3>
              <p className="card-subtext">
                Values configured here stay strictly inside your browser. Midnight synthesizes a zero-knowledge
                proof without exposing these records to the sponsor or public ledger.
              </p>
            </div>
          </div>

          {/* Quick presets for testers */}
          <div className="preset-row">
            <span className="preset-label">Test Scenarios:</span>
            <button
              type="button"
              className="preset-btn"
              disabled={!walletConnected}
              onClick={() => handleApplyPreset('eligible')}
            >
              ✓ Eligible Applicant
            </button>
            <button
              type="button"
              className="preset-btn warning"
              disabled={!walletConnected}
              onClick={() => handleApplyPreset('lowGpa')}
            >
              ✗ Low GPA (&lt; 7.0)
            </button>
            <button
              type="button"
              className="preset-btn warning"
              disabled={!walletConnected}
              onClick={() => handleApplyPreset('highIncome')}
            >
              ✗ High Income (&gt; ₹5L)
            </button>
          </div>

          <div className="form-group-list">
            {/* Age Input */}
            <div className="form-group">
              <div className="group-label-row">
                <label htmlFor="input-age">
                  Applicant Age <span title="Kept Private"><EyeOff size={13} className="field-hidden-icon" /></span>
                </label>
                <div className="group-meta">
                  <span className="val-badge">{credentials.age} years</span>
                  {credentials.age < selectedProgram.maxAge ? (
                    <span className="status-tag success"><Check size={12} /> Satisfied</span>
                  ) : (
                    <span className="status-tag error"><AlertTriangle size={12} /> Exceeds max {selectedProgram.maxAge}</span>
                  )}
                </div>
              </div>
              <input
                id="input-age"
                type="range"
                min="16"
                max="45"
                disabled={!walletConnected}
                value={credentials.age}
                onChange={(e) => setCredentials({ ...credentials, age: Number(e.target.value) })}
                className="custom-range"
              />
              <div className="range-hints">
                <span>16 yrs</span>
                <span>Rule: &lt; {selectedProgram.maxAge} years</span>
                <span>45 yrs</span>
              </div>
            </div>

            {/* GPA Input */}
            <div className="form-group">
              <div className="group-label-row">
                <label htmlFor="input-gpa">
                  Cumulative GPA / 10.0 <span title="Kept Private"><EyeOff size={13} className="field-hidden-icon" /></span>
                </label>
                <div className="group-meta">
                  <span className="val-badge">{credentials.gpa.toFixed(1)} / 10</span>
                  {localEval.results.gpaSatisfied ? (
                    <span className="status-tag success"><Check size={12} /> Satisfied</span>
                  ) : (
                    <span className="status-tag error"><AlertTriangle size={12} /> Below {(selectedProgram.minGpaTimesTen / 10).toFixed(1)}</span>
                  )}
                </div>
              </div>
              <input
                id="input-gpa"
                type="range"
                min="4.0"
                max="10.0"
                step="0.1"
                disabled={!walletConnected}
                value={credentials.gpa}
                onChange={(e) => setCredentials({ ...credentials, gpa: parseFloat(e.target.value) })}
                className="custom-range"
              />
              <div className="range-hints">
                <span>4.0</span>
                <span>Rule: &gt;= {(selectedProgram.minGpaTimesTen / 10).toFixed(1)} GPA</span>
                <span>10.0</span>
              </div>
            </div>

            {/* Income Input */}
            <div className="form-group">
              <div className="group-label-row">
                <label htmlFor="input-income">
                  Annual Household Income <span title="Kept Private"><EyeOff size={13} className="field-hidden-icon" /></span>
                </label>
                <div className="group-meta">
                  <span className="val-badge">₹{credentials.householdIncome.toLocaleString('en-IN')}</span>
                  {localEval.results.incomeSatisfied ? (
                    <span className="status-tag success"><Check size={12} /> Satisfied</span>
                  ) : (
                    <span className="status-tag error"><AlertTriangle size={12} /> Exceeds ₹{selectedProgram.maxIncome.toLocaleString('en-IN')}</span>
                  )}
                </div>
              </div>
              <input
                id="input-income"
                type="range"
                min="100000"
                max="1500000"
                step="25000"
                disabled={!walletConnected}
                value={credentials.householdIncome}
                onChange={(e) => setCredentials({ ...credentials, householdIncome: Number(e.target.value) })}
                className="custom-range"
              />
              <div className="range-hints">
                <span>₹1,00,000</span>
                <span>Cap: &lt; ₹{selectedProgram.maxIncome.toLocaleString('en-IN')}</span>
                <span>₹15,00,000</span>
              </div>
            </div>

            {/* Active Student Enrollment Toggle */}
            <div className="form-group">
              <div className="group-label-row">
                <label htmlFor="input-enrolled">Active Academic Enrollment</label>
                <div className="group-meta">
                  {credentials.isEnrolled ? (
                    <span className="status-tag success"><Check size={12} /> Verified Credential</span>
                  ) : (
                    <span className="status-tag error"><AlertTriangle size={12} /> Not Enrolled</span>
                  )}
                </div>
              </div>
              <label className="toggle-switch-wrap">
                <input
                  id="input-enrolled"
                  type="checkbox"
                  disabled={!walletConnected}
                  checked={credentials.isEnrolled}
                  onChange={(e) => setCredentials({ ...credentials, isEnrolled: e.target.checked })}
                />
                <span className="toggle-slider" />
                <span className="toggle-label-text">
                  I hold an active institutional student credential for the current academic session
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Public Policy Rules, Verifier & Claim Status */}
        <div className="verifier-summary-card">
          <div className="program-summary-block">
            <div className="program-badge-line">
              <span className="tag-pill">{selectedProgram.tag}</span>
              <span className="deadline-pill">Deadline: {selectedProgram.deadline}</span>
            </div>
            <h2 className="program-name">{selectedProgram.name}</h2>
            <p className="program-desc">{selectedProgram.description}</p>
            <div className="program-award-box">
              <span className="award-label">Max Endowment Grant</span>
              <span className="award-amount">{selectedProgram.maxAmount}</span>
            </div>
          </div>

          <div className="rules-section">
            <div className="rules-header">
              <h4>Public Policy Constraints</h4>
              <span className="zk-policy-tag">Proven in ZK</span>
            </div>

            <div className="rule-cards-list">
              {selectedProgram.rules.map((rule) => {
                let isSatisfied = true
                if (rule.id.includes('gpa')) isSatisfied = localEval.results.gpaSatisfied
                if (rule.id.includes('income')) isSatisfied = localEval.results.incomeSatisfied
                if (rule.id.includes('age')) isSatisfied = localEval.results.ageSatisfied
                if (rule.id.includes('enrolled')) isSatisfied = localEval.results.enrollmentSatisfied

                return (
                  <div key={rule.id} className={`rule-item-box ${isSatisfied ? 'pass' : 'fail'}`}>
                    <div className="rule-icon-col">
                      {isSatisfied ? <CheckCircle2 size={18} className="pass-icon" /> : <AlertTriangle size={18} className="fail-icon" />}
                    </div>
                    <div className="rule-content-col">
                      <div className="rule-title-row">
                        <strong>{rule.label}</strong>
                        <span className={`eval-badge ${isSatisfied ? 'pass' : 'fail'}`}>
                          {isSatisfied ? 'Satisfied' : 'Violated'}
                        </span>
                      </div>
                      <span className="rule-detail-text">
                        Condition: {rule.threshold} · {rule.detail}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Proving Execution Panel */}
          <div className="execution-action-panel">
            {!walletConnected ? (
              <div className="connect-prompt-box">
                <p>
                  <Wallet size={16} /> Connect your Midnight wallet to generate zero-knowledge proofs.
                </p>
                <button
                  type="button"
                  id="btn-applicant-connect"
                  className="primary-button-accent full-width"
                  onClick={onConnectWallet}
                >
                  <Wallet size={16} /> Connect Wallet to Prove &amp; Claim
                </button>
              </div>
            ) : claimCompleted && lastProof ? (
              <div className="success-claim-card">
                <div className="success-header">
                  <div className="success-icon-wrap">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h4>Eligibility Verified &amp; Award Claimed</h4>
                    <p>Proof verified on Midnight Preprod ledger.</p>
                  </div>
                </div>

                <div className="claim-receipt-data">
                  <div className="receipt-line">
                    <span>Program:</span>
                    <strong>{selectedProgram.name}</strong>
                  </div>
                  <div className="receipt-line">
                    <span>Award Dispatched:</span>
                    <strong className="award-highlight">{selectedProgram.maxAmount}</strong>
                  </div>
                  <div className="receipt-line">
                    <span>Claimant Wallet:</span>
                    <code>{walletAddress.slice(0, 16)}...</code>
                  </div>
                  <div className="receipt-line">
                    <span>Cryptographic Nullifier:</span>
                    <div className="copyable-hash">
                      <code>{lastProof.nullifier.slice(0, 18)}...{lastProof.nullifier.slice(-8)}</code>
                      <button
                        type="button"
                        className="copy-btn"
                        onClick={() => handleCopyNullifier(lastProof.nullifier)}
                        title="Copy Nullifier"
                      >
                        <Copy size={13} />
                        {copiedNullifier ? ' Copied' : ''}
                      </button>
                    </div>
                  </div>
                  <div className="receipt-line">
                    <span>Midnight Preprod Tx:</span>
                    <code>{txHash?.slice(0, 20)}...</code>
                  </div>
                </div>

                <div className="action-buttons-group">
                  <button
                    type="button"
                    className="outline-button"
                    onClick={() => setShowCertificate(!showCertificate)}
                  >
                    <FileCheck size={15} />
                    {showCertificate ? 'Hide Verification Receipt' : 'View Verification Certificate'}
                  </button>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={handleSubmitClaim}
                    title="Attempt claiming again with same nullifier to test duplicate prevention"
                  >
                    <RefreshCw size={14} /> Test Duplicate Claim Rejection
                  </button>
                </div>

                {showCertificate && (
                  <div className="certificate-modal-snippet">
                    <div className="cert-header">
                      <Sparkles size={14} /> Zero-Knowledge Selective Disclosure Attestation
                    </div>
                    <pre className="cert-json">
                      {JSON.stringify(
                        {
                          attestationProtocol: 'GrantShield v1.0 (Midnight Compact)',
                          programId: selectedProgram.id,
                          programName: selectedProgram.name,
                          claimantWallet: walletAddress,
                          proofHash: lastProof.proofHash,
                          cryptographicNullifier: lastProof.nullifier,
                          timestamp: lastProof.verifiedAt,
                          verifiedCriteria: {
                            ageRequirementSatisfied: true,
                            gpaCutoffSatisfied: true,
                            incomeCapSatisfied: true,
                            activeEnrollmentSatisfied: true,
                          },
                          confidentialApplicantData: {
                            applicantAge: '[REDACTED BY ZERO-KNOWLEDGE PROOF]',
                            applicantGpa: '[REDACTED BY ZERO-KNOWLEDGE PROOF]',
                            applicantIncome: '[REDACTED BY ZERO-KNOWLEDGE PROOF]',
                            applicantIdentity: '[REDACTED BY ZERO-KNOWLEDGE PROOF]',
                          },
                          networkVerification: 'Midnight Preprod Consensus Proof',
                        },
                        null,
                        2
                      )}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <button
                  type="button"
                  id="btn-generate-proof"
                  className="primary-button-accent full-width"
                  disabled={!localEval.valid || isProving}
                  onClick={handleSubmitClaim}
                >
                  {isProving ? (
                    <>
                      <RefreshCw size={16} className="spin-icon" />
                      <span>{stepDetail || 'Synthesizing ZK Proof...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Generate Private Proof &amp; Submit Claim</span>
                    </>
                  )}
                </button>

                {!localEval.valid && (
                  <p className="validation-hint-error">
                    <AlertTriangle size={13} /> Cannot generate proof: criteria are unsatisfied. Adjust values above.
                  </p>
                )}
              </div>
            )}

            {error && (
              <div className="error-alert-box">
                <AlertTriangle size={16} className="error-icon" />
                <div>
                  <strong>Verification Error</strong>
                  <p>{error}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* APPLICANT UNIQUE CLAIMS & CERTIFICATES SECTION */}
      {walletConnected && (
        <div className="applicant-claims-section">
          <div className="claims-section-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCheck size={18} color="var(--primary-accent)" />
                <h4>My Verified Claims &amp; Attestations</h4>
              </div>
              <p>
                Claims &amp; receipts cryptographically tied to your connected wallet:{' '}
                <code>{walletAddress.length > 20 ? `${walletAddress.slice(0, 16)}...${walletAddress.slice(-6)}` : walletAddress}</code>
              </p>
            </div>
            <span className="claims-counter-pill">{myClaims.length} Claims Recorded</span>
          </div>

          {myClaims.length === 0 ? (
            <div className="claims-empty-box">
              <Award size={32} color="#94a3b8" />
              <p>No verified claims yet for this wallet address.</p>
              <span>Select an opportunity above and click "Generate Private Proof &amp; Submit Claim" to receive your endowment.</span>
            </div>
          ) : (
            <div className="claims-cards-grid">
              {myClaims.map((claim) => (
                <div key={claim.id} className="claim-item-card">
                  <div className="claim-card-top">
                    <div>
                      <h5>{claim.programName}</h5>
                      <span className="claim-date">{new Date(claim.claimedAt).toLocaleString()}</span>
                    </div>
                    <span className="claim-award-pill">{claim.maxAmount}</span>
                  </div>
                  <div className="claim-card-hashes">
                    <div className="hash-item">
                      <small>Nullifier:</small>
                      <code>{claim.nullifier.slice(0, 14)}...{claim.nullifier.slice(-6)}</code>
                    </div>
                    <div className="hash-item">
                      <small>Tx Hash:</small>
                      <code>{claim.txHash.slice(0, 14)}...</code>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="outline-button-small"
                    onClick={() => setActiveCertificateModal(claim)}
                  >
                    <FileCheck size={13} /> View Certificate
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL FOR PAST CERTIFICATE INSPECTION */}
      {activeCertificateModal && (
        <div className="wallet-modal-backdrop" onClick={() => setActiveCertificateModal(null)}>
          <div className="wallet-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="wallet-modal-header">
              <div className="modal-title-wrap">
                <FileCheck size={22} className="modal-icon-green" />
                <div>
                  <h3>Attestation Certificate</h3>
                  <p>{activeCertificateModal.programName} · Claimed by {walletAddress.slice(0, 14)}...</p>
                </div>
              </div>
              <button
                type="button"
                className="close-btn"
                onClick={() => setActiveCertificateModal(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="certificate-modal-snippet" style={{ maxHeight: '350px', overflowY: 'auto' }}>
              <pre className="cert-json">
                {JSON.stringify(
                  {
                    attestationProtocol: 'GrantShield v1.0 (Midnight Compact)',
                    programId: activeCertificateModal.grantId,
                    programName: activeCertificateModal.programName,
                    awardAmount: activeCertificateModal.maxAmount,
                    claimantWallet: activeCertificateModal.claimantAddress,
                    proofHash: activeCertificateModal.proof.proofHash,
                    cryptographicNullifier: activeCertificateModal.nullifier,
                    timestamp: activeCertificateModal.claimedAt,
                    verifiedCriteria: {
                      ageRequirementSatisfied: true,
                      gpaCutoffSatisfied: true,
                      incomeCapSatisfied: true,
                      activeEnrollmentSatisfied: true,
                    },
                    confidentialApplicantData: {
                      applicantAge: '[REDACTED BY ZERO-KNOWLEDGE PROOF]',
                      applicantGpa: '[REDACTED BY ZERO-KNOWLEDGE PROOF]',
                      applicantIncome: '[REDACTED BY ZERO-KNOWLEDGE PROOF]',
                      applicantIdentity: '[REDACTED BY ZERO-KNOWLEDGE PROOF]',
                    },
                    networkVerification: 'Midnight Preprod Consensus Proof',
                  },
                  null,
                  2
                )}
              </pre>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="submit-key-btn"
                onClick={() => setActiveCertificateModal(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
