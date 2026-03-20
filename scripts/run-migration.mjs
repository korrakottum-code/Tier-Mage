import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const sqls = [
  `ALTER TABLE "Branch" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now()`,
  `ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now()`,
  `ALTER TABLE "Ingredient" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now()`,
  `ALTER TABLE "MenuItem" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now()`,
  `ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now()`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Order_branchId_orderNumber_key" ON "Order"("branchId", "orderNumber")`,
];

for (const sql of sqls) {
  try {
    await pool.query(sql);
    console.log('OK:', sql.slice(0, 60));
  } catch (e) {
    console.error('ERR:', e.message);
  }
}

await pool.end();
console.log('Done!');
