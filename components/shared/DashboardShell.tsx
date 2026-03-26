"use client"

import { useState } from "react"
import { Sidebar } from "@/components/shared/Sidebar"
import { Navbar } from "@/components/shared/Navbar"
import { MobileSidebar } from "@/components/shared/MobileSidebar"
import type { Role } from "@/types"

interface DashboardShellProps {
  children: React.ReactNode
  userName: string
  role: Role
}

export function DashboardShell({ children, userName, role }: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar role={role} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <MobileSidebar role={role} open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative isolate">
        <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-primary/5 via-primary/5 to-transparent pointer-events-none -z-10" />
        <Navbar userName={userName} role={role} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto w-full">
          <div className="max-w-7xl mx-auto p-4 md:p-8 relative">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
