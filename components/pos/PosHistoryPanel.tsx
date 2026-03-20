"use client"

import React, { useState, useEffect } from "react"
import { formatCurrency } from "@/lib/utils"

interface Branch { id: string; name: string }

const statusLabel: Record<string, string> = {
  COMPLETED: "สำเร็จ", PENDING: "รอดำเนินการ", VOIDED: "ยกเลิก",
}
const statusColor: Record<string, string> = {
  COMPLETED: "text-emerald-400 bg-emerald-400/10",
  PENDING: "text-yellow-400 bg-yellow-400/10",
  VOIDED: "text-muted-foreground bg-muted",
}
const sourceLabel: Record<string, string> = {
  WALK_IN: "Walk-in", GRAB: "Grab", LINE_MAN: "LINE MAN",
  ROBINHOOD: "Robinhood", SHOPEE_FOOD: "Shopee Food", OTHER_DELIVERY: "Delivery",
}

export function PosHistoryPanel({ branches, role }: { branches: Branch[]; role?: string }) {
  const [orders, setOrders] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "")
  const [expanded, setExpanded] = useState<string | null>(null)
  const [voiding, setVoiding] = useState<string | null>(null)
  const canVoid = ["ADMIN", "MANAGER"].includes(role ?? "")

  async function handleVoid(orderId: string) {
    if (!confirm("ยืนยันยกเลิกออเดอร์นี้? จะคืนสต็อกและยกเลิกยอดกระทบ")) return
    setVoiding(orderId)
    const res = await fetch("/api/pos/orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: orderId, status: "VOIDED" }),
    })
    if (res.ok) {
      const updated = await res.json()
      setOrders((prev) => prev.map((o: any) => (o as any).id === orderId ? updated : o))
    }
    setVoiding(null)
  }

  async function load(bid: string) {
    setLoading(true)
    const res = await fetch(`/api/pos/orders?branchId=${bid}`)
    if (res.ok) setOrders(await res.json())
    setLoading(false)
  }

  useEffect(() => { load(branchId) }, [branchId])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const completedOrders = orders.filter((o: any) => o.status === "COMPLETED")
  const total = completedOrders.reduce((s, o: any) => s + Number(o.total), 0)
  const completed = completedOrders.length

  return (
    <div className="flex flex-col h-full overflow-hidden p-4 space-y-4">
      <div className="flex items-center gap-3 flex-wrap shrink-0">
        <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="h-8 rounded-lg border border-input bg-background px-3 text-sm outline-none">
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <div className="flex gap-3 text-sm">
          <span className="text-muted-foreground">ออเดอร์วันนี้: <strong className="text-foreground">{completed}</strong></span>
          <span className="text-muted-foreground">ยอดรวม: <strong className="text-primary">{formatCurrency(total)}</strong></span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto rounded-xl border border-border">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">กำลังโหลด...</div>
        ) : orders.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">ยังไม่มีออเดอร์วันนี้</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30 sticky top-0">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">เลขออเดอร์</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden sm:table-cell">ช่องทาง</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">ยอด</th>
                <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">สถานะ</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden md:table-cell">เวลา</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {orders.map((order: any) => (
                <React.Fragment key={order.id}>
                  <tr
                    className="hover:bg-muted/20 cursor-pointer"
                    onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                  >
                    <td className="px-4 py-3 font-mono text-xs">{order.orderNumber}</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                      {sourceLabel[order.source] ?? order.source}
                      {order.payment && <span className="ml-1 text-xs">· {order.payment.channel?.name}</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(Number(order.total))}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[order.status] ?? ""}`}>
                        {statusLabel[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">
                      {new Date(order.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                  {expanded === order.id && (
                    <tr>
                      <td colSpan={5} className="px-6 py-2 bg-muted/10">
                        <div className="space-y-1">
                          {order.items.map((item: any) => (
                            <div key={item.id} className="flex justify-between text-xs text-muted-foreground">
                              <span>{item.menuItem?.name} × {item.quantity}</span>
                              <span>{formatCurrency(Number(item.lineTotal))}</span>
                            </div>
                          ))}
                          {Number(order.discount) > 0 && (
                            <div className="flex justify-between text-xs text-yellow-400">
                              <span>ส่วนลด</span><span>-{formatCurrency(Number(order.discount))}</span>
                            </div>
                          )}
                          {canVoid && order.status === "COMPLETED" && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleVoid(order.id) }}
                              disabled={voiding === order.id}
                              className="mt-2 text-xs px-3 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                            >
                              {voiding === order.id ? "กำลังยกเลิก..." : "Void ออเดอร์"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
