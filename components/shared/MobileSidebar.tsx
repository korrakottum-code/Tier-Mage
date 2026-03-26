"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { X, Coffee, LayoutDashboard, ShoppingCart, UtensilsCrossed, Package, Calculator, Users, TicketCheck, History, BarChart3, Settings, AlarmClock, ArrowLeftRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Role } from "@/types"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "MANAGER", "VIEWER"] as Role[] },
  { href: "/pos", label: "POS ขายสินค้า", icon: ShoppingCart, roles: ["ADMIN", "MANAGER", "STAFF"] as Role[] },
  { href: "/menu", label: "เมนู / สูตร", icon: UtensilsCrossed, roles: ["ADMIN", "MANAGER", "STAFF"] as Role[] },
  { href: "/stock", label: "สต็อกวัตถุดิบ", icon: Package, roles: ["ADMIN", "MANAGER", "STAFF"] as Role[] },
  { href: "/accounting", label: "บัญชี", icon: Calculator, roles: ["ADMIN", "MANAGER", "VIEWER"] as Role[] },
  { href: "/shift-closing?refresh=1", label: "ปิดกะ", icon: AlarmClock, roles: ["ADMIN", "MANAGER", "STAFF"] as Role[] },
  { href: "/settlements", label: "กระทบยอด", icon: ArrowLeftRight, roles: ["ADMIN", "MANAGER"] as Role[] },
  { href: "/employees?refresh=1", label: "พนักงาน", icon: Users, roles: ["ADMIN", "MANAGER", "STAFF"] as Role[] },
  { href: "/tickets", label: "คำร้อง", icon: TicketCheck, roles: ["ADMIN", "MANAGER", "STAFF"] as Role[] },
  { href: "/history", label: "ประวัติ", icon: History, roles: ["ADMIN", "MANAGER", "STAFF", "VIEWER"] as Role[] },
  { href: "/analytics", label: "วิเคราะห์", icon: BarChart3, roles: ["ADMIN", "MANAGER", "VIEWER"] as Role[] },
  { href: "/settings", label: "ตั้งค่า", icon: Settings, roles: ["ADMIN"] as Role[] },
]

interface MobileSidebarProps {
  role: Role
  open: boolean
  onClose: () => void
}

export function MobileSidebar({ role, open, onClose }: MobileSidebarProps) {
  const pathname = usePathname()
  const visible = navItems.filter((item) => item.roles.includes(role))

  function isActive(href: string) {
    const baseHref = href.split("?")[0]
    if (baseHref === "/") return pathname === "/"
    return pathname.startsWith(baseHref)
  }

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/50 md:hidden transition-opacity duration-200",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex flex-col md:hidden transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Coffee className="w-4 h-4 text-primary" />
            </div>
            <span className="font-bold text-sm">Tier Coffee</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {visible.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
