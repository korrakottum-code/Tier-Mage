import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SettlementClient } from "@/components/accounting/SettlementClient"

export default async function SettlementsPage() {
  const session = await auth()
  if (!session) redirect("/login")
  if (!["ADMIN", "MANAGER"].includes(session.user?.role ?? "")) redirect("/dashboard")

  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">กระทบยอด</h1>
        <p className="text-muted-foreground text-sm mt-1">ตรวจสอบยอดรับเงินจากช่องทาง Delivery และ Online</p>
      </div>
      <SettlementClient branches={branches} />
    </div>
  )
}
