"use client"

import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { LogOut, Menu, User, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BranchSwitcher } from "@/components/shared/BranchSwitcher"
import type { Role } from "@/types"

interface NavbarProps {
  userName: string
  role: Role
  onMenuClick: () => void
}

const roleLabel: Record<Role, string> = {
  ADMIN: "Admin",
  MANAGER: "ผู้จัดการ",
  STAFF: "พนักงาน",
  VIEWER: "ผู้ดู",
}

export function Navbar({ userName, role, onMenuClick }: NavbarProps) {
  const router = useRouter()

  async function handleSignOut() {
    await signOut({ redirect: false })
    router.push("/login")
  }

  return (
    <header className="h-16 border-b border-border/40 flex items-center px-6 gap-4 bg-background/70 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/40 sticky top-0 z-40 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="md:hidden text-muted-foreground hover:text-foreground transition-colors p-2 -ml-2 rounded-lg hover:bg-accent/50"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Branch Switcher */}
      {(role === "ADMIN" || role === "MANAGER") && (
        <BranchSwitcher role={role} />
      )}

      <div className="flex-1" />

      {/* Alerts bell */}
      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-xl">
        <Bell className="w-5 h-5" />
      </Button>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-3 h-10 px-2 sm:px-3 rounded-xl hover:bg-accent/40 transition-all outline-none border border-transparent hover:border-border/50">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="hidden sm:flex flex-col items-start pr-1">
            <span className="text-sm font-bold text-foreground max-w-32 truncate leading-none">
              {userName}
            </span>
            <span className="text-[11px] font-medium text-primary mt-1 leading-none uppercase tracking-wider">
              {roleLabel[role]}
            </span>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 rounded-xl border border-border/50 shadow-xl bg-background/95 backdrop-blur-xl">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="font-normal py-3 px-3">
              <div className="flex flex-col space-y-1.5">
                <p className="text-sm font-semibold text-foreground">{userName}</p>
                <p className="text-xs font-medium text-primary uppercase tracking-wider">{roleLabel[role]}</p>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator className="bg-border/50" />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer rounded-lg mx-1 my-1 py-2.5 font-medium"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            ออกจากระบบ
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
