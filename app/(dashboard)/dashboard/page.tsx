import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DashboardClient } from "@/components/dashboard/DashboardClient"

export default async function DashboardPage() {
  const session = await auth()
  const userRole = session?.user?.role ?? "STAFF"
  const userBranchId = session?.user?.branchId

  // Only fetch filter options here; stats come from /api/dashboard (single source of truth)
  const [categories, branches] = await Promise.all([
    prisma.category.findMany({ select: { id: true, name: true }, orderBy: { sortOrder: "asc" } }),
    prisma.branch.findMany({
      where: {
        isActive: true,
        ...(userRole === "STAFF" || userRole === "VIEWER" ? { id: userBranchId ?? undefined } : {}),
      },
      select: { id: true, name: true },
    }),
  ])

  return (
    <DashboardClient
      categories={categories}
      branches={branches}
    />
  )
}
