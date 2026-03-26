const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
prisma.branch.findMany().then(b => {
  console.log(JSON.stringify(b, null, 2))
}).catch(console.error).finally(() => process.exit(0))
