"use client"

import { useState } from "react"
import { Store, Building2, CreditCard, Clock, Users, Wrench } from "lucide-react"
import { cn } from "@/lib/utils"
import { ShopTab } from "@/components/settings/ShopTab"
import { BranchesTab } from "@/components/settings/BranchesTab"
import { PaymentChannelsTab } from "@/components/settings/PaymentChannelsTab"
import { ShiftsTab } from "@/components/settings/ShiftsTab"
import { UsersTab } from "@/components/settings/UsersTab"
import { SystemTab } from "@/components/settings/SystemTab"
import { SuppliersTab } from "@/components/settings/SuppliersTab"

type TabId = "shop" | "branches" | "payment" | "shifts" | "users" | "suppliers" | "system"

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "shop", label: "ร้าน", icon: Store },
  { id: "branches", label: "สาขา", icon: Building2 },
  { id: "payment", label: "ช่องทางรับเงิน", icon: CreditCard },
  { id: "shifts", label: "กะ", icon: Clock },
  { id: "users", label: "ผู้ใช้", icon: Users },
  { id: "suppliers", label: "Suppliers", icon: Building2 },
  { id: "system", label: "ระบบ", icon: Wrench },
]

interface SettingsTabsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shopSettings: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  branches: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  paymentChannels: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shiftConfigs: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  users: any[]
}

export function SettingsTabs({
  shopSettings,
  branches,
  paymentChannels,
  shiftConfigs,
  users,
}: SettingsTabsProps) {
  const [active, setActive] = useState<TabId>("shop")

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
      {/* Tab list */}
      <div className="flex sm:flex-col gap-1 overflow-x-auto sm:overflow-visible sm:w-44 shrink-0">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors text-left",
                active === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-w-0">
        {active === "shop" && <ShopTab data={shopSettings} />}
        {active === "branches" && <BranchesTab data={branches} />}
        {active === "payment" && <PaymentChannelsTab data={paymentChannels} />}
        {active === "shifts" && <ShiftsTab data={shiftConfigs} />}
        {active === "users" && <UsersTab data={users} />}
        {active === "suppliers" && <SuppliersTab />}
        {active === "system" && <SystemTab />}
      </div>
    </div>
  )
}
