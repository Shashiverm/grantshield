import { useState, useEffect } from 'react'
import {
  ArrowUpRight,
  Award,
  Check,
  CheckCircle,
  CheckCircle2,
  ChevronRight,
  Database,
  Edit3,
  Eye,
  EyeOff,
  FileKey2,
  Key,
  Layers,
  Lock,
  LockKeyhole,
  PlusCircle,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import { Layout } from './components/Layout'
import { EligibilityVerifier } from './components/EligibilityVerifier'
import { GrantShieldLogo } from './components/GrantShieldLogo'
import { useMidnight } from './hooks/useMidnight'
import {
  ApplicantCredentials,
  GrantProgram,
  getStoredPrograms,
  saveStoredPrograms,
  fetchServerPrograms,
  midnightLedger,
} from './utils/contract'

const networkStats = [
  { label: 'Active Programs', value: '12', delta: '+3 this month', icon: Sparkles },
  { label: 'ZK Proofs Verified', value: '1,284', delta: '+18.4% on Preprod', icon: FileKey2 },
  { label: 'Sensitive Data Disclosed', value: '0 bytes', delta: 'Mathematically zero', icon: LockKeyhole },
]

export function App() {
  const {
    wallet,
    walletConnected,
    connectExtension,
    connectWeb3,
    signSessionChallenge,
    connectDevKeystore,
    generateFreshWallet,
    importKey,
    connectMobile,
    disconnectWallet,
    provingStatus,
    stepDetail,
    error,
    lastProof,
    txHash,
    claimCompleted,
    executeProofAndClaim,
    resetStatus,
    deployedContract,
  } = useMidnight()

  const [walletModalOpen, setWalletModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'applicant' | 'sponsor'>('applicant')
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingProgram, setEditingProgram] = useState<GrantProgram | null>(null)
  const [programsList, setProgramsList] = useState<GrantProgram[]>(() => getStoredPrograms())

  // Synchronize programs across tabs, incognito windows, and future visits
  useEffect(() => {
    let isMounted = true
    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('grantshield_sync') : null

    // 1. Initial fetch from server API
    fetchServerPrograms().then((remote) => {
      if (isMounted && remote && remote.length > 0) {
        setProgramsList((prev) => {
          if (JSON.stringify(prev) !== JSON.stringify(remote)) {
            return remote
          }
          return prev
        })
      }
    })

    // 2. BroadcastChannel for instant cross-tab sync in the same browser profile
    if (channel) {
      channel.onmessage = (event) => {
        if (event.data?.type === 'PROGRAMS_UPDATED' && Array.isArray(event.data.programs) && isMounted) {
          setProgramsList(event.data.programs)
        }
      }
    }

    // 3. Storage event listener (normal window cross-tab fallback)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'grantshield_programs_v2' && e.newValue && isMounted) {
        try {
          const parsed = JSON.parse(e.newValue)
          if (Array.isArray(parsed)) {
            setProgramsList(parsed)
          }
        } catch {}
      }
    }
    window.addEventListener('storage', handleStorage)

    // 4. Lightweight periodic poll (2.5s) to guarantee incognito and late-opened tabs stay synchronized
    const interval = setInterval(() => {
      fetchServerPrograms().then((remote) => {
        if (isMounted && remote && remote.length > 0) {
          setProgramsList((prev) => {
            if (JSON.stringify(prev) !== JSON.stringify(remote)) {
              return remote
            }
            return prev
          })
        }
      })
    }, 2500)

    return () => {
      isMounted = false
      if (channel) channel.close()
      window.removeEventListener('storage', handleStorage)
      clearInterval(interval)
    }
  }, [])

  // Sponsor new program form state
  const [newProgName, setNewProgName] = useState('')
  const [newProgAmount, setNewProgAmount] = useState('₹2,00,000')
  const [newProgMinGpa, setNewProgMinGpa] = useState('7.5')
  const [newProgMaxIncome, setNewProgMaxIncome] = useState('600000')
  const [newProgMaxAge, setNewProgMaxAge] = useState('30')

  // Edit program form state
  const [editProgName, setEditProgName] = useState('')
  const [editProgAmount, setEditProgAmount] = useState('')
  const [editProgMinGpa, setEditProgMinGpa] = useState('')
  const [editProgMaxIncome, setEditProgMaxIncome] = useState('')
  const [editProgMaxAge, setEditProgMaxAge] = useState('')
  const [editProgDeadline, setEditProgDeadline] = useState('')

  const ledgerState = midnightLedger.getLedgerState()

  const handleExecuteProof = async (credentials: ApplicantCredentials, program: GrantProgram) => {
    const res = await executeProofAndClaim(credentials, program)
    if (res.success) {
      setToastMessage('Zero-knowledge proof verified & award claimed successfully!')
      setTimeout(() => setToastMessage(null), 5000)
      return { success: true }
    } else {
      setToastMessage(`Proof execution failed: ${res.error}`)
      setTimeout(() => setToastMessage(null), 6000)
      return { success: false }
    }
  }

  const handleCreateProgram = (e: React.FormEvent) => {
    e.preventDefault()
    if (!walletConnected || !wallet.address) {
      setToastMessage('Wallet connection required: Please connect your sponsor wallet to create a grant program.')
      setTimeout(() => setToastMessage(null), 4000)
      return
    }
    if (!newProgName) return

    const newProg: GrantProgram = {
      id: `grant_${Date.now()}`,
      name: newProgName,
      tag: 'Community Grant',
      sponsor: `Sponsor (${wallet.address.slice(0, 10)}...${wallet.address.slice(-4)})`,
      maxAmount: newProgAmount,
      deadline: '45 days left',
      description: 'Community supported initiative with customized privacy criteria.',
      maxAge: Number(newProgMaxAge),
      minGpaTimesTen: Math.round(parseFloat(newProgMinGpa) * 10),
      maxIncome: Number(newProgMaxIncome),
      requireEnrollment: true,
      ownerAddress: wallet.address,
      rules: [
        {
          id: `rule_enrolled_${Date.now()}`,
          label: 'Active Enrollment Verified',
          detail: 'Credential checked in browser',
          threshold: 'Active Student',
          private: true,
        },
        {
          id: `rule_gpa_${Date.now()}`,
          label: `GPA of at least ${newProgMinGpa}`,
          detail: 'Academic threshold proven, score hidden',
          threshold: `>= ${newProgMinGpa} GPA`,
          private: true,
        },
        {
          id: `rule_inc_${Date.now()}`,
          label: `Household income below ₹${Number(newProgMaxIncome).toLocaleString('en-IN')}`,
          detail: 'Financial threshold proven, income hidden',
          threshold: `< ₹${Number(newProgMaxIncome).toLocaleString('en-IN')}`,
          private: true,
        },
      ],
    }

    const updated = [newProg, ...programsList]
    setProgramsList(updated)
    saveStoredPrograms(updated)
    setShowCreateModal(false)
    setNewProgName('')
    setToastMessage(`Grant Program "${newProg.name}" created and committed to Midnight!`)
    setTimeout(() => setToastMessage(null), 4000)
  }

  const handleOpenEditModal = (prog: GrantProgram) => {
    if (!walletConnected || !wallet.address) {
      setToastMessage('Please connect your sponsor wallet to modify this program.')
      setTimeout(() => setToastMessage(null), 4000)
      return
    }
    if (prog.ownerAddress && prog.ownerAddress !== wallet.address) {
      setToastMessage(`Access Denied: Only the creator sponsor (${prog.ownerAddress.slice(0, 10)}...) can modify this program.`)
      setTimeout(() => setToastMessage(null), 5000)
      return
    }
    setEditingProgram(prog)
    setEditProgName(prog.name)
    setEditProgAmount(prog.maxAmount)
    setEditProgMinGpa((prog.minGpaTimesTen / 10).toFixed(1))
    setEditProgMaxIncome(String(prog.maxIncome))
    setEditProgMaxAge(String(prog.maxAge))
    setEditProgDeadline(prog.deadline)
  }

  const handleSaveEditedProgram = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProgram) return
    if (!walletConnected || !wallet.address || (editingProgram.ownerAddress && editingProgram.ownerAddress !== wallet.address)) {
      setToastMessage('Access Denied: Only the creator sponsor can save changes.')
      setTimeout(() => setToastMessage(null), 4000)
      return
    }

    const updatedPrograms = programsList.map((p) => {
      if (p.id === editingProgram.id) {
        return {
          ...p,
          name: editProgName,
          maxAmount: editProgAmount,
          minGpaTimesTen: Math.round(parseFloat(editProgMinGpa) * 10),
          maxIncome: Number(editProgMaxIncome),
          maxAge: Number(editProgMaxAge),
          deadline: editProgDeadline,
          rules: p.rules.map((r) => {
            if (r.id.includes('gpa')) {
              return { ...r, label: `GPA of at least ${editProgMinGpa}`, threshold: `>= ${editProgMinGpa} GPA` }
            }
            if (r.id.includes('inc')) {
              return { ...r, label: `Household income below ₹${Number(editProgMaxIncome).toLocaleString('en-IN')}`, threshold: `< ₹${Number(editProgMaxIncome).toLocaleString('en-IN')}` }
            }
            return r
          }),
        }
      }
      return p
    })

    setProgramsList(updatedPrograms)
    saveStoredPrograms(updatedPrograms)
    setEditingProgram(null)
    setToastMessage(`Grant Program "${editProgName}" successfully updated!`)
    setTimeout(() => setToastMessage(null), 4000)
  }

  const handleDeleteProgram = (prog: GrantProgram) => {
    if (!walletConnected || !wallet.address) {
      setToastMessage('Please connect your sponsor wallet first.')
      setTimeout(() => setToastMessage(null), 4000)
      return
    }
    if (prog.ownerAddress && prog.ownerAddress !== wallet.address) {
      setToastMessage('Access Denied: Only the creator sponsor can delete this program.')
      setTimeout(() => setToastMessage(null), 4000)
      return
    }
    if (window.confirm(`Are you sure you want to permanently delete the grant program "${prog.name}"?`)) {
      const updatedPrograms = programsList.filter((p) => p.id !== prog.id)
      setProgramsList(updatedPrograms)
      saveStoredPrograms(updatedPrograms)
      setToastMessage(`Grant Program "${prog.name}" deleted.`)
      setTimeout(() => setToastMessage(null), 4000)
    }
  }

  return (
    <Layout
      walletConnected={walletConnected}
      address={wallet.address}
      rawAddress={wallet.rawAddress}
      network={wallet.network}
      balance={wallet.balance}
      providerName={wallet.providerName}
      privateKeyHex={wallet.privateKeyHex}
      signature={wallet.signature}
      isWalletModalOpen={walletModalOpen}
      onOpenWalletModal={() => setWalletModalOpen(true)}
      onCloseWalletModal={() => setWalletModalOpen(false)}
      onConnectExtension={async () => {
        return await connectExtension()
      }}
      onConnectWeb3={async (specificProvider) => {
        return await connectWeb3(specificProvider)
      }}
      onSignSessionChallenge={signSessionChallenge}
      onConnectDevKeystore={async () => {
        return await connectDevKeystore()
      }}
      onGenerateFreshWallet={async () => {
        const res = await generateFreshWallet()
        return res.success
      }}
      onImportKey={async (hex) => {
        const res = await importKey(hex)
        return res.success
      }}
      onConnectMobile={connectMobile}
      onDisconnect={disconnectWallet}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast" role="status">
          <ShieldCheck size={18} className="toast-icon" />
          <span>{toastMessage}</span>
          <button
            type="button"
            className="toast-close"
            onClick={() => setToastMessage(null)}
            aria-label="Dismiss notification"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="hero-section" id="top">
        <div className="hero-copy">
          <div className="eyebrow-container">
            <span className="eyebrow-dot" />
            <span className="eyebrow-text">MIDNIGHT PREPROD · PROGRAMMABLE PRIVACY</span>
          </div>
          <h1 className="hero-title">
            Prove you qualify.<br />
            <em>Keep your story yours.</em>
          </h1>
          <p className="hero-text">
            GrantShield is a privacy-preserving platform for scholarships and grants. Prove you satisfy GPA,
            income, age, and enrollment requirements without turning sensitive personal records into public
            blockchain state.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#apply">
              Explore Programs & Verify <ArrowUpRight size={17} />
            </a>
            <a className="secondary-button" href="#privacy-model">
              Privacy Architecture <ChevronRight size={16} />
            </a>
          </div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="shield-orb-glow" />
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="seal-badge">
            <div className="seal-icon-box" style={{ background: 'transparent', boxShadow: 'none' }}>
              <GrantShieldLogo variant="mark" size={48} />
            </div>
            <span className="seal-tag">ZERO-KNOWLEDGE</span>
            <span className="seal-sub">Private by Default</span>
          </div>
          <div className="hero-pill-badge bottom-left">
            <Check size={13} /> GPA Verified (Hidden)
          </div>
          <div className="hero-pill-badge top-right">
            <Check size={13} /> Income Verified (Hidden)
          </div>
        </div>
      </section>

      {/* NETWORK METRICS STRIP */}
      <section className="stats-strip" aria-label="Network verification metrics">
        {networkStats.map(({ label, value, delta, icon: Icon }) => (
          <div className="stat-card" key={label}>
            <div className="stat-icon-wrap">
              <Icon size={20} />
            </div>
            <div className="stat-body">
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
            <small className="stat-delta">{delta}</small>
          </div>
        ))}
      </section>

      {/* CORE WORKSPACE SECTION */}
      <section className="workspace-section" id="apply">
        <div className="section-heading-bar">
          <div>
            <p className="eyebrow-section">GRANT & SCHOLARSHIP WORKSPACE</p>
            <h2 className="section-title">
              One place to fund <em>what matters.</em>
            </h2>
          </div>

          {/* Role switcher toggle */}
          <div className="view-toggle-tabs" role="tablist" aria-label="Workspace views">
            <button
              id="tab-applicant"
              type="button"
              className={`toggle-tab ${activeTab === 'applicant' ? 'active' : ''}`}
              onClick={() => setActiveTab('applicant')}
              role="tab"
              aria-selected={activeTab === 'applicant'}
            >
              <Users size={14} /> Applicant Portal
            </button>
            <button
              id="tab-sponsor"
              type="button"
              className={`toggle-tab ${activeTab === 'sponsor' ? 'active' : ''}`}
              onClick={() => setActiveTab('sponsor')}
              role="tab"
              aria-selected={activeTab === 'sponsor'}
            >
              <Award size={14} /> Sponsor Console
            </button>
          </div>
        </div>

        {activeTab === 'applicant' ? (
          <EligibilityVerifier
            walletConnected={walletConnected}
            walletAddress={wallet.address}
            rawAddress={wallet.rawAddress}
            walletSignature={wallet.signature}
            onSignSessionChallenge={signSessionChallenge}
            programs={programsList}
            onConnectWallet={() => setWalletModalOpen(true)}
            provingStatus={provingStatus}
            stepDetail={stepDetail}
            error={error}
            lastProof={lastProof}
            txHash={txHash}
            claimCompleted={claimCompleted}
            onExecuteProof={handleExecuteProof}
            onReset={resetStatus}
          />
        ) : (
          <div className="sponsor-view-wrapper" id="sponsor">
            {!walletConnected && (
              <div className="wallet-required-banner">
                <div className="banner-content">
                  <Lock size={20} className="banner-icon" />
                  <div>
                    <strong>Sponsor Wallet Connection Required</strong>
                    <p>
                      Connect your Midnight sponsor wallet to create, edit, or configure grant programs and manage disbursement policies.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-mini-connect"
                  onClick={() => setWalletModalOpen(true)}
                >
                  <Wallet size={15} /> Connect Sponsor Wallet
                </button>
              </div>
            )}

            <div className="sponsor-header-card">
              <div>
                <span className="sponsor-badge">SPONSOR OVERVIEW</span>
                <h3>Aurora Foundation Dashboard</h3>
                <p>
                  Manage active scholarship endowments, review zero-knowledge claim velocity, and deploy new
                  criteria without handling sensitive student dossiers.
                </p>
              </div>
              <button
                type="button"
                id="btn-create-program"
                className="primary-button compact"
                onClick={() => {
                  if (!walletConnected) {
                    setWalletModalOpen(true)
                    setToastMessage('Please connect your sponsor wallet first to create a grant program.')
                    setTimeout(() => setToastMessage(null), 4000)
                    return
                  }
                  setShowCreateModal(true)
                }}
              >
                <PlusCircle size={16} /> Create New Grant Program
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="sponsor-metrics-grid">
              <div className="metric-box">
                <span className="metric-title">Total Grant Budget</span>
                <strong className="metric-number">₹10,00,000</strong>
                <span className="metric-sub">Across {programsList.length} active programs</span>
              </div>
              <div className="metric-box">
                <span className="metric-title">Applications Received</span>
                <strong className="metric-number">143</strong>
                <span className="metric-sub">+21 this week</span>
              </div>
              <div className="metric-box">
                <span className="metric-title">Eligible Applicants</span>
                <strong className="metric-number">87</strong>
                <span className="metric-sub">60.8% passed ZK assertions</span>
              </div>
              <div className="metric-box">
                <span className="metric-title">Approved Claims</span>
                <strong className="metric-number">50</strong>
                <span className="metric-sub">Verified via Compact circuit</span>
              </div>
              <div className="metric-box highlight">
                <span className="metric-title">Claims Completed</span>
                <strong className="metric-number">{ledgerState.verifiedClaims}</strong>
                <span className="metric-sub">₹6,42,000 distributed on-chain</span>
              </div>
            </div>

            {/* Active Programs List */}
            <div className="sponsor-programs-list">
              <div className="list-header">
                <h4>Active Sponsored Programs ({programsList.length})</h4>
                <span className="program-status-pill">Midnight Preprod Synchronized</span>
              </div>
              <div className="programs-table-wrap">
                <table className="programs-table">
                  <thead>
                    <tr>
                      <th>Program Name</th>
                      <th>Max Award</th>
                      <th>Configured Policy Thresholds</th>
                      <th>Status</th>
                      <th>Creator &amp; Access</th>
                    </tr>
                  </thead>
                  <tbody>
                    {programsList.map((prog) => {
                      const isOwner = walletConnected && wallet.address && prog.ownerAddress === wallet.address
                      return (
                        <tr key={prog.id}>
                          <td>
                            <strong>{prog.name}</strong>
                            <span className="table-sub">{prog.sponsor}</span>
                          </td>
                          <td className="award-cell">{prog.maxAmount}</td>
                          <td className="policy-cell">
                            GPA &ge; {(prog.minGpaTimesTen / 10).toFixed(1)} · Income &lt; ₹
                            {prog.maxIncome.toLocaleString('en-IN')} · Age &lt; {prog.maxAge}
                          </td>
                          <td>
                            <span className="active-tag">Active ({prog.deadline})</span>
                          </td>
                          <td className="actions-cell">
                            {isOwner ? (
                              <div className="owner-action-group">
                                <span className="badge-owner">
                                  <Sparkles size={12} /> Your Program
                                </span>
                                <div className="owner-buttons">
                                  <button
                                    type="button"
                                    className="action-btn-edit"
                                    title="Edit grant policy"
                                    onClick={() => handleOpenEditModal(prog)}
                                  >
                                    <Edit3 size={13} /> Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="action-btn-delete"
                                    title="Delete grant program"
                                    onClick={() => handleDeleteProgram(prog)}
                                  >
                                    <Trash2 size={13} /> Delete
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="locked-access-group">
                                <span className="badge-locked">
                                  <Lock size={12} />{' '}
                                  {prog.ownerAddress
                                    ? prog.ownerAddress ===
                                      'mn_addr_preprod16alt42dnwerz6cy4w9wu65z7z3pyvfldeuvf2h7gas8uumygq9ms8x0s67'
                                      ? 'Foundation Endowment'
                                      : `Sponsor: ${prog.ownerAddress.slice(0, 10)}...${prog.ownerAddress.slice(-4)}`
                                    : 'Foundation Program'}
                                </span>
                                <span className="read-only-tag">Protected (Read-Only)</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Verified On-chain Claims Ledger */}
            <div className="activity-panel-card">
              <div className="activity-header">
                <h4>Recent Midnight Circuit Proof Verifications</h4>
                <span className="privacy-mode-badge">
                  <ShieldCheck size={14} /> Zero PII Stored
                </span>
              </div>
              <div className="activity-rows-container">
                <div className="activity-item">
                  <div className="activity-icon-bubble">
                    <Check size={14} />
                  </div>
                  <div className="activity-content">
                    <strong>Eligibility Proof Verified &amp; Nullifier Inserted</strong>
                    <span className="activity-meta">
                      Program: Aurora Scholars Fund · Nullifier:{' '}
                      <code>nullifier_e3b0c44298fc...7852b855</code>
                    </span>
                  </div>
                  <span className="timestamp-badge">2 mins ago</span>
                </div>
                <div className="activity-item">
                  <div className="activity-icon-bubble">
                    <Check size={14} />
                  </div>
                  <div className="activity-content">
                    <strong>Eligibility Proof Verified &amp; Nullifier Inserted</strong>
                    <span className="activity-meta">
                      Program: STEM Access Fellowship · Nullifier:{' '}
                      <code>nullifier_a2f8c1498b2c...7852a1b2</code>
                    </span>
                  </div>
                  <span className="timestamp-badge">14 mins ago</span>
                </div>
                <div className="activity-item">
                  <div className="activity-icon-bubble">
                    <Layers size={14} />
                  </div>
                  <div className="activity-content">
                    <strong>12 Batch Proofs Settled on Midnight Preprod</strong>
                    <span className="activity-meta">
                      Program: Regional Equity Grant · Contract verifiedClaims counter updated
                    </span>
                  </div>
                  <span className="timestamp-badge">42 mins ago</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* CREATE PROGRAM MODAL */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-row">
                <Award size={20} className="modal-icon" />
                <h3>Create New Grant Program</h3>
              </div>
              <button
                type="button"
                className="close-button"
                onClick={() => setShowCreateModal(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateProgram} className="modal-form">
              <div className="modal-form-group">
                <label>Program Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NextGen Web3 Founders Grant"
                  value={newProgName}
                  onChange={(e) => setNewProgName(e.target.value)}
                  className="modal-input"
                />
              </div>
              <div className="modal-grid-2">
                <div className="modal-form-group">
                  <label>Max Grant Award</label>
                  <input
                    type="text"
                    required
                    value={newProgAmount}
                    onChange={(e) => setNewProgAmount(e.target.value)}
                    className="modal-input"
                  />
                </div>
                <div className="modal-form-group">
                  <label>Minimum GPA (out of 10.0)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="5.0"
                    max="10.0"
                    required
                    value={newProgMinGpa}
                    onChange={(e) => setNewProgMinGpa(e.target.value)}
                    className="modal-input"
                  />
                </div>
              </div>
              <div className="modal-grid-2">
                <div className="modal-form-group">
                  <label>Max Household Income (₹)</label>
                  <input
                    type="number"
                    step="50000"
                    min="100000"
                    max="2000000"
                    required
                    value={newProgMaxIncome}
                    onChange={(e) => setNewProgMaxIncome(e.target.value)}
                    className="modal-input"
                  />
                </div>
                <div className="modal-form-group">
                  <label>Max Age Limit (Years)</label>
                  <input
                    type="number"
                    min="18"
                    max="60"
                    required
                    value={newProgMaxAge}
                    onChange={(e) => setNewProgMaxAge(e.target.value)}
                    className="modal-input"
                  />
                </div>
              </div>
              <div className="modal-privacy-note">
                <Lock size={14} /> Policy rules are compiled into Midnight circuits. Applicants will prove
                satisfaction locally; you will never receive raw financial documents.
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-btn">
                  Publish to Midnight Preprod
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PROGRAM MODAL - SPONSOR OWNER ACCESS ONLY */}
      {editingProgram && (
        <div className="modal-backdrop" onClick={() => setEditingProgram(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-row">
                <Edit3 size={20} className="modal-icon" />
                <h3>Modify Grant Program Policy</h3>
              </div>
              <button
                type="button"
                className="close-button"
                onClick={() => setEditingProgram(null)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveEditedProgram} className="modal-form">
              <div className="modal-form-group">
                <label>Program Name</label>
                <input
                  type="text"
                  required
                  value={editProgName}
                  onChange={(e) => setEditProgName(e.target.value)}
                  className="modal-input"
                />
              </div>
              <div className="modal-grid-2">
                <div className="modal-form-group">
                  <label>Max Grant Award</label>
                  <input
                    type="text"
                    required
                    value={editProgAmount}
                    onChange={(e) => setEditProgAmount(e.target.value)}
                    className="modal-input"
                  />
                </div>
                <div className="modal-form-group">
                  <label>Minimum GPA (out of 10.0)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="5.0"
                    max="10.0"
                    required
                    value={editProgMinGpa}
                    onChange={(e) => setEditProgMinGpa(e.target.value)}
                    className="modal-input"
                  />
                </div>
              </div>
              <div className="modal-grid-2">
                <div className="modal-form-group">
                  <label>Max Household Income (₹)</label>
                  <input
                    type="number"
                    step="50000"
                    min="100000"
                    max="2000000"
                    required
                    value={editProgMaxIncome}
                    onChange={(e) => setEditProgMaxIncome(e.target.value)}
                    className="modal-input"
                  />
                </div>
                <div className="modal-form-group">
                  <label>Max Age Limit (Years)</label>
                  <input
                    type="number"
                    min="18"
                    max="60"
                    required
                    value={editProgMaxAge}
                    onChange={(e) => setEditProgMaxAge(e.target.value)}
                    className="modal-input"
                  />
                </div>
              </div>
              <div className="modal-form-group">
                <label>Application Deadline</label>
                <input
                  type="text"
                  required
                  value={editProgDeadline}
                  onChange={(e) => setEditProgDeadline(e.target.value)}
                  className="modal-input"
                  placeholder="e.g. 60 days left"
                />
              </div>
              <div className="modal-privacy-note">
                <Lock size={14} /> Only the authenticated creator sponsor wallet ({wallet.address ? `${wallet.address.slice(0, 10)}...${wallet.address.slice(-4)}` : 'Disconnected'}) is authorized to update these circuit constraints.
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setEditingProgram(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-btn">
                  Commit Policy Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRIVACY MODEL / SELECTIVE DISCLOSURE ARCHITECTURE SECTION */}
      <section className="privacy-section" id="privacy-model">
        <div className="privacy-container">
          <div className="privacy-heading">
            <span className="eyebrow-accent">SELECTIVE DISCLOSURE</span>
            <h2>
              The GrantShield Privacy Model on <em>Midnight</em>
            </h2>
            <p>
              Traditional scholarship platforms compel students to disclose transcripts, tax forms, IDs,
              and private family finances. Midnight changes the paradigm from <strong>“hand over data to prove the fact”</strong> to <strong>“prove the fact without revealing the data.”</strong>
            </p>
          </div>

          <div className="disclosure-comparison-grid">
            {/* Column 1: PRIVATE */}
            <div className="disclosure-col private-col">
              <div className="col-header">
                <EyeOff size={20} className="icon-private" />
                <div>
                  <h4>Kept Strictly Private</h4>
                  <small>Processed locally via Compact Witnesses</small>
                </div>
              </div>
              <ul className="disclosure-list">
                <li>
                  <Check size={14} /> Full Legal Identity &amp; Government ID
                </li>
                <li>
                  <Check size={14} /> Student / Enrollment ID Number
                </li>
                <li>
                  <Check size={14} /> Exact Academic GPA / Letter Grades
                </li>
                <li>
                  <Check size={14} /> Exact Household Income &amp; Tax Forms
                </li>
                <li>
                  <Check size={14} /> Supporting Credentials &amp; Documents
                </li>
                <li>
                  <Check size={14} /> Applicant Cryptographic Secret
                </li>
              </ul>
              <div className="col-footer">
                <span>Witness Functions: <code>get_age()</code>, <code>get_gpa_times_ten()</code>, <code>get_household_income()</code></span>
              </div>
            </div>

            {/* Column 2: PROVEN WITHOUT REVEALING */}
            <div className="disclosure-col proven-col">
              <div className="col-header">
                <ShieldCheck size={20} className="icon-proven" />
                <div>
                  <h4>Proven Without Disclosing</h4>
                  <small>Evaluated via Zero-Knowledge Circuits</small>
                </div>
              </div>
              <ul className="disclosure-list">
                <li>
                  <Check size={14} /> Applicant is below program age cutoff (&lt; 35 yrs)
                </li>
                <li>
                  <Check size={14} /> GPA satisfies minimum threshold (&ge; 7.0 / 10)
                </li>
                <li>
                  <Check size={14} /> Household income is strictly under financial cap (&lt; ₹5L)
                </li>
                <li>
                  <Check size={14} /> Enrollment credential is verified and valid
                </li>
                <li>
                  <Check size={14} /> Applicant has not already claimed this award
                </li>
              </ul>
              <div className="col-footer">
                <span>Circuit Assertions: <code>assert(gpaTimesTen &gt;= 70)</code></span>
              </div>
            </div>

            {/* Column 3: PUBLIC ON-CHAIN */}
            <div className="disclosure-col public-col">
              <div className="col-header">
                <Eye size={20} className="icon-public" />
                <div>
                  <h4>Public Ledger State</h4>
                  <small>Verifiable by Anyone on Preprod</small>
                </div>
              </div>
              <ul className="disclosure-list">
                <li>
                  <Check size={14} /> Grant Program Identifier (e.g. <code>grant_aurora_2026</code>)
                </li>
                <li>
                  <Check size={14} /> Program Eligibility Policy Commitments
                </li>
                <li>
                  <Check size={14} /> Boolean Proof Validity State
                </li>
                <li>
                  <Check size={14} /> Unique Claim Nullifier (Prevents duplicate payouts)
                </li>
                <li>
                  <Check size={14} /> Aggregate verifiedClaims Counter
                </li>
              </ul>
              <div className="col-footer">
                <span>Ledger State: <code>ledger verifiedClaims</code>, <code>ledger nullifiers</code></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS 3-STEP EXPLANATION */}
      <section className="how-it-works-section" id="how-it-works">
        <div className="how-inner">
          <div className="how-intro">
            <span className="eyebrow-accent">APPLICANT WORKFLOW</span>
            <h2>
              Privacy-First Funding in <em>Three Steps</em>
            </h2>
            <p>
              GrantShield makes cryptography invisible to users while ensuring verification remains mathematically
              sound.
            </p>
          </div>

          <div className="steps-container">
            <div className="step-card">
              <span className="step-num">01</span>
              <h4>Choose Grant &amp; Reference Credentials</h4>
              <p>
                Browse open scholarships and input your private academic and financial records into your local
                browser vault.
              </p>
            </div>
            <div className="step-card">
              <span className="step-num">02</span>
              <h4>Generate Client-Side ZK Proof</h4>
              <p>
                Your browser constructs private witnesses and evaluates circuit assertions. A zero-knowledge proof
                is synthesized without broadcasting your numbers.
              </p>
            </div>
            <div className="step-card">
              <span className="step-num">03</span>
              <h4>Submit Proof &amp; Receive Funding</h4>
              <p>
                The Midnight Preprod ledger checks the ZK proof and stores a unique nullifier to prevent double-claiming.
                The sponsor disburses funding with total cryptographic assurance.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}

export default App
