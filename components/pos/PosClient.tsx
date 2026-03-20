"use client"

import { useState } from "react"
import { ShoppingCart, History } from "lucide-react"
import { cn } from "@/lib/utils"
import { PosOrderPanel } from "@/components/pos/PosOrderPanel"
import { PosHistoryPanel } from "@/components/pos/PosHistoryPanel"
import type { MenuItemType, CategoryType, PaymentChannelType, BranchType, Role } from "@/types"

interface PosClientProps {
  menuItems: MenuItemType[]
  categories: CategoryType[]
  paymentChannels: PaymentChannelType[]
  branches: BranchType[]
  role?: Role | string
}

export function PosClient({ menuItems, categories, paymentChannels, branches, role }: PosClientProps) {
  const [tab, setTab] = useState<"order" | "history">("order")

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -mt-6 -mx-4 sm:-mx-6">
      {/* Top tabs */}
      <div className="flex items-center gap-1 px-4 pt-4 pb-0 border-b border-border bg-background shrink-0">
        <button
          onClick={() => setTab("order")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
            tab === "order" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <ShoppingCart className="w-4 h-4" /> ขายสินค้า
        </button>
        <button
          onClick={() => setTab("history")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
            tab === "history" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <History className="w-4 h-4" /> ประวัติวันนี้
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {tab === "order" ? (
          <PosOrderPanel
            menuItems={menuItems}
            categories={categories}
            paymentChannels={paymentChannels}
            branches={branches}
          />
        ) : (
          <PosHistoryPanel branches={branches} role={role} />
        )}
      </div>
    </div>
  )
}
