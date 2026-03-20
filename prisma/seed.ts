import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"
import * as dotenv from "dotenv"
dotenv.config()

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Seeding Tier Coffee database...")

  // ═══════════════════════════════════════════
  // Branches
  // ═══════════════════════════════════════════
  const branch1 = await prisma.branch.upsert({
    where: { id: "branch-siam" },
    update: {},
    create: {
      id: "branch-siam",
      name: "Tier สยาม",
      type: "Branch",
      address: "สยามสแควร์ กรุงเทพฯ",
      phone: "02-xxx-xxxx",
      isActive: true,
    },
  })

  const branch2 = await prisma.branch.upsert({
    where: { id: "branch-thonglor" },
    update: {},
    create: {
      id: "branch-thonglor",
      name: "Tier ทองหล่อ",
      type: "Branch",
      address: "ทองหล่อ กรุงเทพฯ",
      phone: "02-xxx-xxxx",
      isActive: true,
    },
  })

  console.log("✅ Branches created:", branch1.name, branch2.name)

  // ═══════════════════════════════════════════
  // Shop Settings
  // ═══════════════════════════════════════════
  await prisma.shopSettings.upsert({
    where: { id: "shop-main" },
    update: {},
    create: {
      id: "shop-main",
      shopName: "Tier Coffee",
      address: "กรุงเทพมหานคร",
      phone: "02-xxx-xxxx",
      receiptHeader: "ขอบคุณที่ใช้บริการ Tier Coffee",
      receiptFooter: "พบกันใหม่ครั้งหน้า 😊",
    },
  })

  // ═══════════════════════════════════════════
  // Shift Configs
  // ═══════════════════════════════════════════
  await prisma.shiftConfig.upsert({
    where: { id: "shift-morning" },
    update: {},
    create: { id: "shift-morning", name: "เช้า", startTime: "08:00", endTime: "14:00" },
  })
  await prisma.shiftConfig.upsert({
    where: { id: "shift-afternoon" },
    update: {},
    create: { id: "shift-afternoon", name: "บ่าย", startTime: "14:00", endTime: "20:00" },
  })
  await prisma.shiftConfig.upsert({
    where: { id: "shift-evening" },
    update: {},
    create: { id: "shift-evening", name: "ค่ำ", startTime: "20:00", endTime: "24:00" },
  })

  // ═══════════════════════════════════════════
  // Payment Channels
  // ═══════════════════════════════════════════
  const cashChannel = await prisma.paymentChannel.upsert({
    where: { id: "channel-cash" },
    update: {},
    create: {
      id: "channel-cash",
      name: "เงินสด",
      type: "INSTANT",
      gpPercent: 0,
      feePercent: 0,
      settlementDays: 0,
      isActive: true,
    },
  })

  const transferChannel = await prisma.paymentChannel.upsert({
    where: { id: "channel-transfer" },
    update: {},
    create: {
      id: "channel-transfer",
      name: "โอนเงิน",
      type: "INSTANT",
      gpPercent: 0,
      feePercent: 0,
      settlementDays: 0,
      isActive: true,
    },
  })

  await prisma.paymentChannel.upsert({
    where: { id: "channel-grab" },
    update: {},
    create: {
      id: "channel-grab",
      name: "Grab Food",
      type: "DEFERRED",
      gpPercent: 30,
      feePercent: 0,
      settlementDays: 7,
      isActive: true,
    },
  })

  await prisma.paymentChannel.upsert({
    where: { id: "channel-lineman" },
    update: {},
    create: {
      id: "channel-lineman",
      name: "LINE MAN",
      type: "DEFERRED",
      gpPercent: 30,
      feePercent: 0,
      settlementDays: 7,
      isActive: true,
    },
  })

  await prisma.paymentChannel.upsert({
    where: { id: "channel-robinhood" },
    update: {},
    create: {
      id: "channel-robinhood",
      name: "Robinhood",
      type: "DEFERRED",
      gpPercent: 0,
      feePercent: 0,
      settlementDays: 3,
      isActive: true,
    },
  })

  console.log("✅ Payment channels created")

  // ═══════════════════════════════════════════
  // Employees
  // ═══════════════════════════════════════════
  const adminEmployee = await prisma.employee.upsert({
    where: { id: "emp-admin" },
    update: {},
    create: {
      id: "emp-admin",
      branchId: branch1.id,
      name: "Admin Tier",
      position: "ผู้จัดการระบบ",
      hourlyRate: 100,
      startDate: new Date("2024-01-01"),
      isActive: true,
    },
  })

  const managerEmployee = await prisma.employee.upsert({
    where: { id: "emp-manager" },
    update: {},
    create: {
      id: "emp-manager",
      branchId: branch1.id,
      name: "ผู้จัดการสาขา",
      position: "ผู้จัดการ",
      hourlyRate: 80,
      startDate: new Date("2024-01-01"),
      isActive: true,
    },
  })

  const staffEmployee = await prisma.employee.upsert({
    where: { id: "emp-staff" },
    update: {},
    create: {
      id: "emp-staff",
      branchId: branch1.id,
      name: "พนักงาน",
      position: "บาริสต้า",
      hourlyRate: 60,
      startDate: new Date("2024-01-01"),
      isActive: true,
    },
  })

  console.log("✅ Employees created")

  // ═══════════════════════════════════════════
  // Users (PIN: admin=0000, manager=1111, staff=2222)
  // ═══════════════════════════════════════════
  const adminHash = await bcrypt.hash("0000", 10)
  const managerHash = await bcrypt.hash("1111", 10)
  const staffHash = await bcrypt.hash("2222", 10)

  await prisma.user.upsert({
    where: { email: "admin@tiercoffee.com" },
    update: {},
    create: {
      email: "admin@tiercoffee.com",
      passwordHash: adminHash,
      role: "ADMIN",
      employeeId: adminEmployee.id,
    },
  })

  await prisma.user.upsert({
    where: { email: "manager@tiercoffee.com" },
    update: {},
    create: {
      email: "manager@tiercoffee.com",
      passwordHash: managerHash,
      role: "MANAGER",
      employeeId: managerEmployee.id,
    },
  })

  await prisma.user.upsert({
    where: { email: "staff@tiercoffee.com" },
    update: {},
    create: {
      email: "staff@tiercoffee.com",
      passwordHash: staffHash,
      role: "STAFF",
      employeeId: staffEmployee.id,
    },
  })

  console.log("✅ Users created (admin/0000, manager/1111, staff/2222)")

  // ═══════════════════════════════════════════
  // Menu Categories
  // ═══════════════════════════════════════════
  const catCoffee = await prisma.category.upsert({
    where: { id: "cat-coffee" },
    update: {},
    create: { id: "cat-coffee", name: "กาแฟ", sortOrder: 1 },
  })

  const catTea = await prisma.category.upsert({
    where: { id: "cat-tea" },
    update: {},
    create: { id: "cat-tea", name: "ชา", sortOrder: 2 },
  })

  const catSmoothie = await prisma.category.upsert({
    where: { id: "cat-smoothie" },
    update: {},
    create: { id: "cat-smoothie", name: "สมูทตี้", sortOrder: 3 },
  })

  const catFood = await prisma.category.upsert({
    where: { id: "cat-food" },
    update: {},
    create: { id: "cat-food", name: "อาหาร", sortOrder: 4 },
  })

  console.log("✅ Categories created")

  // ═══════════════════════════════════════════
  // NOTE: Ingredients and Menu Items removed from seed
  // Users should add these through the UI for full editability
  // ═══════════════════════════════════════════
  console.log("ℹ️  Ingredients and Menu Items should be added via UI")

  // ═══════════════════════════════════════════
  // Expense Categories
  // ═══════════════════════════════════════════
  await prisma.expenseCategory.upsert({
    where: { id: "expcat-ingredients" },
    update: {},
    create: { id: "expcat-ingredients", name: "วัตถุดิบ" },
  })
  await prisma.expenseCategory.upsert({
    where: { id: "expcat-salary" },
    update: {},
    create: { id: "expcat-salary", name: "เงินเดือน" },
  })
  await prisma.expenseCategory.upsert({
    where: { id: "expcat-utilities" },
    update: {},
    create: { id: "expcat-utilities", name: "ค่าสาธารณูปโภค" },
  })
  await prisma.expenseCategory.upsert({
    where: { id: "expcat-rent" },
    update: {},
    create: { id: "expcat-rent", name: "ค่าเช่า" },
  })
  await prisma.expenseCategory.upsert({
    where: { id: "expcat-other" },
    update: {},
    create: { id: "expcat-other", name: "อื่นๆ" },
  })

  console.log("✅ Expense categories created")
  console.log("")
  console.log("🎉 Seed completed successfully!")
  console.log("")
  console.log("📋 Test accounts:")
  console.log("  Admin:   admin@tiercoffee.com   / PIN: 0000")
  console.log("  Manager: manager@tiercoffee.com / PIN: 1111")
  console.log("  Staff:   staff@tiercoffee.com   / PIN: 2222")
  console.log("")

  void cashChannel
  void transferChannel
  void catSmoothie
  void catFood
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
