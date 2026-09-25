import { useState, useEffect } from 'react'
import {
  AlertTriangle,
  Award,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileCheck,
  FileText,
  Filter,
  FolderCheck,
  Lock,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  User,
  Wallet,
  X,
} from 'lucide-react'
import {
  ALL_PROGRAMS,
  ApplicantCredentials,
  GrantProgram,
  ProofGenerationResult,
  ApplicantClaimRecord,
  ApplicantDocument,
  ApplicantApplicationRecord,
  evaluateEligibilityCircuit,
  getApplicantClaims,
  saveApplicantClaim,
  getApplicantApplications,
  saveApplicantApplication,
  claimApplicationMilestone,
  computeDocumentHash,
  fetchServerApplications,
} from '../utils/contract'
import { ProvingStatus } from '../hooks/useMidnight'

interface EligibilityVerifierProps {
  walletConnected: boolean
  walletAddress?: string
  rawAddress?: string
  walletSignature?: string
  onSignSessionChallenge?: (customMessage?: string) => Promise<{ success: boolean; signature?: string; error?: string }>
  programs?: GrantProgram[]
  onConnectWallet: () => void
  provingStatus: ProvingStatus
  stepDetail: string
  error: string | null
  lastProof: ProofGenerationResult | null
  txHash: string | null
  claimCompleted: boolean
  onExecuteProof: (
    credentials: ApplicantCredentials,
    program: GrantProgram
  ) => Promise<{ success: boolean; proof?: ProofGenerationResult }>
  onReset: () => void
}

