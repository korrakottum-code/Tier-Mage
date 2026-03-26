"use client"

import { useState, useEffect } from "react"
import { TrendingUp, ShoppingBag, CreditCard, BarChart3, AlertTriangle, GitCompare } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { formatCurrency } from "@/lib/utils"
import { useBranchStore } from "@/stores/branch-store"

interface Branch { id: string; name: string }
interface AnalyticsData {
  totalRevenue: number
  totalOrders: number
  avgOrder: number
  revenueByDay: { date: string; amount: number }[]
  topItems: { name: string; qty: number; revenue: number }[]
  channels: { name: string; amount: number }[]
}

const emptyData: AnalyticsData = {
  totalRevenue: 0, totalOrders: 0, avgOrder: 0,
  revenueByDay: [], topItems: [], channels: [],
}

interface DiscrepancyPattern {
  ingredient: { id: string; name: string; unit: string }
  reason: string
  count: number
  avgDiffPercent: number
}
interface DiscrepancySuggestion {
  ingredientName: string
  occurrences: number
  avgDiffPercent: number
  suggestion: string
}
interface BranchSales { branchId: string; branchName: string; revenue: number; orders: number }

const reasonLabel: Record<string, string> = {
  RECIPE_INACCURATE: "สูตรไม่แม่น",
  UNRECORDED_WASTE: "ของเสียไม่ได้บันทึก",
  TASTING_FREE: "ชิม/ให้ฟรี",
  PREVIOUS_MISCOUNT: "นับผิดครั้งก่อน",
  UNIT_CONFUSION: "หน่วยสับสน",
  RECEIVING_ERROR: "รับของผิด",
  OTHER: "อื่นๆ",
}

