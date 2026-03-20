"use client"

import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { LogOut, Menu, User, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
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
    <header className="h-14 border-b border-border flex items-center px-4 gap-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="md:hidden text-muted-foreground hover:text-foreground"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Branch Switcher */}
      {(role === "ADMIN" || role === "MANAGER") && (
        <BranchSwitcher role={role} />
      )}

      <div className="flex-1" />

      {/* Alerts bell */}
      <Button variant="ghost" size="icon" className="text-muted-foreground">
        <Bell className="w-4 h-4" />
      </Button>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 h-8 px-2 rounded-md hover:bg-accent transition-colors outline-none">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="hidden sm:block text-sm font-medium max-w-32 truncate">
            {userName}
          </span>
          <span className="hidden sm:block text-xs text-muted-foreground">
            {roleLabel[role]}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{userName}</p>
              <p className="text-xs text-muted-foreground">{roleLabel[role]}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive cursor-pointer"
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
