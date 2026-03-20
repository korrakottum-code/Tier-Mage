"use client"

import { useState } from "react"
import { LayoutGrid, List } from "lucide-react"
import { cn } from "@/lib/utils"
import { CategoriesPanel } from "@/components/menu/CategoriesPanel"
import { MenuItemsPanel } from "@/components/menu/MenuItemsPanel"

interface Category { id: string; name: string; sortOrder: number }
interface Ingredient { id: string; name: string; unit: string }
interface Recipe { id: string; ingredientId: string; quantity: number; unit: string; ingredient: Ingredient }
interface MenuItem {
  id: string; name: string; price: number; isAvailable: boolean; imageUrl: string | null
  categoryId: string; category: Category; recipes: Recipe[]
}

interface MenuClientProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialCategories: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialMenuItems: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ingredients: any[]
}

export function MenuClient({ initialCategories, initialMenuItems, ingredients }: MenuClientProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [view, setView] = useState<"grid" | "list">("grid")

  const filteredItems = activeCategory
    ? menuItems.filter((i) => i.categoryId === activeCategory)
    : menuItems

  return (
    <div className="flex flex-col gap-4">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveCategory(null)}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
              activeCategory === null
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            ทั้งหมด ({menuItems.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                activeCategory === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {cat.name} ({menuItems.filter((i) => i.categoryId === cat.id).length})
            </button>
          ))}
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={() => setView("grid")} className={cn("p-2 rounded-lg transition-colors", view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button onClick={() => setView("list")} className={cn("p-2 rounded-lg transition-colors", view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
        {/* Left: Categories */}
        <CategoriesPanel
          categories={categories}
          onAdd={(cat: Category) => setCategories((p) => [...p, cat])}
          onUpdate={(cat: Category) => setCategories((p) => p.map((c) => c.id === cat.id ? cat : c))}
          onDelete={(id: string) => setCategories((p) => p.filter((c) => c.id !== id))}
        />

        {/* Right: Menu Items */}
        <MenuItemsPanel
          items={filteredItems}
          categories={categories}
          ingredients={ingredients}
          view={view}
          onAdd={(item: MenuItem) => setMenuItems((p) => [...p, item])}
          onUpdate={(item: MenuItem) => setMenuItems((p) => p.map((i) => i.id === item.id ? item : i))}
          onDelete={(id: string) => setMenuItems((p) => p.filter((i) => i.id !== id))}
        />
      </div>
    </div>
  )
}
