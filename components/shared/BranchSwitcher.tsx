"use client"

import { useEffect, useRef, useState } from "react"
import { Building2, ChevronDown, Check } from "lucide-react"
import { useBranchStore } from "@/stores/branch-store"
import { cn } from "@/lib/utils"
import type { Role } from "@/types"

interface Branch {
  id: string
  name: string
  type: string
}

interface BranchSwitcherProps {
  role: Role
}

export function BranchSwitcher({ role }: BranchSwitcherProps) {
  const { currentBranch, branches, setCurrentBranch, setBranches } = useBranchStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchBranches() {
      try {
        const res = await fetch("/api/branches")
        if (!res.ok) return
        const data: Branch[] = await res.json()
        setBranches(data)
        if (!currentBranch && data.length > 0) {
          setCurrentBranch(data[0])
        }
      } catch {
        // silently fail
      }
    }
    fetchBranches()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  if (role !== "ADMIN" && role !== "MANAGER") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Building2 className="w-4 h-4" />
        <span>{currentBranch?.name ?? "—"}</span>
      </div>
    )
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-sm rounded-md px-2 py-1.5 hover:bg-accent transition-colors border border-border"
      >
        <Building2 className="w-4 h-4 text-muted-foreground" />
        <span className="max-w-[120px] truncate font-medium">
          {currentBranch?.name ?? "เลือกสาขา"}
        </span>
        <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-52 bg-popover border border-border rounded-lg shadow-lg py-1 z-50">
          {branches.map((branch) => (
            <button
              key={branch.id}
              onClick={() => { setCurrentBranch(branch); setOpen(false) }}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-left",
                currentBranch?.id === branch.id && "text-primary"
              )}
            >
              <Check
                className={cn(
                  "w-4 h-4 shrink-0",
                  currentBranch?.id === branch.id ? "opacity-100" : "opacity-0"
                )}
              />
              <div className="min-w-0">
                <p className="font-medium truncate">{branch.name}</p>
                <p className="text-xs text-muted-foreground">{branch.type}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
