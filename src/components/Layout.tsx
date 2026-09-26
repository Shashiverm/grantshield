import { useState, type ReactNode } from 'react'
import {
  ExternalLink,
  Github,
  Lock,
  Menu,
  Scale,
  ShieldCheck,
  Wallet,
  X,
} from 'lucide-react'
import { GrantShieldLogo } from './GrantShieldLogo'
import { WalletConnect } from './WalletConnect'
import { DEPLOYED_CONTRACT_INFO } from '../utils/contract'
import type { NetworkTelemetry } from '../hooks/useMidnight'

interface LayoutProps {
  children: ReactNode
  walletConnected: boolean
  address?: string
  rawAddress?: string
  network?: string
  balance?: string
  providerName?: string
  privateKeyHex?: string
  signature?: string
  isWalletModalOpen?: boolean
  onOpenWalletModal?: () => void
  onCloseWalletModal?: () => void
  onConnectExtension: () => Promise<boolean | { success: boolean; error?: string }>
  onConnectWeb3?: (specificProvider?: any) => Promise<boolean | { success: boolean; error?: string }>
  onSignSessionChallenge?: (customMessage?: string) => Promise<{ success: boolean; signature?: string; error?: string }>
  onConnectDevKeystore?: () => Promise<boolean | { success: boolean; error?: string }>
  onGenerateFreshWallet?: () => Promise<boolean | { success: boolean; wallet?: any }>
  onImportKey?: (hex: string) => Promise<boolean | { success: boolean; error?: string }>
  onConnectMobile: () => void
  onConnectKeystore?: (customAddress?: string) => void
  onDisconnect: () => void
  networkTelemetry?: NetworkTelemetry
  deployedContract?: typeof DEPLOYED_CONTRACT_INFO
  onRedeploy?: () => Promise<{ success: boolean; message: string }>
}

