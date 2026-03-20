"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, TrendingUp, TrendingDown, DollarSign, X } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface Branch { id: string; name: string }
interface ExpenseCategory { id: string; name: string; budgetLimit?: unknown }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Transaction = any

interface AccountingClientProps {
  branches: Branch[]
  expenseCategories: ExpenseCategory[]
}

export function AccountingClient({ branches, expenseCategories }: AccountingClientProps) {
  const today = new Date().toISOString().slice(0, 7)
  const [month, setMonth] = useState(today)
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "")
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    type: "EXPENSE",
    categoryId: "",
    amount: "",
    description: "",
    date: new Date().toISOString().slice(0, 10),
    referenceId: "",
  })
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/accounting/transactions?branchId=${branchId}&month=${month}`)
    if (res.ok) setTransactions(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [branchId, month])

  async function handleSave() {
    if (!form.amount || !form.date) return
    setSaving(true)
    const res = await fetch("/api/accounting/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        branchId,
        type: form.type,
        categoryId: form.categoryId || null,
        amount: parseFloat(form.amount),
        description: form.description || null,
        date: form.date,
        referenceId: form.referenceId || null,
      }),
    })
    if (res.ok) {
      const t = await res.json()
      setTransactions((p) => [t, ...p])
      setShowForm(false)
      setForm({ type: "EXPENSE", categoryId: "", amount: "", description: "", date: new Date().toISOString().slice(0, 10), referenceId: "" })
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("ลบรายการนี้?")) return
    const res = await fetch(`/api/accounting/transactions?id=${id}`, { method: "DELETE" })
    if (res.ok) setTransactions((p) => p.filter((t) => t.id !== id))
  }

  const totalIncome = transactions.filter((t) => t.type === "INCOME").reduce((s: number, t: Transaction) => s + Number(t.amount), 0)
  const totalExpense = transactions.filter((t) => t.type === "EXPENSE").reduce((s: number, t: Transaction) => s + Number(t.amount), 0)
  const net = totalIncome - totalExpense

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="h-8 rounded-lg border border-input bg-background px-3 text-sm outline-none">
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="h-8 rounded-lg border border-input bg-background px-3 text-sm outline-none" />
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 ml-auto"
        >
          <Plus className="w-4 h-4" /> เพิ่มรายการ
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium">รายรับ</span>
          </div>
          <p className="text-xl font-bold text-emerald-400">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-red-400 mb-1">
            <TrendingDown className="w-4 h-4" />
            <span className="text-xs font-medium">รายจ่าย</span>
          </div>
          <p className="text-xl font-bold text-red-400">{formatCurrency(totalExpense)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-foreground mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-medium">กำไร/ขาดทุน</span>
          </div>
          <p className={`text-xl font-bold ${net >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatCurrency(net)}</p>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">เพิ่มรายการ</h3>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">ประเภท</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none">
                <option value="INCOME">รายรับ</option>
                <option value="EXPENSE">รายจ่าย</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">จำนวน (บาท) *</label>
              <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring" />
            </div>
            {form.type === "EXPENSE" && (
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">หมวดหมู่รายจ่าย</label>
                <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none">
                  <option value="">-- ไม่ระบุ --</option>
                  {expenseCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">วันที่ *</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none" />
            </div>
            <div className="space-y-1 col-span-2">
              <label className="text-xs text-muted-foreground">รายละเอียด</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="ค่าเช่า, เงินเดือน, ยอดขาย..." className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving || !form.amount} className="h-8 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
              {saving ? "บันทึก..." : "บันทึก"}
            </button>
            <button onClick={() => setShowForm(false)} className="h-8 px-3 rounded-lg border border-border text-sm text-muted-foreground">ยกเลิก</button>
          </div>
        </div>
      )}

      {/* Transactions table */}
      <div className="rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="text-center py-10 text-muted-foreground text-sm">กำลังโหลด...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">วันที่</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">ประเภท</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden sm:table-cell">รายละเอียด</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden md:table-cell">หมวด</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">จำนวน</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.map((t: Transaction) => (
                <tr key={t.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(t.date).toLocaleDateString("th-TH", { day: "2-digit", month: "short" })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.type === "INCOME" ? "text-emerald-400 bg-emerald-400/10" : "text-red-400 bg-red-400/10"}`}>
                      {t.type === "INCOME" ? "รายรับ" : "รายจ่าย"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{t.description ?? "-"}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{t.category?.name ?? "-"}</td>
                  <td className={`px-4 py-3 text-right font-medium ${t.type === "INCOME" ? "text-emerald-400" : "text-red-400"}`}>
                    {t.type === "INCOME" ? "+" : "-"}{formatCurrency(Number(t.amount))}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">ไม่มีรายการ</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
