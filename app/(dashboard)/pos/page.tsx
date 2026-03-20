import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PosClient } from "@/components/pos/PosClient"

export default async function PosPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const userRole = session.user.role
  const userBranchId = session.user.branchId

  const [menuItems, categories, paymentChannels, branches] = await Promise.all([
    prisma.menuItem.findMany({
      where: { isAvailable: true },
      include: { 
        category: { select: { id: true, name: true } },
        menuOptions: true
      },
      orderBy: [{ categoryId: "asc" }, { name: "asc" }],
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.paymentChannel.findMany({ where: { isActive: true } }),
    prisma.branch.findMany({
      where: {
        isActive: true,
        ...(userRole === "STAFF" || userRole === "VIEWER" ? { id: userBranchId ?? undefined } : {}),
      },
      select: { id: true, name: true },
    }),
  ])

  // Convert Decimal to number for client components
  const serializedMenuItems = menuItems.map((item) => ({
    ...item,
    price: Number(item.price),
    menuOptions: item.menuOptions?.map((opt) => ({
      ...opt,
      priceModifier: Array.isArray(opt.priceModifier) ? opt.priceModifier.map(Number) : opt.priceModifier,
    })),
  }))

  const serializedChannels = paymentChannels.map((ch) => ({
    ...ch,
    gpPercent: Number(ch.gpPercent),
    feePercent: Number(ch.feePercent),
  }))

  return (
    <PosClient
      menuItems={serializedMenuItems}
      categories={categories}
      paymentChannels={serializedChannels}
      branches={branches}
      role={session.user?.role}
    />
  )
}