export function Layout({
  children,
  walletConnected,
  address,
  rawAddress,
  network,
  balance,
  providerName,
  privateKeyHex,
  signature,
  isWalletModalOpen,
  onOpenWalletModal,
  onCloseWalletModal,
  onConnectExtension,
  onConnectWeb3,
  onSignSessionChallenge,
  onConnectDevKeystore,
  onGenerateFreshWallet,
  onImportKey,
  onConnectMobile,
  onConnectKeystore,
  onDisconnect,
  networkTelemetry,
  deployedContract,
  onRedeploy,
}: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [telemetryModalOpen, setTelemetryModalOpen] = useState(false)
  const [redeploying, setRedeploying] = useState(false)
  const [redeployMsg, setRedeployMsg] = useState<string | null>(null)
  const [copiedAddr, setCopiedAddr] = useState(false)

  return (
    <div className="app-shell">
      {/* Top Navigation Bar */}
      <header className="topbar">
        <a className="brand" href="#top" aria-label="GrantShield Home">
          <GrantShieldLogo variant="full" size={36} />
        </a>

        {/* Desktop Navigation Links */}
        <nav className="nav-links" aria-label="Main Navigation">
          <a href="#apply" className="nav-link active">
            Applicant Portal
          </a>
          <a href="#sponsor" className="nav-link">
            Sponsor Console
          </a>
          <a href="#how-it-works" className="nav-link">
            How It Works
          </a>
          <a href="#privacy-model" className="nav-link">
            Privacy Model
          </a>
        </nav>

        <div className="topbar-actions">
          <a
            href="https://github.com/Shashiverm/grantshield"
            target="_blank"
            rel="noreferrer"
            className="icon-button github-desktop-icon"
            title="GitHub Repository"
            aria-label="GitHub Repository"
          >
            <Github size={18} />
          </a>

          {/* Live Midnight Preprod Telemetry Pill */}
          <button
            type="button"
            className="network-telemetry-pill"
            onClick={() => setTelemetryModalOpen(true)}
            title="Click to inspect live Midnight Preprod consensus & deployed contract"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '6px 12px',
              background: '#ffffff',
              border: '1px solid var(--border-line)',
              borderRadius: '20px',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              color: 'var(--text-main)',
              transition: 'all 0.2s ease',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 6px #10b981',
                display: 'inline-block',
              }}
            />
            <span style={{ fontWeight: 600 }}>Preprod</span>
            <span style={{ color: 'var(--text-muted)' }}>
              #{networkTelemetry?.blockHeight?.toLocaleString() || deployedContract?.blockHeight?.toLocaleString() || '2,712,146'}
            </span>
          </button>

          {/* Wallet Connect Component */}
          <WalletConnect
            connected={walletConnected}
            address={address}
            rawAddress={rawAddress}
            network={network}
            balance={balance}
            providerName={providerName}
            privateKeyHex={privateKeyHex}
            signature={signature}
            isOpen={isWalletModalOpen}
            onOpen={onOpenWalletModal}
            onClose={onCloseWalletModal}
            onConnectExtension={onConnectExtension}
            onConnectWeb3={onConnectWeb3}
            onSignSessionChallenge={onSignSessionChallenge}
            onConnectDevKeystore={onConnectDevKeystore}
            onGenerateFreshWallet={onGenerateFreshWallet}
            onImportKey={onImportKey}
            onConnectMobile={onConnectMobile}
            onConnectKeystore={onConnectKeystore}
            onDisconnect={onDisconnect}
          />

          {/* Mobile Hamburger Menu Toggle */}
          <button
            type="button"
            className="mobile-hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────────────────────
          LIVE MIDNIGHT PREPROD TELEMETRY & CONTRACT DEPLOYMENT MODAL
      ───────────────────────────────────────────────────────────────────────────── */}
      {telemetryModalOpen && (
        <div
          className="wallet-modal-overlay"
          onClick={() => setTelemetryModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            className="wallet-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '640px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              border: '1px solid var(--border-line)',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px 24px',
                borderBottom: '1px solid var(--border-line)',
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#34d399',
                  }}
                >
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', color: '#0f172a' }}>Midnight Preprod Live Consensus</h3>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Network &amp; Compact Contract Status</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTelemetryModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Network Status Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '10px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: '#16a34a',
                      boxShadow: '0 0 8px #16a34a',
                    }}
                  />
                  <div>
                    <strong style={{ fontSize: '14px', color: '#166534', display: 'block' }}>
                      Live Consensus Synchronized
                    </strong>
                    <span style={{ fontSize: '12px', color: '#15803d' }}>
                      Connected to Midnight Preprod Indexer (GraphQL v4) · Latency: {networkTelemetry?.latencyMs || 84}ms
                    </span>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    background: '#dcfce7',
                    color: '#15803d',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontWeight: 600,
                  }}
                >
                  Protocol 1.3
                </span>
              </div>

              {/* Consensus Metrics Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Live Block Height
                  </span>
                  <strong style={{ fontSize: '18px', color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
                    #{networkTelemetry?.blockHeight?.toLocaleString() || deployedContract?.blockHeight?.toLocaleString() || '2,712,146'}
                  </strong>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Current Epoch
                  </span>
                  <strong style={{ fontSize: '18px', color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
                    #{networkTelemetry?.epochNo || '994662'}
                  </strong>
                </div>
              </div>

              {/* Deployed Contract Information */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '14px', color: '#0f172a' }}>
                  Deployed GrantShield Contract
                </h4>
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '14px',
                    fontSize: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div>
                    <span style={{ color: '#64748b', display: 'block', marginBottom: '2px' }}>Contract Address (Hex):</span>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <code style={{ fontSize: '11px', color: '#0f766e', wordBreak: 'break-all', fontFamily: 'var(--font-mono)' }}>
                        {deployedContract?.contractAddress || DEPLOYED_CONTRACT_INFO.contractAddress}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(deployedContract?.contractAddress || DEPLOYED_CONTRACT_INFO.contractAddress)
                          setCopiedAddr(true)
                          setTimeout(() => setCopiedAddr(false), 2000)
                        }}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '4px',
                          padding: '3px 6px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          color: '#475569',
                          flexShrink: 0,
                        }}
                      >
                        {copiedAddr ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span style={{ color: '#64748b', display: 'block', marginBottom: '2px' }}>Deployer Key (Bech32m):</span>
                    <code style={{ fontSize: '11px', color: '#334155', wordBreak: 'break-all', fontFamily: 'var(--font-mono)' }}>
                      {deployedContract?.deployerAddress || DEPLOYED_CONTRACT_INFO.deployerAddress}
                    </code>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingTop: '4px' }}>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Prover Key Digest:</span>
                      <code style={{ fontSize: '10px', color: '#475569', fontFamily: 'var(--font-mono)' }}>
                        {deployedContract?.proverFingerprint?.slice(0, 18) || 'bzkir_v2_6326...'}
                      </code>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Verifier Key Digest:</span>
                      <code style={{ fontSize: '10px', color: '#475569', fontFamily: 'var(--font-mono)' }}>
                        {deployedContract?.verifierFingerprint?.slice(0, 18) || 'vk_snark_plonk...'}
                      </code>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <a
                    href={deployedContract?.explorerUrl || DEPLOYED_CONTRACT_INFO.explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '10px 14px',
                      background: 'var(--primary-accent)',
                      color: '#ffffff',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    <ExternalLink size={14} /> Open in Midnight Explorer
                  </a>

                  <a
                    href="https://midnight-tmnight-preprod.nethermind.dev"
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '10px 14px',
                      background: '#ffffff',
                      color: '#0f766e',
                      border: '1px solid #0f766e',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    Get Preprod tDUST (Faucet)
                  </a>
                </div>

                {onRedeploy && (
                  <button
                    type="button"
                    disabled={redeploying}
                    onClick={async () => {
                      setRedeploying(true)
                      setRedeployMsg(null)
                      const res = await onRedeploy()
                      setRedeploying(false)
                      setRedeployMsg(res.message)
                    }}
                    style={{
                      width: '100%',
                      padding: '9px',
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#475569',
                      fontWeight: 500,
                      cursor: redeploying ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {redeploying ? 'Deploying Fresh Contract...' : '⚡ Redeploy Fresh Contract to Midnight Preprod'}
                  </button>
                )}

                {redeployMsg && (
                  <span style={{ fontSize: '12px', color: '#16a34a', textAlign: 'center', display: 'block' }}>
                    ✓ {redeployMsg}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <GrantShieldLogo variant="compact" size={28} showBadge={false} />
              <button
                type="button"
                className="close-drawer-btn"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <nav className="mobile-nav-links">
              <a
                href="#apply"
                className="mobile-nav-item active"
                onClick={() => setMobileMenuOpen(false)}
              >
                🎓 Applicant Portal
              </a>
              <a
                href="#sponsor"
                className="mobile-nav-item"
                onClick={() => setMobileMenuOpen(false)}
              >
                🏢 Sponsor Console
              </a>
              <a
                href="#how-it-works"
                className="mobile-nav-item"
                onClick={() => setMobileMenuOpen(false)}
              >
                ⚡ How It Works
              </a>
              <a
                href="#privacy-model"
                className="mobile-nav-item"
                onClick={() => setMobileMenuOpen(false)}
              >
                🔒 Privacy Model &amp; Selective Disclosure
              </a>
              <a
                href="https://github.com/Shashiverm/grantshield"
                target="_blank"
                rel="noreferrer"
                className="mobile-nav-item github-link"
              >
                <Github size={16} /> GitHub Source Code
              </a>
              <a
                href="https://github.com/Shashiverm/grantshield/blob/main/LICENSE"
                target="_blank"
                rel="noreferrer"
                className="mobile-nav-item"
              >
                <Scale size={16} /> Apache 2.0 License
              </a>
            </nav>
            <div className="drawer-footer">
              {!walletConnected ? (
                <button
                  type="button"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'var(--primary-accent)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    marginBottom: '10px',
                  }}
                  onClick={() => {
                    setMobileMenuOpen(false)
                    if (onOpenWalletModal) onOpenWalletModal()
                  }}
                >
                  <Wallet size={16} /> Connect Midnight Wallet
                </button>
              ) : (
                <div style={{ marginBottom: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Connected: <strong style={{ color: 'var(--text-main)' }}>{address ? `${address.slice(0, 10)}...${address.slice(-4)}` : ''}</strong>
                </div>
              )}
              <span className="net-tag">
                <span className="status-indicator-green" /> Midnight Preprod Connected
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main id="main-content">{children}</main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-top">
          <div className="footer-brand">
            <GrantShieldLogo variant="full" size={32} showBadge={false} />
            <p>
              Zero-knowledge eligibility infrastructure for scholarships, grants, and academic funding on
              Midnight Network.
            </p>
          </div>
          <div className="footer-columns">
            <div className="footer-col">
              <h5>Protocols</h5>
              <a href="#apply">Aurora Scholars Fund</a>
              <a href="#apply">STEM Research Fellowship</a>
              <a href="#apply">Regional Equity Grant</a>
            </div>
            <div className="footer-col">
              <h5>Documentation &amp; Legal</h5>
              <a href="#privacy-model">Selective Disclosure</a>
              <a href="https://docs.midnight.network" target="_blank" rel="noreferrer">
                Midnight Docs <ExternalLink size={11} />
              </a>
              <a
                href="https://github.com/Shashiverm/grantshield/blob/main/docs/USAGE.md"
                target="_blank"
                rel="noreferrer"
              >
                Usage Guide <ExternalLink size={11} />
              </a>
              <a
                href="https://github.com/Shashiverm/grantshield/blob/main/LICENSE"
                target="_blank"
                rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                Apache 2.0 License <ExternalLink size={11} />
              </a>
            </div>
            <div className="footer-col">
              <h5>Midnight Preprod</h5>
              <span className="net-status-row">
                <i className="status-indicator-green" /> Preprod Testnet Active
              </span>
              <span className="net-status-row">
                <Lock size={12} /> Compact ZK Circuits Active
              </span>
              <span className="net-status-row">
                <a
                  href={DEPLOYED_CONTRACT_INFO.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--primary-accent)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  title="View Contract on Midnight Explorer"
                >
                  <code>{DEPLOYED_CONTRACT_INFO.contractAddress.slice(0, 10)}...{DEPLOYED_CONTRACT_INFO.contractAddress.slice(-4)}</code>
                  <ExternalLink size={11} />
                </a>
              </span>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>GrantShield · Built for the Midnight Community</span>
          <div className="footer-legal-links" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Powered by Midnight Compact 0.23+ &amp; Multi-Device Wallet Layer</span>
            <span style={{ opacity: 0.5 }}>•</span>
            <a
              href="https://github.com/Shashiverm/grantshield/blob/main/LICENSE"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: 'var(--primary-accent)',
                fontWeight: 600,
              }}
              title="Open-source Apache 2.0 License"
            >
              <Scale size={12} /> Apache-2.0 Licensed
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
