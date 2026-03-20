#!/usr/bin/env node

/**
 * AI Test Generator - Generate E2E tests from natural language descriptions
 * Usage: node scripts/generate-tests.ts "Test user can create order and pay with cash"
 */

import fs from 'fs'
import path from 'path'

const testPrompt = process.argv[2]
if (!testPrompt) {
  console.error('Please provide a test description')
  process.exit(1)
}

// AI-powered test generation patterns
const patterns = {
  login: {
    steps: [
      'Navigate to /login',
      'Fill email input',
      'Fill PIN input', 
      'Click submit button',
      'Expect redirect to /dashboard'
    ],
    assertions: [
      'Page URL should be /dashboard',
      'User should be logged in',
      'Role-based elements should be visible'
    ]
  },
  createOrder: {
    steps: [
      'Navigate to /pos',
      'Wait for menu items to load',
      'Click menu item',
      'Add to cart',
      'Select payment method',
      'Click checkout button'
    ],
    assertions: [
      'Order should be created',
      'Stock should be deducted',
      'Settlement should be created'
    ]
  },
  stockCount: {
    steps: [
      'Navigate to /stock',
      'Click count button',
      'Select ingredient',
      'Enter actual quantity',
      'Select count tier',
      'Submit form'
    ],
    assertions: [
      'Stock count should be recorded',
      'Movement should be created',
      'Alerts should update'
    ]
  }
}

function generateTest(description: string) {
  const keywords = description.toLowerCase()
  let testType = 'general'
  
  if (keywords.includes('login') || keywords.includes('auth')) testType = 'login'
  else if (keywords.includes('order') || keywords.includes('pos')) testType = 'login'
  else if (keywords.includes('stock') || keywords.includes('count')) testType = 'stockCount'
  
  const pattern = patterns[testType as keyof typeof patterns]
  
  return `
import { test, expect } from '@playwright/test'

test.describe('AI Generated: ${description}', () => {
  test('should: ${description}', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[name="email"]', 'manager@tiercoffee.com')
    await page.fill('input[name="pin"]', '1111')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')
    
    // Generated steps
${pattern.steps.map(step => `    await ${step}`).join('\n')}
    
    // Generated assertions
${pattern.assertions.map(assertion => `    // ${assertion}`).join('\n')}
  })
})
`.trim()
}

const testCode = generateTest(testPrompt)
const fileName = testPrompt.toLowerCase().replace(/[^a-z0-9]/g, '-') + '.spec.ts'
const filePath = path.join(process.cwd(), 'tests', 'e2e', fileName)

fs.writeFileSync(filePath, testCode)
console.log(`✅ Generated test: ${filePath}`)
console.log(`📝 Test code:\n${testCode}`)
