#!/usr/bin/env node

/**
 * AI Test Data Generator - Generate realistic test data for Tier Coffee
 * Creates orders, stock movements, and other test scenarios
 */

import * as dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

import { prisma } from '../lib/prisma'

// AI-generated realistic test scenarios
const testScenarios = {
  busyDay: {
    orders: 50,
    peakHours: [8, 9, 12, 13, 18, 19],
    popularItems: ['อเมริกาโน', 'ลาเต้', 'คาปูชิโน'],
    paymentMethods: ['cash', 'promptpay', 'transfer']
  },
  stockIssues: {
    lowStockItems: ['coffee-beans', 'milk', 'sugar'],
    wasteReasons: ['expired', 'spilled', 'tasting'],
    countDiscrepancies: true
  },
  employeeScenarios: {
    attendance: ['on-time', 'late', 'absent'],
    overtime: true,
    shiftChanges: true
  }
}

async function generateBusyDayData() {
  console.log('🔄 Generating busy day test data...')
  
  const branches = await prisma.branch.findMany()
  const employees = await prisma.employee.findMany()
  const menuItems = await prisma.menuItem.findMany()
  const paymentChannels = await prisma.paymentChannel.findMany()

  if (!branches.length || !employees.length || !menuItems.length || !paymentChannels.length) {
    console.error('❌ Please run database seed first. Missing basic data.')
    return
  }

  const today = new Date()
  const { orders, peakHours } = testScenarios.busyDay
  
  for (let i = 0; i < orders; i++) {
    const hour = peakHours[Math.floor(Math.random() * peakHours.length)]
    const minute = Math.floor(Math.random() * 60)
    const orderTime = new Date(today)
    orderTime.setHours(hour, minute, 0, 0)
    
    const branch = branches[Math.floor(Math.random() * branches.length)]
    const employee = employees[Math.floor(Math.random() * employees.length)]
    const paymentChannel = paymentChannels[Math.floor(Math.random() * paymentChannels.length)]
    
    // Select 1-2 random items
    const selectedItems = []
    const numItems = Math.floor(Math.random() * 2) + 1
    for (let j = 0; j < numItems; j++) {
      selectedItems.push(menuItems[Math.floor(Math.random() * menuItems.length)])
    }

    const total = selectedItems.reduce((sum, item) => sum + Number(item.price), 0)

    // Create realistic order
    const order = await prisma.order.create({
      data: {
        branchId: branch.id,
        employeeId: employee.id,
        orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        source: 'WALK_IN',
        status: 'COMPLETED',
        subtotal: total,
        total: total,
        createdAt: orderTime,
        items: {
          create: selectedItems.map(item => ({
            menuItemId: item.id,
            quantity: 1,
            unitPrice: item.price,
            lineTotal: item.price,
          }))
        },
        payment: {
          create: {
            channelId: paymentChannel.id,
            amount: total,
            createdAt: orderTime,
          }
        }
      }
    })
    
    // Create settlement
    await prisma.settlement.create({
      data: {
        branchId: branch.id,
        channelId: paymentChannel.id,
        saleDate: orderTime,
        saleAmount: total,
        expectedAmount: total,
        actualAmount: total,
        status: 'MATCHED',
        settledAt: orderTime,
      }
    })
  }
  
  console.log(`✅ Generated ${orders} orders for busy day scenario`)
}

