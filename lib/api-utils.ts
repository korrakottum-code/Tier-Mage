import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

type Role = "ADMIN" | "MANAGER" | "STAFF" | "VIEWER"

/**
 * Get authenticated session and enforce branch-level access.
 * STAFF/VIEWER can only access their own branch.
 * ADMIN/MANAGER can access any branch.
 * Returns { session, effectiveBranchId } or a NextResponse error.
 */
export async function getSessionWithBranchCheck(requestedBranchId: string | null) {
  const session = await auth()
  if (!session) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  const role = (session.user?.role ?? "STAFF") as Role
  const userBranchId = session.user?.branchId ?? null

  // STAFF/VIEWER: force their own branchId
  if (["STAFF", "VIEWER"].includes(role) && userBranchId) {
    return { session, effectiveBranchId: userBranchId }
  }

  // ADMIN/MANAGER: use requested branchId or null (all branches)
  return { session, effectiveBranchId: requestedBranchId }
}

/**
 * Check if user has one of the allowed roles. Returns error response or null.
 */
export async function requireRoles(allowedRoles: Role[]) {
  const session = await auth()
  if (!session) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }
  const role = (session.user?.role ?? "STAFF") as Role
  if (!allowedRoles.includes(role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }
  return { session }
}
