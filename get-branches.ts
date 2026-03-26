import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const branches = await prisma.branch.findMany({ select: { id: true, name: true, isActive: true }})
  console.log("Branches:", branches)
}

main()
  .catch(console.error)
  .finally(() => process.exit(0))
