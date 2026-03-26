import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const action = searchParams.get("action")

  if (action === "backup") {
    // Master data
    const [
      branches, users, employees, categories, menuItems, recipes, menuOptions,
      ingredients, suppliers, paymentChannels, channelFees, expenseCategories,
      shopSettings, shiftConfigs, branchMenuOverrides,
    ] = await Promise.all([
      prisma.branch.findMany(),
      prisma.user.findMany({ select: { id: true, email: true, role: true, employeeId: true, createdAt: true } }),
      prisma.employee.findMany(),
      prisma.category.findMany({ where: { isArchived: false } }),
      prisma.menuItem.findMany({ where: { isArchived: false } }),
      prisma.recipe.findMany(),
      prisma.menuOption.findMany(),
      prisma.ingredient.findMany(),
      prisma.supplier.findMany(),
      prisma.paymentChannel.findMany(),
      prisma.channelFee.findMany(),
      prisma.expenseCategory.findMany(),
      prisma.shopSettings.findMany(),
      prisma.shiftConfig.findMany(),
      prisma.branchMenuOverride.findMany(),
    ])

    // Transactional data
    const [
      orders, orderItems, payments, settlements, stockMovements,
      stockCounts, stockAdjustments, shiftClosings, slipUploads,
      transactions, tickets, attendance, schedules, payrolls,
    ] = await Promise.all([
      prisma.order.findMany(),
      prisma.orderItem.findMany(),
      prisma.payment.findMany(),
      prisma.settlement.findMany(),
      prisma.stockMovement.findMany(),
      prisma.stockCount.findMany(),
      prisma.stockAdjustment.findMany(),
      prisma.shiftClosing.findMany(),
      prisma.slipUpload.findMany({ select: { id: true, shiftClosingId: true, channelId: true, fileName: true, fileSize: true, amount: true, uploadedById: true, uploadedAt: true } }),
      prisma.transaction.findMany(),
      prisma.ticket.findMany(),
      prisma.attendance.findMany(),
      prisma.schedule.findMany(),
      prisma.payroll.findMany(),
    ])

    const backup = {
      version: "3.1",
      exportedAt: new Date().toISOString(),
      data: {
        // Master
        branches, users, employees, categories, menuItems, recipes, menuOptions,
        ingredients, suppliers, paymentChannels, channelFees, expenseCategories,
        shopSettings, shiftConfigs, branchMenuOverrides,
        // Transactions
        orders, orderItems, payments, settlements, stockMovements,
        stockCounts, stockAdjustments, shiftClosings, slipUploads,
        transactions, tickets, attendance, schedules, payrolls,
      },
    }

    return NextResponse.json(backup)
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const { action } = body

  if (action === "reset") {
    const { scope, confirmCode } = body
    if (confirmCode !== "RESET-TIER-COFFEE") {
      return NextResponse.json({ error: "Invalid confirmation code" }, { status: 400 })
    }

    const deletable = scope ?? "transactions"

    if (deletable === "transactions") {
      await prisma.$transaction([
        prisma.settlementFee.deleteMany(),
        prisma.settlement.deleteMany(),
        prisma.slipUpload.deleteMany(),
        prisma.shiftClosing.deleteMany(),
        prisma.stockAdjustment.deleteMany(),
        prisma.stockCount.deleteMany(),
        prisma.stockMovement.deleteMany(),
        prisma.orderItem.deleteMany(),
        prisma.payment.deleteMany(),
        prisma.order.deleteMany(),
        prisma.transaction.deleteMany(),
        prisma.attendance.deleteMany(),
        prisma.payroll.deleteMany(),
      ])
      return NextResponse.json({ ok: true, message: "Transaction data reset successfully" })
    }

    if (deletable === "all") {
      await prisma.$transaction([
        prisma.settlementFee.deleteMany(),
        prisma.settlement.deleteMany(),
        prisma.slipUpload.deleteMany(),
        prisma.shiftClosing.deleteMany(),
        prisma.stockAdjustment.deleteMany(),
        prisma.stockCount.deleteMany(),
        prisma.stockMovement.deleteMany(),
        prisma.orderItem.deleteMany(),
        prisma.payment.deleteMany(),
        prisma.order.deleteMany(),
        prisma.transaction.deleteMany(),
        prisma.attendance.deleteMany(),
        prisma.schedule.deleteMany(),
        prisma.payroll.deleteMany(),
        prisma.ticket.deleteMany(),
        prisma.channelFee.deleteMany(),
        prisma.branchMenuOverride.deleteMany(),
        prisma.recipe.deleteMany(),
        prisma.menuOption.deleteMany(),
        prisma.menuItem.deleteMany(),
        prisma.category.deleteMany(),
        prisma.ingredient.deleteMany(),
        prisma.supplier.deleteMany(),
        prisma.expenseCategory.deleteMany(),
        prisma.shiftConfig.deleteMany(),
        prisma.paymentChannel.deleteMany(),
      ])
      return NextResponse.json({ ok: true, message: "All data reset successfully (users & branches kept)" })
    }

    return NextResponse.json({ error: "Invalid scope" }, { status: 400 })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
