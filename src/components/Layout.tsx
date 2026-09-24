import { useState, type ReactNode } from 'react'
import {
  ExternalLink,
  Github,
  Lock,
  Menu,
  ShieldCheck,
  Wallet,
  X,
} from 'lucide-react'
import { WalletConnect } from './WalletConnect'
import { DEPLOYED_CONTRACT_INFO } from '../utils/contract'

interface LayoutProps {
  children: ReactNode
  walletConnected: boolean
  address?: string
  network?: string
  balance?: string
  providerName?: string
  privateKeyHex?: string
  isWalletModalOpen?: boolean
  onOpenWalletModal?: () => void
  onCloseWalletModal?: () => void
  onConnectExtension: () => Promise<boolean | { success: boolean; error?: string }>
  onConnectWeb3?: () => Promise<boolean | { success: boolean; error?: string }>
  onConnectDevKeystore?: () => Promise<boolean | { success: boolean; error?: string }>
  onGenerateFreshWallet?: () => Promise<boolean | { success: boolean; wallet?: any }>
  onImportKey?: (hex: string) => Promise<boolean | { success: boolean; error?: string }>
  onConnectMobile: () => void
  onConnectKeystore?: (customAddress?: string) => void
  onDisconnect: () => void
}

export function Layout({
  children,
  walletConnected,
  address,
  network,
  balance,
  providerName,
  privateKeyHex,
  isWalletModalOpen,
  onOpenWalletModal,
  onCloseWalletModal,
  onConnectExtension,
  onConnectWeb3,
  onConnectDevKeystore,
  onGenerateFreshWallet,
  onImportKey,
  onConnectMobile,
  onConnectKeystore,
  onDisconnect,
}: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="app-shell">
      {/* Top Navigation Bar */}
      <header className="topbar">
        <a className="brand" href="#top" aria-label="GrantShield Home">
          <span className="brand-mark">
            <ShieldCheck size={20} strokeWidth={2.4} />
          </span>
          <div className="brand-text">
            <span className="brand-title">GrantShield</span>
            <span className="brand-network-badge">Midnight Preprod</span>
          </div>
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

          {/* Wallet Connect Component */}
          <WalletConnect
            connected={walletConnected}
            address={address}
            network={network}
            balance={balance}
            providerName={providerName}
            privateKeyHex={privateKeyHex}
            isOpen={isWalletModalOpen}
            onOpen={onOpenWalletModal}
            onClose={onCloseWalletModal}
            onConnectExtension={onConnectExtension}
            onConnectWeb3={onConnectWeb3}
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

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <span className="drawer-title">Navigation</span>
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
            <div className="brand-inline">
              <ShieldCheck size={18} className="shield-green" />
              <strong>GrantShield</strong>
            </div>
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
              <h5>Documentation</h5>
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
          <span>GrantShield · Built for the Midnight</span>
          <div className="footer-legal-links">
            <span>Powered by Midnight Compact 0.23+ &amp; Multi-Device Wallet Layer</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
