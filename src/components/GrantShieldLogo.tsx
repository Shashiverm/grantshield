import React from 'react'

export interface GrantShieldLogoProps {
  variant?: 'mark' | 'full' | 'compact'
  size?: number | string
  className?: string
  showBadge?: boolean
  onClick?: () => void
}

export function GrantShieldLogo({
  variant = 'full',
  size,
  className = '',
  showBadge = true,
  onClick,
}: GrantShieldLogoProps) {
  // If variant is 'mark', render only the iconic shield emblem
  if (variant === 'mark') {
    const markSize = typeof size === 'number' ? size : 38
    return (
      <div
        className={`grantshield-logo-mark ${className}`}
        style={{ width: markSize, height: markSize, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
        onClick={onClick}
        role="img"
        aria-label="GrantShield Logo Mark"
      >
        <svg
          viewBox="0 0 64 64"
          width={markSize}
          height={markSize}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="gs-component-bg" x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#0a121e" />
              <stop offset="50%" stop-color="#0d1b2a" />
              <stop offset="100%" stop-color="#050910" />
            </linearGradient>

            <linearGradient id="gs-component-border" x1="12" y1="6" x2="52" y2="58" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#34d399" />
              <stop offset="50%" stop-color="#06b6d4" />
              <stop offset="100%" stop-color="#10b981" />
            </linearGradient>

            <radialGradient id="gs-component-glow" cx="32" cy="28" r="22" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#10b981" stop-opacity="0.45" />
              <stop offset="60%" stop-color="#06b6d4" stop-opacity="0.15" />
              <stop offset="100%" stop-color="#06b6d4" stop-opacity="0" />
            </radialGradient>

            <linearGradient id="gs-component-check" x1="22" y1="20" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#a7f3d0" />
              <stop offset="50%" stop-color="#34d399" />
              <stop offset="100%" stop-color="#00e599" />
            </linearGradient>
          </defs>

          <circle cx="32" cy="30" r="22" fill="url(#gs-component-glow)" />

          <path
            d="M32 4L12 12V28C12 43 20.5 53.5 32 59C43.5 53.5 52 43 52 28V12L32 4Z"
            fill="url(#gs-component-bg)"
            stroke="url(#gs-component-border)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          <path
            d="M32 10L17 16V27C17 38.5 23.5 47 32 51.5C40.5 47 47 38.5 47 27V16L32 10Z"
            fill="#0f2027"
            fillOpacity="0.75"
            stroke="#1e3a47"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          <circle cx="32" cy="24" r="5" fill="#064e3b" stroke="#34d399" strokeWidth="1.5" />
          <circle cx="32" cy="24" r="2" fill="#34d399" />

          <path
            d="M23 33.5L28.5 39L41 24.5"
            stroke="url(#gs-component-check)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <polygon points="32,7 33,9.5 35.5,10.5 33,11.5 32,14 31,11.5 28.5,10.5 31,9.5" fill="#34d399" />
        </svg>
      </div>
    )
  }

  // Full or compact logo lockup
  const iconHeight = typeof size === 'number' ? size : 38
  return (
    <div
      className={`grantshield-brand-lockup ${className}`}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        textDecoration: 'none',
        userSelect: 'none',
      }}
    >
      <div
        className="brand-mark-dedicated"
        style={{
          width: iconHeight,
          height: iconHeight,
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(6, 78, 59, 0.25)',
        }}
      >
        <svg
          viewBox="0 0 64 64"
          width={iconHeight}
          height={iconHeight}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="gs-full-bg" x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#0a121e" />
              <stop offset="50%" stop-color="#0d1b2a" />
              <stop offset="100%" stop-color="#050910" />
            </linearGradient>

            <linearGradient id="gs-full-border" x1="12" y1="6" x2="52" y2="58" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#34d399" />
              <stop offset="50%" stop-color="#06b6d4" />
              <stop offset="100%" stop-color="#10b981" />
            </linearGradient>

            <radialGradient id="gs-full-glow" cx="32" cy="28" r="22" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#10b981" stop-opacity="0.45" />
              <stop offset="60%" stop-color="#06b6d4" stop-opacity="0.15" />
              <stop offset="100%" stop-color="#06b6d4" stop-opacity="0" />
            </radialGradient>

            <linearGradient id="gs-full-check" x1="22" y1="20" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#a7f3d0" />
              <stop offset="50%" stop-color="#34d399" />
              <stop offset="100%" stop-color="#00e599" />
            </linearGradient>
          </defs>

          <circle cx="32" cy="30" r="22" fill="url(#gs-full-glow)" />

          <path
            d="M32 4L12 12V28C12 43 20.5 53.5 32 59C43.5 53.5 52 43 52 28V12L32 4Z"
            fill="url(#gs-full-bg)"
            stroke="url(#gs-full-border)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          <path
            d="M32 10L17 16V27C17 38.5 23.5 47 32 51.5C40.5 47 47 38.5 47 27V16L32 10Z"
            fill="#0f2027"
            fillOpacity="0.75"
            stroke="#1e3a47"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          <circle cx="32" cy="24" r="5" fill="#064e3b" stroke="#34d399" strokeWidth="1.5" />
          <circle cx="32" cy="24" r="2" fill="#34d399" />

          <path
            d="M23 33.5L28.5 39L41 24.5"
            stroke="url(#gs-full-check)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <polygon points="32,7 33,9.5 35.5,10.5 33,11.5 32,14 31,11.5 28.5,10.5 31,9.5" fill="#34d399" />
        </svg>
      </div>

      <div className="brand-text" style={{ display: 'flex', flexDirection: 'column' }}>
        <span className="brand-title" style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
          Grant<span style={{ color: 'var(--primary-accent)' }}>Shield</span>
        </span>
        {showBadge && (
          <span className="brand-network-badge">
            {variant === 'full' ? 'Midnight Preprod · ZK Verification' : 'Midnight Preprod'}
          </span>
        )}
      </div>
    </div>
  )
}
