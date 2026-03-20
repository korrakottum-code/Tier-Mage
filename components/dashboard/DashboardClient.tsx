"use client"

import { useState, useEffect } from "react"
import { TrendingUp, ShoppingCart, AlertTriangle, Clock, Coffee, ShoppingBag, ArrowDownToLine, ClipboardList, TicketCheck, AlarmClock, ArrowLeftRight, Calendar } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { th } from "date-fns/locale"

interface DashboardClientProps {
  categories: { id: string; name: string }[]
  branches: { id: string; name: string }[]
}

const emptyStats = {
  salesTotal: 0,
  ordersCount: 0,
  pendingSettlements: 0,
  lowStockCount: 0,
  openTickets: 0,
  pendingCounts: 0,
  pendingShiftClosings: 0,
}

export function DashboardClient({ 
  categories,
  branches
}: DashboardClientProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null)
  const [stats, setStats] = useState(emptyStats)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [orders, setOrders] = useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [lowStock, setLowStock] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [selectedDate, selectedCategory, selectedBranch])

  async function loadData() {
    setLoading(true)
    const dateStr = format(selectedDate, "yyyy-MM-dd")
    const params = new URLSearchParams({ date: dateStr })
    if (selectedCategory) params.append("categoryId", selectedCategory)
    if (selectedBranch) params.append("branchId", selectedBranch)

    const res = await fetch(`/api/dashboard?${params}`)
    if (res.ok) {
      const data = await res.json()
      setStats(data.stats)
      setOrders(data.orders)
      setLowStock(data.lowStock)
    }
    setLoading(false)
  }

  const statsData = [
    {
      label: "ยอดขายวันนี้",
      value: formatCurrency(stats.salesTotal),
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
    },
    {
      label: "ออเดอร์วันนี้",
      value: `${stats.ordersCount} รายการ`,
      icon: ShoppingCart,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      label: "รอกระทบยอด",
      value: `${stats.pendingSettlements} รายการ`,
      icon: Clock,
      color: "text-yellow-400",
      bg: "bg-yellow-400/10",
    },
    {
      label: "สต็อกใกล้หมด",
      value: `${stats.lowStockCount} รายการ`,
      icon: AlertTriangle,
      color: "text-red-400",
      bg: "bg-red-400/10",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            ภาพรวมธุรกิจและข้อมูลสำคัญ
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Branch filter */}
          {branches.length > 1 && (
            <select
              value={selectedBranch || ""}
              onChange={(e) => setSelectedBranch(e.target.value || null)}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring"
            >
              <option value="">ทุกสาขา</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          )}

          {/* Category filter */}
          <select
            value={selectedCategory || ""}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring"
          >
            <option value="">ทุกหมวดหมู่</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          {/* Date picker */}
          <Popover>
            <PopoverTrigger className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none hover:bg-muted flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {format(selectedDate, "d MMM yyyy", { locale: th })}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {loading && (
        <div className="text-center py-4 text-muted-foreground text-sm">กำลังโหลด...</div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-card p-4 space-y-3"
            >
              <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-bold text-foreground mt-0.5">{stat.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/pos", icon: ShoppingBag, label: "ขายสินค้า", color: "text-emerald-400 bg-emerald-400/10" },
          { href: "/stock", icon: ArrowDownToLine, label: "รับสต็อก", color: "text-blue-400 bg-blue-400/10" },
          { href: "/shift-closing", icon: AlarmClock, label: "ปิดกะ", color: "text-purple-400 bg-purple-400/10" },
          { href: "/tickets", icon: TicketCheck, label: "คำร้อง", color: "text-orange-400 bg-orange-400/10" },
        ].map((action) => {
          const Icon = action.icon
          return (
            <Link key={action.label} href={action.href} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors">
              <div className={`w-9 h-9 rounded-lg ${action.color} flex items-center justify-center shrink-0`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">{action.label}</span>
            </Link>
          )
        })}
      </div>

      {/* Alert banners */}
      <div className="space-y-2">
        {stats.lowStockCount > 0 && (
          <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-3 flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
            <p className="text-sm text-yellow-200">
              วัตถุดิบใกล้หมด <strong>{stats.lowStockCount} รายการ</strong> — <Link href="/stock" className="underline underline-offset-2">ดูที่หน้าสต็อก</Link>
            </p>
          </div>
        )}
        {stats.openTickets > 0 && (
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-3 flex items-center gap-3">
            <TicketCheck className="w-4 h-4 text-blue-400 shrink-0" />
            <p className="text-sm text-blue-200">
              คำร้องรอดำเนินการ <strong>{stats.openTickets} รายการ</strong> — <Link href="/tickets" className="underline underline-offset-2">จัดการ</Link>
            </p>
          </div>
        )}
        {stats.pendingCounts > 0 && (
          <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-3 flex items-center gap-3">
            <ClipboardList className="w-4 h-4 text-purple-400 shrink-0" />
            <p className="text-sm text-purple-200">
              นับสต็อกรออนุมัติ <strong>{stats.pendingCounts} รายการ</strong> — <Link href="/stock" className="underline underline-offset-2">อนุมัติ</Link>
            </p>
          </div>
        )}
        {stats.pendingShiftClosings > 0 && (
          <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-3 flex items-center gap-3">
            <AlarmClock className="w-4 h-4 text-orange-400 shrink-0" />
            <p className="text-sm text-orange-200">
              บันทึกปิดกะรออนุมัติ <strong>{stats.pendingShiftClosings} รายการ</strong> — <Link href="/shift-closing" className="underline underline-offset-2">ตรวจสอบ</Link>
            </p>
          </div>
        )}
        {stats.pendingSettlements > 0 && (
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-3 flex items-center gap-3">
            <ArrowLeftRight className="w-4 h-4 text-cyan-400 shrink-0" />
            <p className="text-sm text-cyan-200">
              รอกระทบยอด <strong>{stats.pendingSettlements} รายการ</strong> — <Link href="/settlements" className="underline underline-offset-2">กระทบยอด</Link>
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent orders */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">ออเดอร์ล่าสุด</h2>
            <span className="text-xs text-muted-foreground">{stats.ordersCount} รายการ</span>
          </div>
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
              <Coffee className="w-8 h-8 opacity-30" />
              <p className="text-sm">ยังไม่มีออเดอร์</p>
            </div>
          ) : (
            <div className="space-y-2">
              {orders.map((order: any) => (
                <div key={order.id} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                  <div>
                    <p className="text-xs font-mono text-muted-foreground">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {order.items.map((i: any) => i.menuItem.name).slice(0, 2).join(", ")}
                      {order.items.length > 2 ? ` +${order.items.length - 2}` : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-primary">{formatCurrency(Number(order.total))}</p>
                    <p className="text-xs text-muted-foreground">{order.payment?.channel?.name ?? "-"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low stock list */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">สต็อกใกล้หมด</h2>
            <span className="text-xs text-muted-foreground">{stats.lowStockCount} รายการ</span>
          </div>
          {lowStock.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
              <Coffee className="w-8 h-8 opacity-30" />
              <p className="text-sm">สต็อกเพียงพอทุกรายการ ✓</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lowStock.map((ing: any) => {
                const pct = Number(ing.minQty) > 0 ? Math.min((Number(ing.currentQty) / Number(ing.minQty)) * 100, 100) : 100
                return (
                  <div key={ing.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{ing.name}</span>
                      <span className="text-xs text-yellow-400 font-medium">
                        {Number(ing.currentQty).toFixed(1)} / {Number(ing.minQty).toFixed(1)} {ing.unit}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-yellow-400/60" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
