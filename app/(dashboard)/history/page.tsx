import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { HistoryClient } from "@/components/history/HistoryClient"

export default async function HistoryPage() {
  const session = await auth()
  if (!session) redirect("/login")

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
        <h1 className="text-2xl font-bold">ประวัติออเดอร์</h1>
        <p className="text-muted-foreground text-sm mt-1">ค้นหาและดูรายละเอียดออเดอร์ย้อนหลัง</p>
      </div>
      <HistoryClient branches={branches} />
    </div>
  )
}
