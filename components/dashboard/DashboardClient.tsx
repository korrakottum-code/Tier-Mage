"use client"

import { useState, useEffect } from "react"
import { TrendingUp, ShoppingCart, AlertTriangle, Clock, Coffee, ShoppingBag, ArrowDownToLine, ClipboardList, TicketCheck, AlarmClock, ArrowLeftRight, Calendar } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import { useBranchStore } from "@/stores/branch-store"
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
  const { currentBranchId } = useBranchStore()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [stats, setStats] = useState(emptyStats)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [orders, setOrders] = useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [lowStock, setLowStock] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [selectedDate, selectedCategory, currentBranchId])

  async function loadData() {
    setLoading(true)
    const dateStr = format(selectedDate, "yyyy-MM-dd")
    const params = new URLSearchParams({ date: dateStr })
    if (selectedCategory) params.append("categoryId", selectedCategory)
    if (currentBranchId) params.append("branchId", currentBranchId)

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
          {/* Category filter */}
          <select
            value={selectedCategory || ""}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-1"
          >
            <option value="">ทุกหมวดหมู่</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          {/* Date Picker */}
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {statsData.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.04)] transition-all duration-300 group"
            >
              <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-gradient-to-br from-white/5 to-transparent blur-3xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
              <div className="flex flex-col gap-4 relative z-10">
                <div className={`w-11 h-11 rounded-xl ${stat.bg} flex items-center justify-center shadow-inner border border-white/5`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-extrabold text-foreground mt-1 tracking-tight">{stat.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { href: "/pos", icon: ShoppingBag, label: "ขายสินค้า", color: "text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
          { href: "/stock", icon: ArrowDownToLine, label: "รับสต็อก", color: "text-blue-500 dark:text-blue-400 bg-blue-500/10 border-blue-500/20" },
          { href: "/shift-closing", icon: AlarmClock, label: "ปิดกะ", color: "text-purple-500 dark:text-purple-400 bg-purple-500/10 border-purple-500/20" },
          { href: "/tickets", icon: TicketCheck, label: "คำร้อง", color: "text-orange-500 dark:text-orange-400 bg-orange-500/10 border-orange-500/20" },
        ].map((action) => {
          const Icon = action.icon
          return (
            <Link key={action.label} href={action.href} className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-4 flex items-center gap-4 hover:bg-accent/50 hover:-translate-y-0.5 transition-all duration-300 shadow-sm hover:shadow-md group">
              <div className={`w-11 h-11 rounded-xl ${action.color} border flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="w-[1.125rem] h-[1.125rem]" />
              </div>
              <span className="text-sm font-bold text-foreground/90">{action.label}</span>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent orders */}
        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-5 space-y-4 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base text-foreground">ออเดอร์ล่าสุด</h2>
            <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">{stats.ordersCount} รายการ</span>
          </div>
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                <Coffee className="w-6 h-6 opacity-40" />
              </div>
              <p className="text-sm font-medium">ยังไม่มีออเดอร์</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {orders.map((order: any) => (
                <div key={order.id} className="flex items-center justify-between rounded-xl bg-background/50 border border-border/50 px-4 py-3 hover:bg-accent/30 transition-colors">
                  <div>
                    <p className="text-xs font-mono font-medium text-muted-foreground mb-1">{order.orderNumber}</p>
                    <p className="text-sm font-medium text-foreground">
                      {order.items.map((i: any) => i.menuItem.name).slice(0, 2).join(", ")}
                      {order.items.length > 2 ? <span className="text-muted-foreground"> +{order.items.length - 2}</span> : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-extrabold text-primary">{formatCurrency(Number(order.total))}</p>
                    <p className="text-[11px] font-medium text-muted-foreground uppercase">{order.payment?.channel?.name ?? "-"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low stock list */}
        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-5 space-y-4 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base text-foreground">สต็อกใกล้หมด</h2>
            <span className="text-xs font-medium text-yellow-500 bg-yellow-500/10 px-2.5 py-1 rounded-full">{stats.lowStockCount} รายการ</span>
          </div>
          {lowStock.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Coffee className="w-6 h-6 text-emerald-500/60" />
              </div>
              <p className="text-sm font-medium">สต็อกเพียงพอทุกรายการ ✓</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {lowStock.map((ing: any) => {
                const pct = Number(ing.minQty) > 0 ? Math.min((Number(ing.currentQty) / Number(ing.minQty)) * 100, 100) : 100
                return (
                  <div key={ing.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold text-foreground/90">{ing.name}</span>
                      <span className="text-xs text-yellow-500 font-bold bg-yellow-500/10 px-2 py-0.5 rounded-md">
                        {Number(ing.currentQty).toFixed(1)} / {Number(ing.minQty).toFixed(1)} {ing.unit}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted/50 overflow-hidden shadow-inner border border-white/5">
                      <div className="h-full rounded-full bg-gradient-to-r from-yellow-500/80 to-yellow-400" style={{ width: `${pct}%` }} />
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
