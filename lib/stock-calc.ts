export type CountTier = "AUTO" | "REASON" | "APPROVAL"

/**
 * ตัดสินใจ tier ของการนับสต็อก (Smart 3-tier)
 * - AUTO: ส่วนต่าง <= autoThreshold% → ปรับอัตโนมัติ
 * - REASON: > auto แต่ <= warn → ต้องระบุเหตุผล
 * - APPROVAL: > warn → รอ Manager อนุมัติ
 */
export function getCountTier(
  diffPercent: number,
  autoThreshold: number,
  warnThreshold: number
): CountTier {
  if (diffPercent <= autoThreshold) return "AUTO"
  if (diffPercent <= warnThreshold) return "REASON"
  return "APPROVAL"
}
