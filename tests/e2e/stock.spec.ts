import { test, expect } from '@playwright/test'

test.describe('Stock Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as MANAGER
    await page.goto('/login')
    await page.click('button:has-text("PIN")')
    await page.fill('[data-testid="email-input"]', 'manager@tiercoffee.com')
    await page.fill('[data-testid="pin-input"]', '1111')
    await page.click('[data-testid="login-button"]')
    await expect(page).toHaveURL('/dashboard')
  })

  test('should perform batch stock count', async ({ page }) => {
    await page.goto('/stock')
    
    // Select count tab
    await page.click('button:has-text("นับสต็อก")')
    
    // Wait for the daily tab to be visible
    await page.waitForSelector('text=รายวัน (Daily)')
    
    // Find the first input number in the list and change it
    const inputs = page.locator('input[type="number"]')
    await inputs.first().waitFor({ state: 'visible' })
    await inputs.first().fill('150')
    
    // Click confirm button in the bottom floating bar
    const confirmButton = page.locator('button:has-text("ยืนยันการนับ")').first()
    await expect(confirmButton).toBeEnabled({ timeout: 5000 })
    await confirmButton.click()
    
    // Wait for the dialog to appear
    await page.waitForSelector('text=ยืนยันการบันทึกสต็อก')
    
    // Click the actual save button in dialog
    const saveButton = page.locator('button:has-text("ยืนยันการบันทึก")')
    await saveButton.click()
    
    // Toast should appear
    await expect(page.locator('text=บันทึกการนับสต็อก').first()).toBeVisible({ timeout: 10000 })
  })

  test('should add stock movement', async ({ page }) => {
    await page.goto('/stock')
    
    // Go to movements tab
    await page.locator('button:has-text("การเคลื่อนไหว")').first().click()
    
    // Wait for the tab to switch
    await page.waitForSelector('text=บันทึกการเคลื่อนไหวสต็อก')
    
    // Click add movement button
    await page.locator('button:has-text("บันทึกการเคลื่อนไหว")').first().click()
    
    // Wait for the form to appear
    await page.waitForSelector('text=บันทึกการเคลื่อนไหวสต็อก')
    
    // react-select input
    await page.locator('.css-1wy0on6').first().click()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    
    // Type is a native select
    await page.locator('select').first().selectOption({ value: 'PURCHASE' })
    
    // Fill quantity and cost
    await page.locator('input[placeholder="0.00"]').nth(0).fill('50') // Qty
    await page.locator('input[placeholder="0.00"]').nth(1).fill('25') // Cost
    
    // Wait for the button to be enabled
    const saveButton = page.locator('button:has-text("บันทึกรายการ")')
    await expect(saveButton).toBeEnabled()
    await saveButton.click()
    
    // Verify form closed
    await expect(page.locator('text=บันทึกรายการ').first()).not.toBeVisible({ timeout: 10000 })
  })
})