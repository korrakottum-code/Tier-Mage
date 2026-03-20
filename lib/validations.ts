import { z } from "zod"

// === POS Orders ===
export const createOrderSchema = z.object({
  branchId: z.string().min(1, "branchId is required"),
  channelId: z.string().min(1, "channelId is required"),
  amountPaid: z.number().min(0, "amountPaid must be >= 0"),
  discount: z.number().min(0).optional().default(0),
  source: z.enum(["WALK_IN", "GRAB", "LINE_MAN", "ROBINHOOD", "SHOPEE_FOOD", "OTHER_DELIVERY"]).optional().default("WALK_IN"),
  reference: z.string().nullable().optional(),
  items: z.array(z.object({
    menuItemId: z.string().min(1),
    quantity: z.number().int().min(1),
    unitPrice: z.number().min(0),
    options: z.array(z.object({
      name: z.string(),
      choice: z.string(),
      priceModifier: z.number().default(0),
    })).nullable().optional(),
  })).min(1, "At least 1 item required"),
})

export const voidOrderSchema = z.object({
  id: z.string().min(1, "order id is required"),
  status: z.enum(["VOIDED"]),
})

// === Stock Ingredients ===
export const createIngredientSchema = z.object({
  name: z.string().min(1, "name is required").max(200),
  branchId: z.string().min(1, "branchId is required"),
  unit: z.string().min(1, "unit is required").max(50),
  costPerUnit: z.number().min(0).optional().default(0),
  currentQty: z.number().min(0).optional().default(0),
  minQty: z.number().min(0).optional().default(0),
  checkFrequency: z.string().optional().default("Daily"),
  autoThreshold: z.number().min(0).optional().default(5),
  warnThreshold: z.number().min(0).optional().default(20),
})

export const updateIngredientSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200).optional(),
  unit: z.string().min(1).max(50).optional(),
  costPerUnit: z.number().min(0).optional(),
  minQty: z.number().min(0).optional(),
  checkFrequency: z.string().optional(),
  autoThreshold: z.number().min(0).optional(),
  warnThreshold: z.number().min(0).optional(),
})

// === Menu Items ===
export const createMenuItemSchema = z.object({
  name: z.string().min(1, "name is required").max(200),
  categoryId: z.string().min(1, "categoryId is required"),
  price: z.number().min(0, "price must be >= 0"),
  imageUrl: z.string().url().nullable().optional(),
  isAvailable: z.boolean().optional().default(true),
})

export const updateMenuItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200).optional(),
  categoryId: z.string().min(1).optional(),
  price: z.number().min(0).optional(),
  imageUrl: z.string().nullable().optional(),
  isAvailable: z.boolean().optional(),
})

// === Employees ===
export const createEmployeeSchema = z.object({
  name: z.string().min(1, "name is required").max(200),
  branchId: z.string().min(1, "branchId is required"),
  role: z.enum(["ADMIN", "MANAGER", "STAFF", "VIEWER"]),
  phone: z.string().max(20).nullable().optional(),
  hourlyRate: z.number().min(0).optional(),
  wage: z.number().min(0).nullable().optional(),
  email: z.string().email().optional(),
  pin: z.string().length(4, "PIN must be 4 digits").regex(/^\d{4}$/).optional(),
})

// === Settings: Branches ===
export const createBranchSchema = z.object({
  name: z.string().min(1, "name is required").max(200),
  type: z.string().optional().default("Branch"),
  address: z.string().nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
})

// === Tickets ===
export const createTicketSchema = z.object({
  branchId: z.string().min(1),
  title: z.string().min(1, "title is required").max(500),
  description: z.string().max(5000).nullable().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional().default("MEDIUM"),
})
