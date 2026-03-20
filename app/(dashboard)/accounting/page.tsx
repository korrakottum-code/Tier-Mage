import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AccountingClient } from "@/components/accounting/AccountingClient"

export default async function AccountingPage() {
  const session = await auth()
  if (!session) redirect("/login")
  if (!["ADMIN", "MANAGER"].includes(session.user?.role ?? "")) redirect("/dashboard")

  const [branches, expenseCategories] = await Promise.all([
    prisma.branch.findMany({ where: { isActive: true }, select: { id: true, name: true } }),
    prisma.expenseCategory.findMany({ orderBy: { name: "asc" } }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">บัญชี</h1>
        <p className="text-muted-foreground text-sm mt-1">รายรับ รายจ่าย และกระทบยอด</p>
      </div>
      <AccountingClient branches={branches} expenseCategories={expenseCategories} />
    </div>
  )
}
