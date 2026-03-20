"use client"

import { useState, useEffect } from "react"
import { Calculator, CheckCircle, Banknote } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface Branch { id: string; name: string }

interface Payroll {
  id: string
  employeeId: string
  employee: { id: string; name: string; position: string }
  periodStart: string
  periodEnd: string
  baseSalary: number
  overtimePay: number
  bonus: number
  deductions: number
  netPay: number
  paidAt: string | null
}

export function PayrollTab({ branches, role }: { branches: Branch[]; role: string }) {
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "")
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [payrolls, setPayrolls] = useState<Payroll[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ bonus: "", deductions: "" })

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/employees/payroll?branchId=${branchId}&month=${month}`)
    if (res.ok) setPayrolls(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [branchId, month])

  async function handleGenerate() {
    if (!confirm(`คำนวณเงินเดือนเดือน ${month} สาขานี้?\nจะคำนวณจาก attendance × hourlyRate`)) return
    setGenerating(true)
    const res = await fetch("/api/employees/payroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ branchId, month }),
    })
    if (res.ok) load()
    setGenerating(false)
  }

  async function handleUpdate(id: string) {
    const res = await fetch("/api/employees/payroll", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, bonus: Number(editForm.bonus) || 0, deductions: Number(editForm.deductions) || 0 }),
    })
    if (res.ok) {
      const updated = await res.json()
      setPayrolls((p) => p.map((pr) => pr.id === id ? updated : pr))
      setEditingId(null)
    }
  }

  async function handleMarkPaid(id: string) {
    const res = await fetch("/api/employees/payroll", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, paidAt: new Date().toISOString() }),
    })
    if (res.ok) {
      const updated = await res.json()
      setPayrolls((p) => p.map((pr) => pr.id === id ? updated : pr))
    }
  }

  const totalNet = payrolls.reduce((s, p) => s + Number(p.netPay), 0)
  const paidCount = payrolls.filter((p) => p.paidAt).length

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="h-8 rounded-lg border border-input bg-background px-3 text-sm outline-none">
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="h-8 rounded-lg border border-input bg-background px-3 text-sm outline-none" />
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span>รวม: <strong className="text-foreground">{formatCurrency(totalNet)}</strong></span>
          <span>จ่ายแล้ว: <strong className="text-emerald-400">{paidCount}/{payrolls.length}</strong></span>
        </div>
        <button onClick={handleGenerate} disabled={generating} className="ml-auto flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
          <Calculator className="w-4 h-4" /> {generating ? "กำลังคำนวณ..." : "คำนวณเงินเดือน"}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-muted-foreground text-sm">กำลังโหลด...</div>
      ) : payrolls.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm">ยังไม่มีข้อมูลเงินเดือนเดือนนี้ — กดคำนวณเงินเดือนเพื่อสร้าง</div>
      ) : (
        <div className="rounded-xl border border-border overflow-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">พนักงาน</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">เงินเดือน</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">OT</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">โบนัส</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">หัก</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">รวมสุทธิ</th>
                <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">สถานะ</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payrolls.map((p) => (
                <tr key={p.id} className="hover:bg-muted/10">
                  <td className="px-4 py-2">
                    <p className="text-xs font-medium">{p.employee.name}</p>
                    <p className="text-[10px] text-muted-foreground">{p.employee.position}</p>
                  </td>
                  <td className="px-4 py-2 text-xs text-right">{formatCurrency(Number(p.baseSalary))}</td>
                  <td className="px-4 py-2 text-xs text-right">{Number(p.overtimePay) > 0 ? formatCurrency(Number(p.overtimePay)) : "—"}</td>
                  <td className="px-4 py-2 text-xs text-right">
                    {editingId === p.id ? (
                      <input value={editForm.bonus} onChange={(e) => setEditForm({ ...editForm, bonus: e.target.value })} className="h-6 w-16 rounded border border-input bg-background px-1.5 text-xs text-right outline-none" />
                    ) : Number(p.bonus) > 0 ? formatCurrency(Number(p.bonus)) : "—"}
                  </td>
                  <td className="px-4 py-2 text-xs text-right">
                    {editingId === p.id ? (
                      <input value={editForm.deductions} onChange={(e) => setEditForm({ ...editForm, deductions: e.target.value })} className="h-6 w-16 rounded border border-input bg-background px-1.5 text-xs text-right outline-none" />
                    ) : Number(p.deductions) > 0 ? formatCurrency(Number(p.deductions)) : "—"}
                  </td>
                  <td className="px-4 py-2 text-xs text-right font-semibold">{formatCurrency(Number(p.netPay))}</td>
                  <td className="px-4 py-2 text-center">
                    {p.paidAt ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium text-emerald-400 bg-emerald-400/10">จ่ายแล้ว</span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium text-yellow-400 bg-yellow-400/10">รอจ่าย</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center gap-1 justify-end">
                      {editingId === p.id ? (
                        <>
                          <button onClick={() => handleUpdate(p.id)} className="text-[10px] px-2 py-0.5 rounded bg-primary text-primary-foreground">บันทึก</button>
                          <button onClick={() => setEditingId(null)} className="text-[10px] px-2 py-0.5 rounded border border-border text-muted-foreground">ยกเลิก</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditingId(p.id); setEditForm({ bonus: String(Number(p.bonus)), deductions: String(Number(p.deductions)) }) }} className="text-[10px] px-2 py-0.5 rounded bg-muted/50 text-muted-foreground hover:bg-muted">แก้ไข</button>
                          {!p.paidAt && (
                            <button onClick={() => handleMarkPaid(p.id)} className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 flex items-center gap-0.5">
                              <Banknote className="w-3 h-3" /> จ่าย
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
