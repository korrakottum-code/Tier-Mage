"use client"

import React, { useState, useEffect } from "react"
import { Search, CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { format, subDays, addDays } from "date-fns"
import { th } from "date-fns/locale"
import { formatCurrency, cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface Branch { id: string; name: string }

const statusLabel: Record<string, string> = { COMPLETED: "สำเร็จ", PENDING: "รอ", VOIDED: "ยกเลิก" }
const statusColor: Record<string, string> = {
  COMPLETED: "text-emerald-400 bg-emerald-400/10",
  PENDING: "text-yellow-400 bg-yellow-400/10",
  VOIDED: "text-muted-foreground bg-muted",
}

export function HistoryClient({ branches }: { branches: Branch[] }) {
  const [branchId, setBranchId] = useState("ALL")
  const [date, setDate] = useState<Date>(new Date())
  const [orders, setOrders] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  async function search() {
    setLoading(true)
    const dateStr = format(date, 'yyyy-MM-dd')
    const branchQuery = branchId === "ALL" ? "" : `&branchId=${branchId}`
    const res = await fetch(`/api/pos/orders?date=${dateStr}${branchQuery}`)
    if (res.ok) setOrders(await res.json())
    setSearched(true); setLoading(false)
  }

  // Load automatically on mount or when date/branch changes
  useEffect(() => {
    search()
  }, [date, branchId])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalSales = orders.filter((o: any) => o.status === "COMPLETED").reduce((s, o: any) => s + Number(o.total), 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none w-full sm:w-auto">
          <option value="ALL">ภาพรวมทุกสาขา</option>
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>

        <div className="flex items-center gap-1 w-full sm:w-auto">
          <button 
            onClick={() => setDate(subDays(date, 1))}
            className="h-10 w-10 flex items-center justify-center rounded-lg border border-input bg-background hover:bg-muted"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          
          <Popover>
            <PopoverTrigger
              className={cn(
                "flex items-center justify-center gap-2 h-10 flex-1 sm:w-[200px] px-3 rounded-lg border border-input bg-background text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="h-4 w-4" />
              {date ? format(date, "PPP", { locale: th }) : <span>เลือกวันที่</span>}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(day) => day && setDate(day)}
                initialFocus
                locale={th}
              />
            </PopoverContent>
          </Popover>

          <button 
            onClick={() => setDate(addDays(date, 1))}
            className="h-10 w-10 flex items-center justify-center rounded-lg border border-input bg-background hover:bg-muted"
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-muted-foreground">กำลังโหลด...</div>
      ) : (
        <>
          {searched && (
            <div className="flex items-center justify-between bg-muted/20 p-4 rounded-xl border border-border">
              <div className="text-sm text-muted-foreground">
                พบ <strong className="text-foreground text-base">{orders.length}</strong> ออเดอร์
              </div>
              <div className="text-sm text-muted-foreground">
                ยอดรวม <strong className="text-primary text-xl">{formatCurrency(totalSales)}</strong>
              </div>
            </div>
          )}

          {searched && (
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/30">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">เลขออเดอร์</th>
                    {branchId === "ALL" && (
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden sm:table-cell">สาขา</th>
                    )}
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden md:table-cell">ช่องทาง</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">ยอด</th>
                    <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">สถานะ</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground hidden md:table-cell">เวลา</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {orders.map((order: any) => (
                    <React.Fragment key={order.id}>
                      <tr onClick={() => setExpanded(expanded === order.id ? null : order.id)} className="hover:bg-muted/20 cursor-pointer">
                        <td className="px-4 py-3 font-mono text-xs">{order.orderNumber}</td>
                        {branchId === "ALL" && (
                          <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell text-xs">
                            {order.branch?.name ?? "-"}
                          </td>
                        )}
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-xs">
                          {order.payment?.channel?.name ?? order.source}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-primary">{formatCurrency(Number(order.total))}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[order.status] ?? ""}`}>
                            {statusLabel[order.status] ?? order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground text-xs hidden md:table-cell">
                          {new Date(order.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                        </td>
                      </tr>
                      {expanded === order.id && (
                        <tr>
                          <td colSpan={branchId === "ALL" ? 6 : 5} className="px-6 py-2 bg-muted/10">
                            <div className="space-y-1 text-xs">
                              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                              {order.items?.map((item: any) => (
                                <div key={item.id} className="flex justify-between text-muted-foreground">
                                  <span>{item.menuItem?.name} × {item.quantity}</span>
                                  <span>{formatCurrency(Number(item.lineTotal))}</span>
                                </div>
                              ))}
                              {Number(order.discount) > 0 && (
                                <div className="flex justify-between text-yellow-400">
                                  <span>ส่วนลด</span><span>-{formatCurrency(Number(order.discount))}</span>
                                </div>
                              )}
                              <div className="flex justify-between font-semibold text-foreground pt-1 border-t border-border mt-1">
                                <span>รวม</span><span>{formatCurrency(Number(order.total))}</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                  {orders.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">ไม่พบออเดอร์ในวันที่เลือก</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
