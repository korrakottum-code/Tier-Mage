import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should login as ADMIN', async ({ page }) => {
    await page.goto('/login')
    
    // Switch to PIN mode
    await page.click('button:has-text("PIN")')
    
    // Fill login form
    await page.fill('[data-testid="email-input"]', 'admin@tiercoffee.com')
    await page.fill('[data-testid="pin-input"]', '0000')
    
    // Submit form
    await page.click('[data-testid="login-button"]')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('h1')).toContainText('Dashboard')
    
    // Check ADMIN role indicators
    await expect(page.getByRole('link', { name: 'ตั้งค่า' }).first()).toBeVisible()
  })

  test('should login as MANAGER', async ({ page }) => {
    await page.goto('/login')
    
    await page.click('button:has-text("PIN")')
    await page.fill('[data-testid="email-input"]', 'manager@tiercoffee.com')
    await page.fill('[data-testid="pin-input"]', '1111')
    await page.click('[data-testid="login-button"]')
    
    await expect(page).toHaveURL('/dashboard')
    
    // Manager can access most pages but not Settings
    await expect(page.getByRole('link', { name: 'ตั้งค่า' })).not.toBeVisible()
    await page.goto('/settings')
    await expect(page).toHaveURL('/dashboard') // Redirected
  })

  test('should login as STAFF', async ({ page }) => {
    await page.goto('/login')
    
    await page.click('button:has-text("PIN")')
    await page.fill('[data-testid="email-input"]', 'staff@tiercoffee.com')
    await page.fill('[data-testid="pin-input"]', '2222')
    await page.click('[data-testid="login-button"]')
    
    await expect(page).toHaveURL('/dashboard')
    
    // Staff limited access
    await expect(page.getByRole('link', { name: 'ตั้งค่า' })).not.toBeVisible()
    await page.goto('/employees')
    await expect(page).toHaveURL('/dashboard') // Redirected
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    
    await page.click('button:has-text("PIN")')
    await page.fill('[data-testid="email-input"]', 'invalid@test.com')
    await page.fill('[data-testid="pin-input"]', '9999')
    await page.click('[data-testid="login-button"]')
    
    // Should stay on login page with error
    await expect(page).toHaveURL('/login')
    await expect(page.locator('text=อีเมล / PIN ไม่ถูกต้อง')).toBeVisible()
  })
})
