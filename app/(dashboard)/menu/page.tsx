import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { MenuClient } from "@/components/menu/MenuClient"
import { BranchOverridesTab } from "@/components/menu/BranchOverridesTab"

export default async function MenuPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const [categories, menuItems, ingredients, branches] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.menuItem.findMany({
      include: {
        category: { select: { id: true, name: true } },
        recipes: {
          include: { ingredient: { select: { id: true, name: true, unit: true } } },
        },
      },
      orderBy: [{ categoryId: "asc" }, { name: "asc" }],
    }),
    prisma.ingredient.findMany({
      select: { id: true, name: true, unit: true },
      orderBy: { name: "asc" },
    }),
    prisma.branch.findMany({ where: { isActive: true }, select: { id: true, name: true } }),
  ])

  // Convert Decimal to number for client components
  const serializedMenuItems = menuItems.map((item) => ({
    ...item,
    price: Number(item.price),
    recipes: item.recipes.map((r) => ({
      ...r,
      quantity: Number(r.quantity),
    })),
  }))

  const canOverride = ["ADMIN", "MANAGER"].includes(session.user?.role ?? "")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">เมนู / สูตร</h1>
        <p className="text-muted-foreground text-sm mt-1">จัดการหมวดหมู่ เมนู และสูตรวัตถุดิบ</p>
      </div>
      <MenuClient
        initialCategories={categories}
        initialMenuItems={serializedMenuItems}
        ingredients={ingredients}
      />
      {canOverride && branches.length > 1 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">ปรับราคา/สถานะเฉพาะสาขา</h2>
          <BranchOverridesTab branches={branches} />
        </div>
      )}
    </div>
  )
}
