"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ShoppingCart,
  UtensilsCrossed,
  Package,
  Calculator,
  Users,
  TicketCheck,
  History,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Coffee,
  AlarmClock,
  ArrowLeftRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Role } from "@/types"

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  roles: Role[]
  badge?: string
}

const navItems: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "MANAGER", "VIEWER"],
  },
  {
    href: "/pos",
    label: "POS ขายสินค้า",
    icon: ShoppingCart,
    roles: ["ADMIN", "MANAGER", "STAFF"],
  },
  {
    href: "/menu",
    label: "เมนู / สูตร",
    icon: UtensilsCrossed,
    roles: ["ADMIN", "MANAGER", "STAFF"],
  },
  {
    href: "/stock",
    label: "สต็อกวัตถุดิบ",
    icon: Package,
    roles: ["ADMIN", "MANAGER", "STAFF"],
  },
  {
    href: "/accounting",
    label: "บัญชี",
    icon: Calculator,
    roles: ["ADMIN", "MANAGER", "VIEWER"],
  },
  {
    href: "/shift-closing?refresh=1",
    label: "ปิดกะ",
    icon: AlarmClock,
    roles: ["ADMIN", "MANAGER", "STAFF"],
  },
  {
    href: "/settlements",
    label: "กระทบยอด",
    icon: ArrowLeftRight,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    href: "/employees?refresh=1",
    label: "พนักงาน",
    icon: Users,
    roles: ["ADMIN", "MANAGER", "STAFF"],
  },
  {
    href: "/tickets",
    label: "คำร้อง",
    icon: TicketCheck,
    roles: ["ADMIN", "MANAGER", "STAFF"],
  },
  {
    href: "/history",
    label: "ประวัติ",
    icon: History,
    roles: ["ADMIN", "MANAGER", "STAFF", "VIEWER"],
  },
  {
    href: "/analytics",
    label: "วิเคราะห์",
    icon: BarChart3,
    roles: ["ADMIN", "MANAGER", "VIEWER"],
  },
  {
    href: "/settings",
    label: "ตั้งค่า",
    icon: Settings,
    roles: ["ADMIN"],
  },
]

interface SidebarProps {
  role: Role
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ role, collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const visible = navItems.filter((item) => item.roles.includes(role))

  function isActive(href: string) {
    const baseHref = href.split("?")[0]
    if (baseHref === "/") return pathname === "/"
    return pathname.startsWith(baseHref)
  }

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-full bg-sidebar/60 backdrop-blur-xl border-r border-sidebar-border/50 transition-all duration-300 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20",
        collapsed ? "w-[4.5rem]" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center h-16 border-b border-sidebar-border/50 px-5", collapsed && "justify-center px-0")}>
        <div className={cn("flex items-center gap-3 min-w-0", collapsed && "justify-center")}>
          <div className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center shadow-inner relative group">
            <div className="absolute inset-0 rounded-xl bg-primary/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Coffee className="w-5 h-5 text-primary relative z-10" />
          </div>
          {!collapsed && (
            <span className="font-bold text-foreground text-lg tracking-tight truncate bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Tier Coffee</span>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden space-y-1.5 custom-scrollbar">
        {visible.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 mx-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                collapsed ? "justify-center" : "",
                active
                  ? "text-primary-foreground shadow-md shadow-primary/20"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              {active && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/90 -z-10" />
              )}
              <Icon className={cn("w-5 h-5 shrink-0 transition-transform duration-200", active ? "scale-110" : "group-hover:scale-110 group-hover:text-primary")} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-sidebar-border/50 p-3">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center p-2.5 rounded-xl text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-foreground transition-all duration-200 border border-transparent hover:border-border/50"
          title={collapsed ? "ขยาย" : "ย่อ"}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  )
}
