import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { StockClient } from "@/components/stock/StockClient"

export default async function StockPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const userRole = session.user.role
  const userBranchId = session.user.branchId

  const [ingredients, branches] = await Promise.all([
    prisma.ingredient.findMany({
      where: {
        branch: { isActive: true },
        ...(userRole === "STAFF" || userRole === "VIEWER" ? { branchId: userBranchId ?? undefined } : {}),
      },
      include: { branch: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.branch.findMany({
      where: {
        isActive: true,
        ...(userRole === "STAFF" || userRole === "VIEWER" ? { id: userBranchId ?? undefined } : {}),
      },
      select: { id: true, name: true },
    }),
  ])

  const serializedIngredients = ingredients.map((i) => ({
    ...i,
    costPerUnit: Number(i.costPerUnit),
    currentQty: Number(i.currentQty),
    minQty: Number(i.minQty),
    autoThreshold: Number(i.autoThreshold),
    warnThreshold: Number(i.warnThreshold),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">สต็อกวัตถุดิบ</h1>
        <p className="text-muted-foreground text-sm mt-1">จัดการวัตถุดิบ รับเข้า โอน และนับสต็อก</p>
      </div>
      <StockClient
        initialIngredients={serializedIngredients}
        branches={branches}
        role={session.user?.role ?? "STAFF"}
      />
    </div>
  )
}