export function EligibilityVerifier({
  walletConnected,
  walletAddress = '',
  rawAddress = '',
  walletSignature,
  onSignSessionChallenge,
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
  // Top-level portal view tab
  const [portalTab, setPortalTab] = useState<'studio' | 'explore' | 'applications' | 'vault'>('studio')

  const [selectedProgram, setSelectedProgram] = useState<GrantProgram>(programs[0] || ALL_PROGRAMS[0])
  const [credentials, setCredentials] = useState<ApplicantCredentials>({
    age: 22,
    gpa: 8.4,
    householdIncome: 320000,
    isEnrolled: true,
    institutionName: 'Delhi Technological University',
    secretKey: 'applicant_secret_key_84920',
  })

  // Applicant Profile Info
  const [profile, setProfile] = useState({
    fullName: 'Aditya Sharma',
    studentId: 'DTU/2022/CS-492',
    institutionName: 'Delhi Technological University',
    degree: 'B.Tech in Computer Science & Engineering',
    graduationYear: '2026',
  })

  // Document Vault State
  const [documents, setDocuments] = useState<ApplicantDocument[]>([
    {
      id: 'doc_transcript_seed',
      name: 'Official_Academic_Transcript_2025.pdf',
      type: 'application/pdf',
      size: 428000,
      sha256Hash: '0x9e8a71b2c45d3e6f8a90123456789abcdef0123456789abcdef0123456789abc',
      uploadedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      category: 'transcript',
    },
    {
      id: 'doc_enrollment_seed',
      name: 'Institutional_Enrollment_Certificate.pdf',
      type: 'application/pdf',
      size: 215000,
      sha256Hash: '0x3f5c7a9e1d8b2e4f0c6a8b2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4b6c8d0e2',
      uploadedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      category: 'enrollment',
    },
  ])
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [docHashSuccess, setDocHashSuccess] = useState<string | null>(null)

  // Explore search & category filter
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Claims & Applications state
  const [copiedNullifier, setCopiedNullifier] = useState(false)
  const [showCertificate, setShowCertificate] = useState(false)
  const [myClaims, setMyClaims] = useState<ApplicantClaimRecord[]>([])
  const [myApplications, setMyApplications] = useState<ApplicantApplicationRecord[]>([])
  const [activeCertificateModal, setActiveCertificateModal] = useState<ApplicantClaimRecord | null>(null)
  const [milestoneNotice, setMilestoneNotice] = useState<string | null>(null)

  // Sync selectedProgram when programs list updates
  useEffect(() => {
    if (programs.length > 0 && !programs.find((p) => p.id === selectedProgram.id)) {
      setSelectedProgram(programs[0])
    }
  }, [programs, selectedProgram.id])

  // Load claims and applications for connected wallet
  useEffect(() => {
    let isCurrent = true
    if (walletConnected && walletAddress) {
      setMyClaims(getApplicantClaims(walletAddress))
      setMyApplications(getApplicantApplications(walletAddress))

      fetchServerApplications(walletAddress).then((remoteApps) => {
        if (isCurrent && remoteApps && remoteApps.length > 0) {
          setMyApplications(remoteApps)
        }
      })
    } else {
      setMyClaims([])
      setMyApplications([])
    }
    return () => {
      isCurrent = false
    }
  }, [walletConnected, walletAddress])

  // Real-time client evaluation for instant circuit feedback
  const localEval = evaluateEligibilityCircuit(credentials, selectedProgram)

  // Presets for testing assertions
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

  // Real client-side document upload & SHA-256 calculation
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    category: 'transcript' | 'enrollment' | 'income' | 'other'
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingDoc(true)
    try {
      const hash = await computeDocumentHash(file)
      const newDoc: ApplicantDocument = {
        id: `doc_${Date.now()}`,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        sha256Hash: hash,
        uploadedAt: new Date().toISOString(),
        category,
      }
      setDocuments((prev) => [newDoc, ...prev])
      setDocHashSuccess(`✓ Hashed "${file.name}" locally (${hash.slice(0, 16)}...). File never leaves device.`)
      setTimeout(() => setDocHashSuccess(null), 4000)
    } finally {
      setUploadingDoc(false)
    }
  }

  const isProving =
    provingStatus === 'witnessing' || provingStatus === 'proving' || provingStatus === 'submitting'

  // Submit proof and create both a verified claim record and a full trackable application record
  const handleSubmitClaim = async () => {
    if (!walletConnected) {
      onConnectWallet()
      return
    }

    const res = await onExecuteProof(credentials, selectedProgram)
    if (res.success && res.proof && walletAddress) {
      const newTxHash =
        txHash ||
        `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`

      // 1. Save Claim Record (for backwards compatibility & tests)
      const claimRecord: ApplicantClaimRecord = {
        id: `claim_${Date.now()}`,
        grantId: selectedProgram.id,
        programName: selectedProgram.name,
        maxAmount: selectedProgram.maxAmount,
        claimantAddress: walletAddress,
        nullifier: res.proof.nullifier,
        txHash: newTxHash,
        claimedAt: new Date().toISOString(),
        proof: res.proof,
      }
      saveApplicantClaim(claimRecord)
      setMyClaims(getApplicantClaims(walletAddress))

      // 2. Save Complete Multi-Milestone Application Record
      const appRecord: ApplicantApplicationRecord = {
        id: `GS-APP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        grantId: selectedProgram.id,
        programName: selectedProgram.name,
        maxAmount: selectedProgram.maxAmount,
        claimantAddress: walletAddress,
        claimantName: profile.fullName,
        institution: profile.institutionName,
        degree: profile.degree,
        graduationYear: profile.graduationYear,
        documents: [...documents],
        proof: res.proof,
        nullifier: res.proof.nullifier,
        txHash: newTxHash,
        status: 'verified',
        submittedAt: new Date().toISOString(),
        disbursedAmount: '0% Disbursed',
        walletSignature: walletSignature || undefined,
        zkAttestationId: `ZKA-${Date.now().toString(36).toUpperCase()}`,
        milestones: [
          {
            id: `ms_1_${Date.now()}`,
            title: 'Initial Semester Enrollment & Verification',
            percentage: 50,
            amount: `50% (${selectedProgram.maxAmount})`,
            claimed: false,
          },
          {
            id: `ms_2_${Date.now()}`,
            title: 'Midterm Research & Academic Progress',
            percentage: 50,
            amount: `50% (${selectedProgram.maxAmount})`,
            claimed: false,
          },
        ],
      }
      saveApplicantApplication(appRecord)
      setMyApplications(getApplicantApplications(walletAddress))
    }
  }

  // Handle milestone payout claim
  const handleClaimMilestonePayout = (appId: string, milestoneId: string) => {
    if (!walletAddress) return
    const res = claimApplicationMilestone(walletAddress, appId, milestoneId)
    if (res.success) {
      setMyApplications(getApplicantApplications(walletAddress))
      setMilestoneNotice(`✓ Milestone grant payout claimed! Midnight tx: ${res.txHash?.slice(0, 16)}...`)
      setTimeout(() => setMilestoneNotice(null), 5000)
    } else {
      setMilestoneNotice(`Milestone claim failed: ${res.error}`)
      setTimeout(() => setMilestoneNotice(null), 5000)
    }
  }

  // Download Attestation Certificate as verifiable JSON
  const handleDownloadAttestation = (claim: ApplicantClaimRecord) => {
    const certData = {
      attestationProtocol: 'GrantShield v1.0 (Midnight Compact)',
      programId: claim.grantId,
      programName: claim.programName,
      awardAmount: claim.maxAmount,
      claimantWallet: claim.claimantAddress,
      proofHash: claim.proof.proofHash,
      cryptographicNullifier: claim.nullifier,
      timestamp: claim.claimedAt,
      network: 'Midnight Preprod',
      consensusBlockHeight: 2689750,
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
      cryptographicSignature: walletSignature || 'Self-attested via Web Crypto Bech32m keypair',
    }

    const blob = new Blob([JSON.stringify(certData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `GrantShield-Certificate-${claim.grantId}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Filter programs for explore view
  const filteredPrograms = programs.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sponsor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tag.toLowerCase().includes(searchQuery.toLowerCase())
    if (!matchesSearch) return false
    if (categoryFilter === 'all') return true
    if (categoryFilter === 'stem') return p.tag.toLowerCase().includes('stem') || p.tag.toLowerCase().includes('tech')
    if (categoryFilter === 'merit') return p.minGpaTimesTen >= 70
    if (categoryFilter === 'need') return p.maxIncome <= 500000
    return true
  })

  return (
    <div className="verifier-container">
      {/* APPLICANT PORTAL SUB-NAV TABS */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          background: '#ffffff',
          padding: '10px 16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-line)',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`modal-tab ${portalTab === 'studio' ? 'active' : ''}`}
            onClick={() => setPortalTab('studio')}
            style={{ padding: '8px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Sparkles size={14} /> ZK Proving Studio
          </button>
          <button
            type="button"
            className={`modal-tab ${portalTab === 'explore' ? 'active' : ''}`}
            onClick={() => setPortalTab('explore')}
            style={{ padding: '8px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Search size={14} /> Discover Grants ({programs.length})
          </button>
          <button
            type="button"
            className={`modal-tab ${portalTab === 'applications' ? 'active' : ''}`}
            onClick={() => setPortalTab('applications')}
            style={{ padding: '8px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <FolderCheck size={14} /> My Applications ({myApplications.length})
          </button>
          <button
            type="button"
            className={`modal-tab ${portalTab === 'vault' ? 'active' : ''}`}
            onClick={() => setPortalTab('vault')}
            style={{ padding: '8px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Lock size={14} /> Document Vault ({documents.length})
          </button>
        </div>

        {walletConnected && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <span className="wallet-status-dot" style={{ display: 'inline-block' }} />
            <span>Connected: <strong>{walletAddress.slice(0, 10)}...{walletAddress.slice(-4)}</strong></span>
          </div>
        )}
      </div>

      {milestoneNotice && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} />
          <span>{milestoneNotice}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          VIEW 1: DISCOVER GRANTS (EXPLORE)
      ───────────────────────────────────────────────────────────────────────────── */}
      {portalTab === 'explore' && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search scholarships, grants, sponsors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '6px', border: '1px solid var(--border-line)', fontSize: '13px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'All Grants' },
                { id: 'merit', label: 'Merit (GPA ≥ 7.0)' },
                { id: 'need', label: 'Need-Based (< ₹5L)' },
                { id: 'stem', label: 'STEM & Tech' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryFilter(c.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: '1px solid',
                    borderColor: categoryFilter === c.id ? 'var(--primary-accent)' : 'var(--border-line)',
                    background: categoryFilter === c.id ? 'var(--mint-bg)' : '#ffffff',
                    color: categoryFilter === c.id ? 'var(--primary-accent)' : 'var(--text-main)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {filteredPrograms.map((prog) => {
              const evalRes = evaluateEligibilityCircuit(credentials, prog)
              return (
                <div
                  key={prog.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--border-line)',
                    borderRadius: 'var(--radius-md)',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: 'var(--shadow-card)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span className="tag-pill">{prog.tag}</span>
                      <span className="deadline-pill">
                        <Clock size={11} style={{ display: 'inline', marginRight: '4px' }} />
                        {prog.deadline}
                      </span>
                    </div>
                    <h3 style={{ margin: '0 0 6px', fontSize: '17px', color: 'var(--text-main)' }}>{prog.name}</h3>
                    <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.4 }}>{prog.description}</p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#f8fafc', borderRadius: '6px', marginBottom: '12px' }}>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Max Endowment</span>
                        <strong style={{ fontSize: '15px', color: 'var(--primary-accent)' }}>{prog.maxAmount}</strong>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Live Qualification</span>
                        {evalRes.valid ? (
                          <span style={{ fontSize: '12px', color: '#059669', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <Check size={12} /> 100% Eligible
                          </span>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#b45309', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <AlertTriangle size={12} /> Action Needed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProgram(prog)
                      setPortalTab('studio')
                      onReset()
                    }}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'var(--primary-accent)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <Sparkles size={14} /> Open in ZK Proving Studio
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          VIEW 2: DOCUMENT VAULT & REAL IN-BROWSER HASHING
      ───────────────────────────────────────────────────────────────────────────── */}
      {portalTab === 'vault' && (
        <div style={{ background: '#ffffff', border: '1px solid var(--border-line)', borderRadius: 'var(--radius-md)', padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
            <div>
              <div className="badge-shield" style={{ marginBottom: '6px' }}>
                <Lock size={13} /> Local Cryptographic Vault
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: '20px' }}>Private Document Vault &amp; Hash Commitments</h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', maxWidth: '650px' }}>
                Documents uploaded here are processed strictly in your browser using the Web Crypto API. Only the computed
                SHA-256 Merkle leaf hash is passed to the zero-knowledge circuit witness. Raw files never touch any server.
              </p>
            </div>
            <label
              style={{
                background: 'var(--primary-accent)',
                color: '#ffffff',
                padding: '10px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: uploadingDoc ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <UploadCloud size={16} />
              {uploadingDoc ? 'Computing SHA-256...' : 'Upload & Hash Credential'}
              <input
                type="file"
                onChange={(e) => handleFileUpload(e, 'other')}
                disabled={uploadingDoc}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {docHashSuccess && (
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '10px 14px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>
              {docHashSuccess}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {documents.map((doc) => (
              <div
                key={doc.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                  padding: '14px 16px',
                  background: '#f8fafc',
                  border: '1px solid var(--border-line)',
                  borderRadius: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <FileText size={24} color="var(--primary-accent)" />
                  <div>
                    <strong style={{ fontSize: '14px', display: 'block' }}>{doc.name}</strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {(doc.size / 1024).toFixed(1)} KB · Uploaded {new Date(doc.uploadedAt).toLocaleDateString()} · {doc.category.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ background: '#ffffff', border: '1px solid var(--border-line)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                    SHA-256: <code>{doc.sha256Hash.slice(0, 18)}...{doc.sha256Hash.slice(-8)}</code>
                  </div>
                  <button
                    type="button"
                    className="copy-mini-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(doc.sha256Hash)
                      setDocHashSuccess(`✓ Copied SHA-256 hash for ${doc.name}`)
                      setTimeout(() => setDocHashSuccess(null), 3000)
                    }}
                    title="Copy Document Hash"
                  >
                    <Copy size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          VIEW 3: MY APPLICATIONS & MILESTONE DISBURSEMENT TRACKER
      ───────────────────────────────────────────────────────────────────────────── */}
      {portalTab === 'applications' && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '20px' }}>My Applications &amp; Escrow Disbursements</h3>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                Track applications submitted under wallet: <code>{walletAddress.slice(0, 14)}...</code>
              </p>
            </div>
            <span className="claims-counter-pill">{myApplications.length} Submissions</span>
          </div>

          {myApplications.length === 0 ? (
            <div className="claims-empty-box">
              <Award size={36} color="#94a3b8" />
              <p>No active applications yet for this connected wallet.</p>
              <span>Switch to the "ZK Proving Studio" tab to generate a private proof and apply to an endowment program.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {myApplications.map((app) => (
                <div
                  key={app.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--border-line)',
                    borderRadius: 'var(--radius-md)',
                    padding: '20px',
                    boxShadow: 'var(--shadow-card)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>
                          {app.id}
                        </span>
                        <span className="eval-badge pass" style={{ fontSize: '11px', textTransform: 'capitalize' }}>
                          ✓ {app.status}
                        </span>
                      </div>
                      <h4 style={{ margin: '0 0 4px', fontSize: '18px' }}>{app.programName}</h4>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Applicant: <strong>{app.claimantName}</strong> ({app.institution}) · Submitted {new Date(app.submittedAt).toLocaleString()}
                      </span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Approved Award</span>
                      <strong style={{ fontSize: '18px', color: 'var(--primary-accent)' }}>{app.maxAmount}</strong>
                      <span style={{ fontSize: '11px', color: '#059669', display: 'block' }}>{app.disbursedAmount}</span>
                    </div>
                  </div>

                  {/* Milestone Escrow Payout Checklist */}
                  <div style={{ background: '#f8fafc', border: '1px solid var(--border-line)', borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <strong style={{ fontSize: '13px' }}>Disbursement Milestone Schedule</strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Midnight Escrow Smart Contract</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {app.milestones.map((ms, idx) => (
                        <div
                          key={ms.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '10px',
                            background: '#ffffff',
                            padding: '10px 14px',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                          }}
                        >
                          <div>
                            <span style={{ fontSize: '12px', fontWeight: 600, display: 'block' }}>
                              Milestone {idx + 1}: {ms.title}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              Allocation: {ms.amount}
                            </span>
                          </div>

                          <div>
                            {ms.claimed ? (
                              <span style={{ fontSize: '12px', color: '#059669', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle2 size={14} /> Payout Disbursed ({ms.txHash?.slice(0, 10)}...)
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleClaimMilestonePayout(app.id, ms.id)}
                                style={{
                                  background: 'var(--primary-accent)',
                                  color: '#ffffff',
                                  border: 'none',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <Sparkles size={12} /> Claim Milestone Payout
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      Nullifier: <code>{app.nullifier.slice(0, 16)}...{app.nullifier.slice(-6)}</code>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="outline-button-small"
                        onClick={() => {
                          const matchingClaim = myClaims.find((c) => c.nullifier === app.nullifier)
                          if (matchingClaim) {
                            setActiveCertificateModal(matchingClaim)
                          }
                        }}
                      >
                        <FileCheck size={13} /> View Certificate
                      </button>
                      <button
                        type="button"
                        className="outline-button-small"
                        onClick={() => {
                          const matchingClaim = myClaims.find((c) => c.nullifier === app.nullifier)
                          if (matchingClaim) {
                            handleDownloadAttestation(matchingClaim)
                          }
                        }}
                      >
                        <Download size={13} /> Download Attestation JSON
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          VIEW 4: CORE ZK PROVING STUDIO (Always Rendered on Default Tab)
      ───────────────────────────────────────────────────────────────────────────── */}
      {portalTab === 'studio' && (
        <>
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
                    if (rule.id.includes('income') || rule.id.includes('inc')) isSatisfied = localEval.results.incomeSatisfied
                    if (rule.id.includes('age')) isSatisfied = localEval.results.ageSatisfied
                    if (rule.id.includes('enrolled') || rule.id.includes('enrollment')) isSatisfied = localEval.results.enrollmentSatisfied

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
                      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                        <button
                          type="button"
                          className="outline-button-small"
                          onClick={() => setActiveCertificateModal(claim)}
                        >
                          <FileCheck size={13} /> View Certificate
                        </button>
                        <button
                          type="button"
                          className="outline-button-small"
                          onClick={() => handleDownloadAttestation(claim)}
                        >
                          <Download size={13} /> Download JSON
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
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

            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="outline-button-small"
                onClick={() => handleDownloadAttestation(activeCertificateModal)}
              >
                <Download size={13} /> Download Attestation JSON
              </button>
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
