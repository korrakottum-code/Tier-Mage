"use client"

import { useState, useEffect } from "react"
import { CheckCircle, AlertCircle, Clock, RefreshCw } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface Branch { id: string; name: string }

interface Settlement {
  id: string
  branch: { id: string; name: string }
  channel: { id: string; name: string; gpPercent: number; feePercent: number }
  saleDate: string
  saleAmount: number
  expectedAmount: number
  actualAmount: number | null
  settledAt: string | null
  status: string
  note: string | null
  fees: { id: string; feeName: string; amount: number }[]
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: "รอกระทบยอด", color: "text-yellow-400 bg-yellow-400/10", icon: Clock },
  SETTLED: { label: "รับเงินแล้ว", color: "text-blue-400 bg-blue-400/10", icon: CheckCircle },
  MATCHED: { label: "ตรงยอด", color: "text-emerald-400 bg-emerald-400/10", icon: CheckCircle },
  MISMATCHED: { label: "ไม่ตรงยอด", color: "text-red-400 bg-red-400/10", icon: AlertCircle },
}

export function SettlementClient({ branches }: { branches: Branch[] }) {
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [loading, setLoading] = useState(true)
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "")
  const [filterStatus, setFilterStatus] = useState("PENDING")
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [actualInputs, setActualInputs] = useState<Record<string, string>>({})
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({})

  async function load() {
    setLoading(true)
    const params = new URLSearchParams({ branchId })
    if (filterStatus !== "ALL") params.set("status", filterStatus)
    const res = await fetch(`/api/settlements?${params}`)
    if (res.ok) setSettlements(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [branchId, filterStatus])

  async function handleSettle(id: string) {
    const actual = actualInputs[id]
    if (!actual) return
    setUpdatingId(id)
    const res = await fetch("/api/settlements", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, actualAmount: Number(actual), note: noteInputs[id] ?? null }),
    })
    if (res.ok) {
      const updated = await res.json()
      setSettlements((p) => p.map((s) => s.id === id ? updated : s))
      setActualInputs((p) => { const n = { ...p }; delete n[id]; return n })
      setNoteInputs((p) => { const n = { ...p }; delete n[id]; return n })
    }
    setUpdatingId(null)
  }

  const pendingTotal = settlements
    .filter((s) => s.status === "PENDING")
    .reduce((sum, s) => sum + Number(s.expectedAmount), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={branchId}
          onChange={(e) => setBranchId(e.target.value)}
          className="h-8 rounded-lg border border-input bg-background px-3 text-sm outline-none"
        >
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <div className="flex rounded-lg border border-border overflow-hidden">
          {[
            { v: "PENDING", l: "รอกระทบ" },
            { v: "MATCHED", l: "ตรงยอด" },
            { v: "MISMATCHED", l: "ไม่ตรง" },
            { v: "ALL", l: "ทั้งหมด" },
          ].map(({ v, l }) => (
            <button
              key={v}
              onClick={() => setFilterStatus(v)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${filterStatus === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {l}
            </button>
          ))}
        </div>
        <button onClick={load} className="ml-auto p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {filterStatus === "PENDING" && pendingTotal > 0 && (
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-2.5 text-sm flex items-center justify-between">
          <span className="text-yellow-400">รอกระทบยอดรวม</span>
          <span className="font-bold text-yellow-400">{formatCurrency(pendingTotal)}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-muted-foreground text-sm">กำลังโหลด...</div>
      ) : settlements.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">ไม่มียอดรอกระทบ</div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">ช่องทาง</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden sm:table-cell">วันที่ขาย</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">ยอดขาย</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">ยอดที่คาดหวัง</th>
                <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">สถานะ</th>
                <th className="px-4 py-2.5 hidden lg:table-cell"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {settlements.map((s) => {
                const sc = statusConfig[s.status] ?? statusConfig.PENDING
                const Icon = sc.icon
                const isPending = s.status === "PENDING"
                return (
                  <tr key={s.id} className="hover:bg-muted/10">
                    <td className="px-4 py-3">
                      <p className="font-medium">{s.channel.name}</p>
                      <p className="text-xs text-muted-foreground">{s.branch.name}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden sm:table-cell">
                      {new Date(s.saleDate).toLocaleDateString("th-TH", { dateStyle: "short" })}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(Number(s.saleAmount))}</td>
                    <td className="px-4 py-3 text-right">
                      <p className="font-medium">{formatCurrency(Number(s.expectedAmount))}</p>
                      {s.actualAmount != null && (
                        <p className={`text-xs ${Number(s.actualAmount) >= Number(s.expectedAmount) ? "text-emerald-400" : "text-red-400"}`}>
                          จริง {formatCurrency(Number(s.actualAmount))}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1 ${sc.color}`}>
                        <Icon className="w-3 h-3" /> {sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {isPending && (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={actualInputs[s.id] ?? ""}
                            onChange={(e) => setActualInputs((p) => ({ ...p, [s.id]: e.target.value }))}
                            placeholder="ยอดจริง"
                            className="h-7 w-24 rounded-lg border border-input bg-background px-2 text-xs outline-none"
                          />
                          <button
                            onClick={() => handleSettle(s.id)}
                            disabled={!actualInputs[s.id] || updatingId === s.id}
                            className="h-7 px-2.5 rounded-lg bg-primary/10 text-primary text-xs hover:bg-primary/20 disabled:opacity-50"
                          >
                            บันทึก
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
