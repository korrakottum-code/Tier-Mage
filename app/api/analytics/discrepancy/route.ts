import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || !["ADMIN", "MANAGER"].includes(session.user?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const days = parseInt(searchParams.get("days") ?? "14")

  const since = new Date()
  since.setDate(since.getDate() - days)

  // Find repeated reasons per ingredient
  const counts = await prisma.stockCount.findMany({
    where: {
      createdAt: { gte: since },
      reason: { not: null },
    },
    select: {
      ingredientId: true,
      reason: true,
      reasonNote: true,
      diffPercent: true,
      ingredient: { select: { id: true, name: true, unit: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  // Group by ingredientId + reason
  const patterns: Record<string, { ingredient: { id: string; name: string; unit: string }; reason: string; count: number; avgDiffPercent: number; notes: string[] }> = {}

  for (const c of counts) {
    if (!c.reason) continue
    const key = `${c.ingredientId}_${c.reason}`
    if (!patterns[key]) {
      patterns[key] = {
        ingredient: c.ingredient,
        reason: c.reason,
        count: 0,
        avgDiffPercent: 0,
        notes: [],
      }
    }
    patterns[key].count++
    patterns[key].avgDiffPercent += Math.abs(Number(c.diffPercent))
    if (c.reasonNote) patterns[key].notes.push(c.reasonNote)
  }

  // Calculate averages and filter for patterns (count >= 2)
  const results = Object.values(patterns)
    .map((p) => ({
      ...p,
      avgDiffPercent: Math.round((p.avgDiffPercent / p.count) * 100) / 100,
      notes: [...new Set(p.notes)].slice(0, 3),
    }))
    .filter((p) => p.count >= 2)
    .sort((a, b) => b.count - a.count)

  // Generate suggestions for RECIPE_INACCURATE
  const suggestions = results
    .filter((r) => r.reason === "RECIPE_INACCURATE" && r.count >= 3)
    .map((r) => ({
      ingredientId: r.ingredient.id,
      ingredientName: r.ingredient.name,
      occurrences: r.count,
      avgDiffPercent: r.avgDiffPercent,
      suggestion: `ปรับสูตรที่ใช้ ${r.ingredient.name} — พบ "สูตรไม่แม่นยำ" ${r.count} ครั้งใน ${days} วัน (เฉลี่ยต่าง ${r.avgDiffPercent}%)`,
    }))

  return NextResponse.json({ patterns: results, suggestions, periodDays: days })
}
