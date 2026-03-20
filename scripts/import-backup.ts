import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables from .env or .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') })
}

// สร้าง Prisma client พิเศษสำหรับ Script นี้โดยไม่ใช้ globalForPrisma เพราะเป็น standalone script
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('--- เริ่มการนำเข้าข้อมูล Backup ---')
  
  const backupFile = path.resolve('c:/Dev by Tum/Tier Mage/File/tier_backup_2026-03-19.json')
  const menuCsvFile = path.resolve('c:/Dev by Tum/Tier Mage/File/เมนู.csv')
  
  if (!fs.existsSync(backupFile)) {
    console.error('ไม่พบไฟล์ Backup JSON:', backupFile)
    return
  }

  const rawData = fs.readFileSync(backupFile, 'utf8')
  const json = JSON.parse(rawData)
  const data = json.data

  console.log(`\n[1] เตรียมข้อมูลสาขา... (${data.locations.length} สาขา)`)
  const branchMap: Record<string, string> = {}
  
  for (const loc of data.locations) {
    if (!loc.name) continue
    
    let branch = await prisma.branch.findFirst({ where: { name: loc.name } })
    if (!branch) {
      branch = await prisma.branch.create({
        data: {
          name: loc.name,
          type: loc.type === 'Warehouse' ? 'Warehouse' : 'Branch',
          isActive: true
        }
      })
      console.log(`สร้างสาขาใหม่: ${loc.name}`)
    }
    branchMap[loc.id] = branch.id
  }

  console.log(`\n[2] เตรียมข้อมูลวัตถุดิบ (Stock)... (${data.products.length} รายการ)`)
  const allBranches = Object.values(branchMap)
  const uniqueBranches = Array.from(new Set(allBranches))

  let importedIngCount = 0
  for (const prod of data.products) {
    if (!prod.name || !prod.unit) continue

    for (const branchId of uniqueBranches) {
      const existing = await prisma.ingredient.findFirst({
        where: { name: prod.name, branchId }
      })

      if (!existing) {
        await prisma.ingredient.create({
          data: {
            name: prod.name,
            unit: prod.unit,
            branchId,
            costPerUnit: prod.standardCost || 0,
            checkFrequency: prod.checkFrequency || 'Daily',
            minQty: prod.minStock || 0,
            currentQty: 0,
            autoThreshold: 5,
            warnThreshold: 20
          }
        })
        importedIngCount++
      } else {
        await prisma.ingredient.update({
          where: { id: existing.id },
          data: {
            checkFrequency: prod.checkFrequency || existing.checkFrequency
          }
        })
      }
    }
  }
  console.log(`เพิ่มข้อมูลวัตถุดิบสำเร็จ ${importedIngCount} รายการ/สาขา`)

  console.log(`\n[3] นำเข้าข้อมูลเมนูจากไฟล์ CSV...`)
  if (!fs.existsSync(menuCsvFile)) {
    console.warn('ไม่พบไฟล์ เมนู.csv ข้ามการนำเข้าเมนู')
  } else {
    const csvContent = fs.readFileSync(menuCsvFile, 'utf8')
    const lines = csvContent.split('\n')
    
    let importedMenuCount = 0
    let currentCategory = null
    
    // ข้าม 2 บรรทัดแรกที่เป็น Header คำอธิบายของ Grab
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      const cols = line.split(',')
      if (cols.length < 4) continue
      
      // ลบ quote ออกถ้ามี
      const cleanCol = (col: string) => col.replace(/^"(.*)"$/, '$1').trim()
      
      const itemName = cleanCol(cols[1])
      const priceStr = cleanCol(cols[2])
      const categoryName = cleanCol(cols[3])
      const imageUrl = cols.length > 7 ? cleanCol(cols[7]) : null
      
      if (!itemName || isNaN(parseFloat(priceStr))) continue
      const price = parseFloat(priceStr)
      
      // จัดการหมวดหมู่
      if (categoryName) {
        currentCategory = await prisma.category.findFirst({ where: { name: categoryName } })
        if (!currentCategory) {
          currentCategory = await prisma.category.create({ data: { name: categoryName, sortOrder: 0 } })
        }
      }

      if (!currentCategory) continue

      // สร้างเมนู
      const existingMenu = await prisma.menuItem.findFirst({ where: { name: itemName } })
      if (!existingMenu) {
        await prisma.menuItem.create({
          data: {
            name: itemName,
            price,
            categoryId: currentCategory.id,
            imageUrl: imageUrl && imageUrl.startsWith('http') ? imageUrl : null,
            isAvailable: true
          }
        })
        importedMenuCount++
      }
    }
    console.log(`เพิ่มข้อมูลเมนูสำเร็จ ${importedMenuCount} รายการ`)
  }

  console.log('\n--- นำเข้าข้อมูลเสร็จสมบูรณ์ ---')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })