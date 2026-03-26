import { config } from 'dotenv'
config({ path: '.env' })
config({ path: '.env.local' })

import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { PrismaClient } from "@prisma/client"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool as any)
const prisma = new PrismaClient({ adapter })

async function main() {
  const branches = await prisma.branch.findMany({ select: { id: true, name: true, isActive: true }})
  console.log("Found branches:")
  
  let inactiveCount = 0;
  for (const b of branches) {
     const empCount = await prisma.employee.count({ where: { branchId: b.id }})
     const orderCount = await prisma.order.count({ where: { branchId: b.id }})
     console.log(`- ${b.name} (Active: ${b.isActive}) | Employees: ${empCount} | Orders: ${orderCount}`)
     
     if (b.isActive && empCount === 0 && orderCount === 0 && (b.name.includes("3") || b.name.includes("4") || b.name.includes("สาขา 3") || b.name.includes("สาขา 4"))) {
         await prisma.branch.update({ where: { id: b.id }, data: { isActive: false } })
         console.log(`  -> Deactivated ${b.name} (No employees or orders)`)
         inactiveCount++;
     }
  }
  
  if (inactiveCount === 0) {
      console.log("No extraneous seed branches deactivated.")
  }
}

main().catch(console.error).finally(() => process.exit(0))
