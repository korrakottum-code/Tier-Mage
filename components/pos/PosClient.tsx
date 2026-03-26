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
      <div className="flex items-center gap-3 px-6 pt-4 pb-4 border-b border-border/50 bg-background/80 backdrop-blur-xl shrink-0 z-10 shadow-sm relative">
        <button
          onClick={() => setTab("order")}
          className={cn(
            "flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
            tab === "order" ? "bg-primary text-primary-foreground shadow-[0_4px_16px_rgba(217,119,6,0.3)] scale-105" : "text-muted-foreground bg-accent/30 hover:bg-accent/80 hover:text-foreground"
          )}
        >
          <ShoppingCart className="w-4.5 h-4.5" /> ขายสินค้า
        </button>
        <button
          onClick={() => setTab("history")}
          className={cn(
            "flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
            tab === "history" ? "bg-primary text-primary-foreground shadow-[0_4px_16px_rgba(217,119,6,0.3)] scale-105" : "text-muted-foreground bg-accent/30 hover:bg-accent/80 hover:text-foreground"
          )}
        >
          <History className="w-4.5 h-4.5" /> ประวัติวันนี้
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
