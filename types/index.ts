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
// Menu / POS Types
// ═══════════════════════════════════════════

export interface MenuOptionType {
  id: string
  menuItemId: string
  name: string
  choices: unknown
  priceModifier?: unknown
}

export interface MenuItemType {
  id: string
  categoryId: string
  category?: { id: string; name: string }
  name: string
  price: number
  imageUrl?: string | null
  isAvailable: boolean
  lastSoldAt?: Date | string | null
  createdAt?: Date | string
  updatedAt?: Date | string
  menuOptions?: MenuOptionType[]
}

export interface CategoryType {
  id: string
  name: string
  sortOrder: number
}

export interface PaymentChannelType {
  id: string
  name: string
  type: string
  gpPercent: number
  feePercent: number
  settlementDays: number
  isActive: boolean
}

export interface BranchType {
  id: string
  name: string
}

export interface CartItemType {
  menuItemId: string
  name: string
  unitPrice: number
  quantity: number
  options?: { name: string; choice: string; priceModifier: number }[] | null
}

export interface OrderItemType {
  id: string
  menuItemId: string
  menuItem?: { id: string; name: string }
  quantity: number
  unitPrice: number
  lineTotal: number
  options?: unknown
}

export interface PaymentType {
  id: string
  channelId: string
  channel?: { id: string; name: string }
  amount: number
  change: number
  reference?: string | null
}

export interface OrderType {
  id: string
  branchId: string
  employeeId: string
  employee?: { id: string; name: string }
  orderNumber: string
  subtotal: number
  discount: number
  total: number
  status: OrderStatus
  source: OrderSource
  createdAt: string
  items: OrderItemType[]
  payment?: PaymentType | null
}

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
