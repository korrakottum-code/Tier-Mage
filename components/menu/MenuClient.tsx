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
      <div className="flex items-center justify-between gap-3 bg-card/60 backdrop-blur-xl p-3 px-4 rounded-2xl border border-white/10 shadow-sm relative z-10 w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar relative z-10">
          <button
            onClick={() => setActiveCategory(null)}
            className={cn(
              "shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300",
              activeCategory === null
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105"
                : "bg-accent/40 text-muted-foreground hover:text-foreground hover:bg-accent/80"
            )}
          >
            ทั้งหมด ({menuItems.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300",
                activeCategory === cat.id
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105"
                  : "bg-accent/40 text-muted-foreground hover:text-foreground hover:bg-accent/80"
              )}
            >
              {cat.name} ({menuItems.filter((i) => i.categoryId === cat.id).length})
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 shrink-0 bg-background/50 p-1.5 rounded-xl border border-border/50 relative z-10">
          <button onClick={() => setView("grid")} className={cn("p-2 rounded-lg transition-colors", view === "grid" ? "bg-white text-primary shadow-sm dark:bg-zinc-800" : "text-muted-foreground hover:bg-accent/50")}>
            <LayoutGrid className="w-4.5 h-4.5" />
          </button>
          <button onClick={() => setView("list")} className={cn("p-2 rounded-lg transition-colors", view === "list" ? "bg-white text-primary shadow-sm dark:bg-zinc-800" : "text-muted-foreground hover:bg-accent/50")}>
            <List className="w-4.5 h-4.5" />
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