async function generateStockIssues() {
  console.log('🔄 Generating stock issue scenarios...')
  
  const ingredients = await prisma.ingredient.findMany()
  const branches = await prisma.branch.findMany()
  const employees = await prisma.employee.findMany()

  if (!ingredients.length || !branches.length || !employees.length) return

  const { wasteReasons, countDiscrepancies } = testScenarios.stockIssues
  
  // Pick up to 3 random ingredients
  const lowStockItems = ingredients.slice(0, 3)
  const branch = branches[0]
  const employee = employees[0]

    // Generate stock movements
  for (const item of lowStockItems) {
    // Purchase
    await prisma.stockMovement.create({
      data: {
        ingredientId: item.id,
        type: 'PURCHASE',
        quantity: 100,
        cost: 25,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      }
    })
    
    // Sales (deplete stock)
    await prisma.stockMovement.createMany({
      data: Array.from({ length: 20 }, () => ({
        ingredientId: item.id,
        type: 'SALE',
        quantity: Math.random() * 5 + 1,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      }))
    })
    
    // Waste
    await prisma.stockMovement.create({
      data: {
        ingredientId: item.id,
        type: 'WASTE',
        quantity: Math.random() * 10 + 1,
        reason: wasteReasons[Math.floor(Math.random() * wasteReasons.length)],
        createdAt: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000),
      }
    })
  }
  
  // Generate stock counts with discrepancies
  if (countDiscrepancies) {
    for (const item of lowStockItems) {
      const discrepancy = Math.random() > 0.5 ? 5 : -5
      await prisma.stockCount.create({
        data: {
          branchId: branch.id,
          countedById: employee.id,
          ingredientId: item.id,
          systemQty: 50,
          countedQty: 50 + discrepancy,
          difference: discrepancy,
          diffPercent: (discrepancy / 50) * 100,
          tier: 'REASON',
          reason: discrepancy > 0 ? 'UNRECORDED_WASTE' : 'TASTING_FREE',
          createdAt: new Date(),
        }
      })
    }
  }
  
  console.log(`✅ Generated stock issues for ${lowStockItems.length} items`)
}

async function generateEmployeeScenarios() {
  console.log('🔄 Generating employee test scenarios...')
  
  const { attendance, overtime, shiftChanges } = testScenarios.employeeScenarios
  
  // Create test employees if not exists
  const employees = await prisma.employee.findMany({ take: 3 })
  
  for (let day = 0; day < 7; day++) {
    const workDate = new Date()
    workDate.setDate(workDate.getDate() - day)
    workDate.setHours(0, 0, 0, 0)
    
    for (const employee of employees) {
      const attendanceType = attendance[Math.floor(Math.random() * attendance.length)]
      
      if (attendanceType === 'absent') {
        await prisma.attendance.create({
          data: {
            employeeId: employee.id,
            workDate,
            status: 'ABSENT',
            hoursWorked: 0,
            overtimeHours: 0,
          }
        })
      } else {
        const clockInHour = attendanceType === 'late' ? 9 : 8
        const clockIn = new Date(workDate)
        clockIn.setHours(clockInHour + Math.random(), 0, 0, 0)
        
        const clockOut = new Date(clockIn)
        clockOut.setHours(clockIn.getHours() + 8 + (overtime ? Math.random() * 2 : 0))
        
        await prisma.attendance.create({
          data: {
            employeeId: employee.id,
            workDate,
            clockIn,
            clockOut,
            status: attendanceType === 'late' ? 'LATE' : 'PRESENT',
            hoursWorked: (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60),
            overtimeHours: overtime ? Math.random() * 2 : 0,
          }
        })
      }
      
      // Generate schedule
      if (shiftChanges) {
        const shiftTypes: Array<'MORNING' | 'AFTERNOON' | 'EVENING'> = ['MORNING', 'AFTERNOON', 'EVENING']
        await prisma.schedule.create({
          data: {
            employeeId: employee.id,
            workDate,
            shift: shiftTypes[Math.floor(Math.random() * 3)],
          }
        })
      }
    }
  }
  
  console.log(`✅ Generated employee scenarios for ${employees.length} employees`)
}

async function main() {
  console.log('🤖 AI Test Data Generator for Tier Coffee')
  console.log('=====================================')
  
  try {
    await generateBusyDayData()
    await generateStockIssues()
    await generateEmployeeScenarios()
    
    console.log('\n✅ All test data generated successfully!')
    console.log('🎯 Ready for comprehensive testing')
    
  } catch (error) {
    console.error('❌ Error generating test data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main()
}
