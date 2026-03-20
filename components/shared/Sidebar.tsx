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
    roles: ["ADMIN", "MANAGER", "STAFF", "VIEWER"],
  },
  {
    href: "/stock",
    label: "สต็อกวัตถุดิบ",
    icon: Package,
    roles: ["ADMIN", "MANAGER", "STAFF", "VIEWER"],
  },
  {
    href: "/accounting",
    label: "บัญชี",
    icon: Calculator,
    roles: ["ADMIN", "MANAGER", "VIEWER"],
  },
  {
    href: "/shift-closing",
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
    href: "/employees",
    label: "พนักงาน",
    icon: Users,
    roles: ["ADMIN", "MANAGER", "STAFF"],
  },
  {
    href: "/tickets",
    label: "คำร้อง",
    icon: TicketCheck,
    roles: ["ADMIN", "MANAGER", "STAFF", "VIEWER"],
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
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-200",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center h-14 border-b border-sidebar-border px-4", collapsed && "justify-center px-0")}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Coffee className="w-4 h-4 text-primary" />
          </div>
          {!collapsed && (
            <span className="font-bold text-foreground text-sm truncate">Tier Coffee</span>
          )}
        </div>
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
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 mx-2 px-2 py-2 rounded-lg text-sm transition-colors",
                collapsed ? "justify-center" : "",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-sidebar-border p-2">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center p-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          title={collapsed ? "ขยาย" : "ย่อ"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  )
}
