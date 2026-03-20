// ═══════════════════════════════════════════
// Core Types
// ═══════════════════════════════════════════

export type Role = "ADMIN" | "MANAGER" | "STAFF" | "VIEWER"
export type MovementType = "PURCHASE" | "SALE" | "TRANSFER" | "WASTE" | "ADJUSTMENT"
export type OrderStatus = "PENDING" | "COMPLETED" | "VOIDED"
export type OrderSource = "WALK_IN" | "GRAB" | "LINE_MAN" | "ROBINHOOD" | "SHOPEE_FOOD" | "OTHER_DELIVERY"
export type TransactionType = "INCOME" | "EXPENSE"
export type TicketType = "GENERAL" | "RESTOCK" | "URGENT" | "MAINTENANCE"
export type TicketStatus = "OPEN" | "IN_PROGRESS" | "COMPLETED" | "REJECTED" | "CANCELLED"
export type CountTier = "AUTO" | "REASON" | "APPROVAL"
export type CountReason =
  | "RECIPE_INACCURATE"
  | "UNRECORDED_WASTE"
  | "TASTING_FREE"
  | "PREVIOUS_MISCOUNT"
  | "UNIT_CONFUSION"
  | "RECEIVING_ERROR"
  | "OTHER"
export type CountStatus = "PENDING" | "AUTO_APPROVED" | "APPROVED" | "REJECTED"

// ═══════════════════════════════════════════
// Session / Auth Types
// ═══════════════════════════════════════════

export interface SessionUser {
  id: string
  email: string
  role: Role
  employeeId?: string | null
  branchId?: string | null
  name?: string | null
}
