import { test, expect } from '@playwright/test'

test.describe('AI Generated: Test admin can login and view dashboard', () => {
  test('should: Test admin can login and view dashboard', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.click('button:has-text("PIN")')
    await page.fill('[data-testid="email-input"]', 'manager@tiercoffee.com')
    await page.fill('[data-testid="pin-input"]', '1111')
    await page.click('[data-testid="login-button"]')
    await expect(page).toHaveURL('/dashboard')
    
    // Generated assertions
    // Page URL should be /dashboard
    // User should be logged in
    // Role-based elements should be visible
  })
})