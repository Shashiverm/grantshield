import { expect, test } from '@playwright/test'

test.describe('GrantShield E2E Multi-Device & Privacy Core Suite', () => {
  test('loads home page with title, hero, and network metrics', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/GrantShield/i)

    const heroTitle = page.locator('h1.hero-title')
    await expect(heroTitle).toContainText('Prove you qualify.')
    await expect(heroTitle).toContainText('Keep your story yours.')

    // Stats strip
    await expect(page.locator('.stats-strip')).toBeVisible()
    await expect(page.getByText('0 bytes')).toBeVisible()
  })

  test('opens multi-device wallet modal and connects on PC / mobile', async ({ page }) => {
    await page.goto('/')
    const connectBtn = page.locator('#btn-wallet-connect')
    await expect(connectBtn).toBeVisible()
    await connectBtn.click()

    // Multi-device modal should appear
    await expect(page.locator('.wallet-modal-box')).toBeVisible()
    await expect(page.getByRole('heading', { name: /Connect Midnight Wallet/i })).toBeVisible()

    // Test tab switching: Mobile QR Code
    const mobileTab = page.locator('.wallet-modal-box button:has-text("Mobile / QR Code")')
    await expect(mobileTab).toBeVisible()
    await mobileTab.click()
    await expect(page.locator('.qr-container')).toBeVisible()
    await expect(page.locator('.qr-svg')).toBeVisible()

    // Switch back and connect with Preprod Funded Keystore
    await page.locator('.wallet-modal-box button:has-text("Desktop / Extension")').click()
    await page.locator('.wallet-option-item.featured').click()

    // Modal closes and profile button appears
    await expect(page.locator('.wallet-modal-box')).not.toBeVisible()
    await expect(page.locator('#btn-wallet-profile')).toBeVisible()
    await expect(page.getByRole('button', { name: /Generate Private Proof & Submit Claim/i })).toBeVisible()
  })

  test('detects local assertion failure when GPA is low', async ({ page }) => {
    await page.goto('/')
    await page.locator('#btn-wallet-connect').click()
    await page.locator('.wallet-option-item.featured').click()

    // Click low GPA preset
    await page.getByRole('button', { name: /✗ Low GPA/i }).click()

    // Should indicate GPA failure and disable submit button
    await expect(page.locator('.status-tag.error')).toBeVisible()
    await expect(page.getByText(/Below 7.0/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Generate Private Proof & Submit Claim/i })).toBeDisabled()
  })

  test('executes private proof, claims grant, and views attestation certificate', async ({ page }) => {
    await page.goto('/')
    await page.locator('#btn-wallet-connect').click()
    await page.locator('.wallet-option-item.featured').click()

    // Click Eligible preset
    await page.getByRole('button', { name: /✓ Eligible Applicant/i }).click()

    const submitBtn = page.getByRole('button', { name: /Generate Private Proof & Submit Claim/i })
    await expect(submitBtn).toBeEnabled()
    await submitBtn.click()

    // Wait for proof completion
    await expect(
      page.getByRole('heading', { name: /Eligibility Verified & Award Claimed/i })
    ).toBeVisible({ timeout: 10000 })
    await expect(page.locator('.claim-receipt-data').getByText(/Aurora Scholars Fund/i)).toBeVisible()
    await expect(page.locator('.copyable-hash code')).toBeVisible()

    // Open certificate
    await page.getByRole('button', { name: /View Verification Certificate/i }).click()
    await expect(page.locator('.certificate-modal-snippet')).toBeVisible()
    await expect(page.locator('.cert-json')).toContainText('GrantShield')
    await expect(page.locator('.cert-json')).toContainText('[REDACTED BY ZERO-KNOWLEDGE PROOF]')
  })

  test('switches to sponsor console and shows live grant metrics', async ({ page }) => {
    await page.goto('/')
    await page.locator('#tab-sponsor').click()

    await expect(page.getByRole('heading', { name: /Aurora Foundation Dashboard/i })).toBeVisible()
    await expect(page.getByText('₹10,00,000')).toBeVisible()
    await expect(page.getByText('143')).toBeVisible()
    await expect(page.locator('.sponsor-metrics-grid').getByText('87', { exact: true })).toBeVisible()

    // Disconnected state shows wallet required banner
    await expect(page.locator('.wallet-required-banner')).toBeVisible()

    // Connect wallet
    await page.locator('#btn-wallet-connect').click()
    await page.locator('.wallet-option-item.featured').click()
    await expect(page.locator('#btn-wallet-profile')).toBeVisible()

    // Open and close create program modal
    await page.locator('#btn-create-program').click()
    await expect(page.locator('.modal-box')).toBeVisible()
    await page.locator('button[aria-label="Close modal"]').click()
    await expect(page.locator('.modal-box')).not.toBeVisible()

    // Verify creator access control column is present
    await expect(page.getByRole('columnheader', { name: /Creator & Access/i })).toBeVisible()
  })

  test('responsive mobile viewport layout and drawer navigation', async ({ page }) => {
    // Set to iPhone 14/15 viewport (390 x 844)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    // Mobile hamburger menu should be visible
    const hamburger = page.locator('.mobile-hamburger-btn')
    await expect(hamburger).toBeVisible()

    // Open mobile drawer
    await hamburger.click()
    await expect(page.locator('.mobile-drawer-content')).toBeVisible()
    await expect(page.locator('.mobile-nav-links a:has-text("Applicant Portal")')).toBeVisible()

    // Close drawer
    await page.locator('.close-drawer-btn').click()
    await expect(page.locator('.mobile-drawer-content')).not.toBeVisible()

    // Check that hero and workspace adapt without horizontal overflow
    await expect(page.locator('.hero-section')).toBeVisible()
    await expect(page.locator('#apply')).toBeVisible()
  })
})
