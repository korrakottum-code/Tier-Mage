import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AnalyticsClient } from "@/components/analytics/AnalyticsClient"

export default async function AnalyticsPage() {
  const session = await auth()
  if (!session) redirect("/login")
  if (!["ADMIN", "MANAGER"].includes(session.user?.role ?? "")) redirect("/dashboard")

  const userRole = session.user.role
  const userBranchId = session.user.branchId

  const branches = await prisma.branch.findMany({
    where: {
      isActive: true,
      ...(userRole === "STAFF" || userRole === "VIEWER" ? { id: userBranchId ?? undefined } : {}),
    },
    select: { id: true, name: true },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">วิเคราะห์</h1>
        <p className="text-muted-foreground text-sm mt-1">ยอดขาย เมนูขายดี และภาพรวมธุรกิจ</p>
      </div>
      <AnalyticsClient branches={branches} />
    </div>
  )
}
