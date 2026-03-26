import { create } from "zustand"
import { persist } from "zustand/middleware"

interface Branch {
  id: string
  name: string
  type: string
}

interface BranchStore {
  currentBranchId: string | null
  currentBranch: Branch | null
  branches: Branch[]
  setCurrentBranch: (branch: Branch | null) => void
  setBranches: (branches: Branch[]) => void
  clearBranch: () => void
}

export const useBranchStore = create<BranchStore>()(
  persist(
    (set) => ({
      currentBranchId: null,
      currentBranch: null,
      branches: [],
      setCurrentBranch: (branch) =>
        set({ currentBranchId: branch?.id ?? null, currentBranch: branch }),
      setBranches: (branches) => set({ branches }),
      clearBranch: () =>
        set({ currentBranchId: null, currentBranch: null }),
    }),
    {
      name: "tier-coffee-branch",
    }
  )
)
