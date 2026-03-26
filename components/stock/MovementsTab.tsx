"use client"

import { useState, useEffect } from "react"
import { Plus, X } from "lucide-react"
import Select from "react-select"
import { formatCurrency } from "@/lib/utils"

interface Branch { id: string; name: string }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Ingredient = any

const movementTypes = [
  { value: "PURCHASE", label: "รับเข้า (ซื้อ)", color: "text-emerald-400" },
  { value: "WASTE", label: "ของเสีย / ทิ้ง", color: "text-red-400" },
  { value: "TRANSFER", label: "โอนระหว่างสาขา", color: "text-blue-400" },
  { value: "ADJUSTMENT", label: "ปรับแต่ง", color: "text-yellow-400" },
]

interface MovementsTabProps {
  ingredients: Ingredient[]
  branches: Branch[]
  role: string
  currentBranchId: string | null
}

export function MovementsTab({ ingredients, branches, role, currentBranchId }: MovementsTabProps) {
  const [showForm, setShowForm] = useState(false)
  const [movements, setMovements] = useState<Record<string, unknown>[]>([])
  const [loaded, setLoaded] = useState(false)
  const [form, setForm] = useState({
    ingredientId: ingredients[0]?.id ?? "",
    type: "PURCHASE",
    quantity: "",
    cost: "",
    note: "",
    fromBranchId: "",
    toBranchId: "",
  })
  const [saving, setSaving] = useState(false)

  async function loadMovements() {
    const params = new URLSearchParams()
    if (currentBranchId) params.append("branchId", currentBranchId)
    const res = await fetch(`/api/stock/movements?${params.toString()}`)
    if (res.ok) { setMovements(await res.json()); setLoaded(true) }
  }

  useEffect(() => {
    loadMovements()
  }, [currentBranchId])

  async function handleSave() {
    if (!form.ingredientId || !form.quantity) return
    setSaving(true)
    const res = await fetch("/api/stock/movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ingredientId: form.ingredientId,
        type: form.type,
        quantity: parseFloat(form.quantity),
        cost: form.cost ? parseFloat(form.cost) : null,
        note: form.note || null,
        fromBranchId: form.fromBranchId || null,
        toBranchId: form.toBranchId || null,
      }),
    })
    if (res.ok) {
      const m = await res.json()
      setMovements((p) => [m, ...p])
      setShowForm(false)
      setForm({ ingredientId: ingredients[0]?.id ?? "", type: "PURCHASE", quantity: "", cost: "", note: "", fromBranchId: "", toBranchId: "" })
    }
    setSaving(false)
  }

  const typeColorMap: Record<string, string> = {
    PURCHASE: "text-emerald-400 bg-emerald-400/10",
    WASTE: "text-red-400 bg-red-400/10",
    TRANSFER: "text-blue-400 bg-blue-400/10",
    ADJUSTMENT: "text-yellow-400 bg-yellow-400/10",
    SALE: "text-muted-foreground bg-muted",
  }
  const typeLabelMap: Record<string, string> = {
    PURCHASE: "รับเข้า", WASTE: "ของเสีย", TRANSFER: "โอน", ADJUSTMENT: "ปรับ", SALE: "ขาย",
  }

  const ingredientOptions = ingredients.map(i => ({
    value: i.id,
    label: `${i.name} (${i.unit}) — คงเหลือ ${Number(i.currentQty).toFixed(2)}`
  }))

  const selectStyles = {
    control: (base: any) => ({
      ...base,
      minHeight: '2rem',
      borderRadius: '0.5rem',
      backgroundColor: 'hsl(var(--background))',
      borderColor: 'hsl(var(--input))',
      fontSize: '0.875rem',
      boxShadow: 'none',
      '&:hover': {
        borderColor: 'hsl(var(--ring))'
      }
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: 'hsl(var(--popover))',
      border: '1px solid hsl(var(--border))',
      borderRadius: '0.5rem',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      zIndex: 50
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused ? 'hsl(var(--accent))' : 'transparent',
      color: state.isFocused ? 'hsl(var(--accent-foreground))' : 'hsl(var(--popover-foreground))',
      fontSize: '0.875rem',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: 'hsl(var(--accent))'
      }
    }),
    singleValue: (base: any) => ({
      ...base,
      color: 'hsl(var(--foreground))'
    }),
    input: (base: any) => ({
      ...base,
      color: 'hsl(var(--foreground))'
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" /> บันทึกการเคลื่อนไหว
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-4 shadow-sm animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h3 className="font-semibold text-foreground">บันทึกการเคลื่อนไหวสต็อก</h3>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-foreground">วัตถุดิบ *</label>
              <Select
                options={ingredientOptions}
                value={ingredientOptions.find(o => o.value === form.ingredientId)}
                onChange={(option) => { 
                  if (option) setForm({ ...form, ingredientId: option.value }); 
                }}
                placeholder="ค้นหาวัตถุดิบ..."
                isSearchable
                styles={selectStyles}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">ประเภท *</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-1">
                {movementTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">ปริมาณ *</label>
              <input type="number" min="0" step="0.01" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-1" placeholder="0.00" />
            </div>
            {form.type === "PURCHASE" && (
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-foreground">ราคาต้นทุนรวม (บาท)</label>
                <input type="number" min="0" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-1" placeholder="0.00" />
              </div>
            )}
            {form.type === "TRANSFER" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">จากสาขา</label>
                  <select value={form.fromBranchId} onChange={(e) => setForm({ ...form, fromBranchId: e.target.value })} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-1">
                    <option value="">-- เลือก --</option>
                    {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">ไปสาขา</label>
                  <select value={form.toBranchId} onChange={(e) => setForm({ ...form, toBranchId: e.target.value })} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-1">
                    <option value="">-- เลือก --</option>
                    {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </>
            )}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-foreground">หมายเหตุ</label>
              <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="เพิ่มคำอธิบาย..." className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-1" />
            </div>
          </div>
          <div className="flex gap-2 pt-2 border-t border-border mt-4">
            <button onClick={handleSave} disabled={saving || !form.ingredientId || !form.quantity} className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 hover:bg-primary/90 transition-colors">
              {saving ? "กำลังบันทึก..." : "บันทึกรายการ"}
            </button>
            <button onClick={() => setShowForm(false)} className="h-10 px-4 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">ยกเลิก</button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">วัตถุดิบ</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">ประเภท</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">ปริมาณ</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell whitespace-nowrap">ต้นทุน</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">หมายเหตุ</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell whitespace-nowrap">เวลา</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {movements.map((m: any) => (
                <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{m.ingredient?.name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold whitespace-nowrap ${typeColorMap[m.type] ?? ""}`}>
                      {typeLabelMap[m.type] ?? m.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{Number(m.quantity).toFixed(2)} <span className="text-muted-foreground text-xs font-normal">{m.ingredient?.unit}</span></td>
                  <td className="px-4 py-3 text-right text-muted-foreground hidden sm:table-cell">
                    {m.cost ? formatCurrency(Number(m.cost)) : "-"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-xs">{m.note ?? "-"}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell whitespace-nowrap">
                    {new Date(m.createdAt).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}
                  </td>
                </tr>
              ))}
              {movements.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">ยังไม่มีการเคลื่อนไหวของสต็อก</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
