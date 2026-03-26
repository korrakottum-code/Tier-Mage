"use client"

import { useState } from "react"
import { Package, Plus, AlertTriangle, ArrowDownToLine, ArrowLeftRight, Trash2, ClipboardList } from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import { useBranchStore } from "@/stores/branch-store"
import { IngredientsTab } from "@/components/stock/IngredientsTab"
import { MovementsTab } from "@/components/stock/MovementsTab"
import { StockCountTab } from "@/components/stock/StockCountTab"

type TabId = "ingredients" | "movements" | "count"

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "ingredients", label: "วัตถุดิบ", icon: Package },
  { id: "movements", label: "รับเข้า / โอน / ทิ้ง", icon: ArrowDownToLine },
  { id: "count", label: "นับสต็อก", icon: ClipboardList },
]

interface Branch { id: string; name: string }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Ingredient = any

interface StockClientProps {
  initialIngredients: Ingredient[]
  branches: Branch[]
  role: string
}

export function StockClient({ initialIngredients, branches, role }: StockClientProps) {
  const { currentBranchId } = useBranchStore()
  const [active, setActive] = useState<TabId>("ingredients")
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients)

  const filteredIngredients = ingredients.filter((i) => !currentBranchId || i.branchId === currentBranchId)
  const lowStock = filteredIngredients.filter((i) => Number(i.currentQty) <= Number(i.minQty))

  return (
    <div className="space-y-4">
      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-3 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
          <p className="text-sm text-yellow-200">
            วัตถุดิบใกล้หมด <strong>{lowStock.length} รายการ</strong>:{" "}
            <span className="text-muted-foreground">{lowStock.slice(0, 3).map((i) => i.name).join(", ")}{lowStock.length > 3 ? "..." : ""}</span>
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-2xl font-bold">{filteredIngredients.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">รายการทั้งหมด</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-2xl font-bold text-yellow-400">{lowStock.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">ใกล้หมด</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-2xl font-bold text-emerald-400">
            {formatCurrency(filteredIngredients.reduce((s, i) => s + Number(i.currentQty) * Number(i.costPerUnit), 0))}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">มูลค่ารวม</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
                active === tab.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {active === "ingredients" && (
        <IngredientsTab
          ingredients={filteredIngredients}
          branches={branches}
          role={role}
          onAdd={(i) => setIngredients((p) => [...p, i])}
          onUpdate={(i) => setIngredients((p) => p.map((x) => x.id === i.id ? i : x))}
          onDelete={(id) => setIngredients((p) => p.filter((x) => x.id !== id))}
        />
      )}
      {active === "movements" && (
        <MovementsTab ingredients={ingredients} branches={branches} role={role} currentBranchId={currentBranchId} />
      )}
      {active === "count" && (
        <StockCountTab ingredients={filteredIngredients} branches={branches} role={role} onUpdateIngredient={(i) => setIngredients((p) => p.map((x) => x.id === i.id ? i : x))} />
      )}
    </div>
  )
}
