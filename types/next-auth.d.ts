import type { Role } from "@/types"
import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface User {
    role: Role
    employeeId?: string | null
    branchId?: string | null
  }

  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: Role
      employeeId?: string | null
      branchId?: string | null
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: Role
    employeeId?: string | null
    branchId?: string | null
  }
}