export function AnalyticsClient({ branches }: { branches: Branch[] }) {
  const { currentBranchId } = useBranchStore()
  const [branchId, setBranchId] = useState(currentBranchId || "ALL")
  const [period, setPeriod] = useState("7d")
  const [data, setData] = useState<AnalyticsData>(emptyData)
  const [loading, setLoading] = useState(true)
  const [patterns, setPatterns] = useState<DiscrepancyPattern[]>([])
  const [suggestions, setSuggestions] = useState<DiscrepancySuggestion[]>([])
  const [branchSales, setBranchSales] = useState<BranchSales[]>([])

  async function loadData() {
    setLoading(true)
    const days = period === "1d" ? 1 : period === "30d" ? 30 : 7
    const branchQuery = branchId === "ALL" ? "" : `branchId=${branchId}&`
    const [analyticsRes, discRes, ...branchResults] = await Promise.all([
      fetch(`/api/analytics?${branchQuery}days=${days}`),
      fetch(`/api/analytics/discrepancy?days=${days}`),
      ...branches.map((b) => fetch(`/api/analytics?branchId=${b.id}&days=${days}`)),
    ])
    if (analyticsRes.ok) setData(await analyticsRes.json())
    if (discRes.ok) {
      const d = await discRes.json()
      setPatterns(d.patterns ?? [])
      setSuggestions(d.suggestions ?? [])
    }
    const sales: BranchSales[] = []
    for (let i = 0; i < branches.length; i++) {
      if (branchResults[i].ok) {
        const bd = await branchResults[i].json()
        sales.push({ branchId: branches[i].id, branchName: branches[i].name, revenue: bd.totalRevenue, orders: bd.totalOrders })
      }
    }
    setBranchSales(sales.sort((a, b) => b.revenue - a.revenue))
    setLoading(false)
  }

  useEffect(() => {
    if (currentBranchId && branchId !== currentBranchId) {
      setBranchId(currentBranchId)
    } else if (!currentBranchId && branchId !== "ALL") {
      setBranchId("ALL")
    }
  }, [currentBranchId])

  useEffect(() => { loadData() }, [branchId, period])

  const { totalRevenue, totalOrders, avgOrder, revenueByDay, topItems, channels } = data
  const maxDayRevenue = Math.max(...revenueByDay.map((d) => d.amount), 1)

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none w-full sm:w-auto">
          <option value="ALL">ภาพรวมทุกสาขา</option>
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <div className="flex rounded-lg border border-border overflow-hidden h-10">
          {[{ v: "1d", l: "วันนี้" }, { v: "7d", l: "7 วัน" }, { v: "30d", l: "30 วัน" }].map(({ v, l }) => (
            <button
              key={v}
              onClick={() => setPeriod(v)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${period === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}
            >
              {l}
            </button>
          ))}
        </div>
        {loading && <span className="text-xs text-muted-foreground animate-pulse">กำลังโหลดข้อมูล...</span>}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: TrendingUp, label: "ยอดขายรวม", value: formatCurrency(totalRevenue), color: "text-emerald-400" },
          { icon: ShoppingBag, label: "จำนวนออเดอร์", value: totalOrders.toLocaleString(), color: "text-blue-400" },
          { icon: CreditCard, label: "เฉลี่ย/ออเดอร์", value: formatCurrency(avgOrder), color: "text-purple-400" },
          { icon: BarChart3, label: "เมนูขายดีสุด", value: topItems[0]?.name ?? "-", color: "text-orange-400" },
        ].map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="rounded-xl border border-border bg-card p-4">
              <div className={`flex items-center gap-2 mb-2 ${card.color}`}>
                <Icon className="w-4 h-4" />
                <span className="text-xs font-medium">{card.label}</span>
              </div>
              <p className={`text-xl font-bold truncate ${card.color}`}>{card.value}</p>
            </div>
          )
        })}
      </div>

      {/* Revenue by day chart */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <h3 className="font-semibold text-sm">ยอดขายรายวัน</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueByDay}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }} 
                tickFormatter={(str) => new Date(str).toLocaleDateString("th-TH", { day: "2-digit", month: "short" })}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip 
                contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                formatter={(val: any) => [formatCurrency(Number(val) || 0), "ยอดขาย"]}
                labelFormatter={(label) => new Date(label).toLocaleDateString("th-TH", { dateStyle: "medium" })}
              />
              <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top menu items */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h3 className="font-semibold text-sm">เมนูขายดี (Top 5)</h3>
          <div className="space-y-2">
            {topItems.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">ยังไม่มีข้อมูล</p>}
            {topItems.slice(0, 5).map((item, idx) => {
              const pct = topItems[0].qty > 0 ? (item.qty / topItems[0].qty) * 100 : 0
              return (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-5">{idx + 1}.</span>
                      <span className="font-medium truncate max-w-[160px]">{item.name}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-medium">{item.qty} แก้ว</span>
                      <span className="text-xs text-muted-foreground ml-2">{formatCurrency(item.revenue)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary/60" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Revenue by channel */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h3 className="font-semibold text-sm">ยอดขายตามช่องทาง</h3>
          <div className="space-y-2">
            {channels.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">ยังไม่มีข้อมูล</p>}
            {channels.map((ch) => {
              const pct = channels[0].amount > 0 ? (ch.amount / channels[0].amount) * 100 : 0
              return (
                <div key={ch.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{ch.name}</span>
                    <span className="text-sm font-bold">{formatCurrency(ch.amount)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-blue-500/60" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Branch Comparison */}
      {branchSales.length > 1 && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2"><GitCompare className="w-4 h-4 text-blue-400" /> เปรียบเทียบสาขา</h3>
          <div className="space-y-2">
            {branchSales.map((bs, idx) => {
              const maxRev = branchSales[0].revenue || 1
              const pct = (bs.revenue / maxRev) * 100
              return (
                <div key={bs.branchId} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-5">{idx + 1}.</span>
                      <span className="font-medium">{bs.branchName}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold">{formatCurrency(bs.revenue)}</span>
                      <span className="text-xs text-muted-foreground ml-2">{bs.orders} ออเดอร์</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500/60" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Discrepancy Pattern Detection */}
      {(patterns.length > 0 || suggestions.length > 0) && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-yellow-400" /> Pattern ส่วนต่างจากนับสต็อก</h3>
          {suggestions.length > 0 && (
            <div className="space-y-2 mb-3">
              {suggestions.map((s, i) => (
                <div key={i} className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-sm text-yellow-200">
                  {s.suggestion}
                </div>
              ))}
            </div>
          )}
          {patterns.length > 0 && (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">วัตถุดิบ</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">เหตุผล</th>
                    <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">ครั้ง</th>
                    <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">เฉลี่ย %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {patterns.map((p, i) => (
                    <tr key={i} className="hover:bg-muted/10">
                      <td className="px-3 py-2 text-xs font-medium">{p.ingredient.name}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{reasonLabel[p.reason] ?? p.reason}</td>
                      <td className="px-3 py-2 text-xs text-right font-medium">{p.count}</td>
                      <td className="px-3 py-2 text-xs text-right">{p.avgDiffPercent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
