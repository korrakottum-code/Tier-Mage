import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ShiftClosingClient } from "@/components/shift/ShiftClosingClient"

export default async function ShiftClosingPage() {
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
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ปิดกะ</h1>
        <p className="text-muted-foreground text-sm mt-1">บันทึกยอดเงินปิดกะและรออนุมัติจากผู้จัดการ</p>
      </div>
      <ShiftClosingClient
        branches={branches}
        role={session.user?.role ?? "STAFF"}
      />
    </div>
  )
}
