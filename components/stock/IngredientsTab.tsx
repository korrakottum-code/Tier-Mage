"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface Branch { id: string; name: string }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Ingredient = any

interface IngredientsTabProps {
  ingredients: Ingredient[]
  branches: Branch[]
  role: string
  onAdd: (i: Ingredient) => void
  onUpdate: (i: Ingredient) => void
  onDelete: (id: string) => void
}

const emptyForm = { name: "", branchId: "", unit: "g", costPerUnit: "", minQty: "", currentQty: "", checkFrequency: "Daily", autoThreshold: "5", warnThreshold: "20" }

export function IngredientsTab({ ingredients, branches, role, onAdd, onUpdate, onDelete }: IngredientsTabProps) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Ingredient | null>(null)
  const [form, setForm] = useState({ ...emptyForm, branchId: branches[0]?.id ?? "" })
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null)

  const canEdit = ["ADMIN", "MANAGER"].includes(role)
  const filtered = ingredients.filter((i) => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase())
    const matchBranch = !selectedBranch || i.branchId === selectedBranch
    return matchSearch && matchBranch
  })

  function openEdit(i: Ingredient) {
    setEditing(i)
    setForm({ name: i.name, branchId: i.branchId, unit: i.unit, costPerUnit: String(i.costPerUnit), minQty: String(i.minQty), currentQty: String(i.currentQty), checkFrequency: i.checkFrequency, autoThreshold: String(i.autoThreshold ?? 5), warnThreshold: String(i.warnThreshold ?? 20) })
    setShowForm(true)
  }

  async function handleSave() {
    setSaving(true)
    const body = {
      ...(editing ? { id: editing.id } : {}),
      name: form.name, branchId: form.branchId, unit: form.unit,
      costPerUnit: parseFloat(form.costPerUnit) || 0,
      minQty: parseFloat(form.minQty) || 0,
      currentQty: parseFloat(form.currentQty) || 0,
      checkFrequency: form.checkFrequency,
      autoThreshold: parseFloat(form.autoThreshold) || 5,
      warnThreshold: parseFloat(form.warnThreshold) || 20,
    }
    const res = await fetch("/api/stock/ingredients", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const data = await res.json()
      editing ? onUpdate(data) : onAdd(data)
      setShowForm(false); setEditing(null); setForm({ ...emptyForm, branchId: branches[0]?.id ?? "" })
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("ลบวัตถุดิบนี้?")) return
    const res = await fetch(`/api/stock/ingredients?id=${id}`, { method: "DELETE" })
    if (res.ok) onDelete(id)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {branches.length > 1 && (
          <select
            value={selectedBranch || ""}
            onChange={(e) => setSelectedBranch(e.target.value || null)}
            className="h-8 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring"
          >
            <option value="">ทุกสาขา</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาวัตถุดิบ..."
          className="flex-1 h-8 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring"
        />
        {canEdit && (
          <button onClick={() => { setShowForm(true); setEditing(null); setForm({ ...emptyForm, branchId: branches[0]?.id ?? "" }) }}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
            <Plus className="w-4 h-4" /> เพิ่ม
          </button>
        )}
      </div>

      {showForm && canEdit && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h3 className="font-medium text-sm">{editing ? "แก้ไขวัตถุดิบ" : "เพิ่มวัตถุดิบ"}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 col-span-2">
              <label className="text-xs text-muted-foreground">ชื่อ *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="นมสด" className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">สาขา *</label>
              <select value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })} className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none">
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">หน่วย</label>
              <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="ml, g, ถุง" className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">ต้นทุน / หน่วย (บาท)</label>
              <input type="number" min="0" step="0.01" value={form.costPerUnit} onChange={(e) => setForm({ ...form, costPerUnit: e.target.value })} className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">ปริมาณขั้นต่ำ (alert)</label>
              <input type="number" min="0" step="0.01" value={form.minQty} onChange={(e) => setForm({ ...form, minQty: e.target.value })} className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">ปริมาณปัจจุบัน</label>
              <input type="number" min="0" step="0.01" value={form.currentQty} onChange={(e) => setForm({ ...form, currentQty: e.target.value })} className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">ความถี่ตรวจ</label>
              <select value={form.checkFrequency} onChange={(e) => setForm({ ...form, checkFrequency: e.target.value })} className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none">
                <option value="Daily">ทุกวัน</option>
                <option value="Weekly">ทุกสัปดาห์</option>
                <option value="Monthly">ทุกเดือน</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Smart Count: Auto % (ปรับอัตโนมัติ)</label>
              <input type="number" min="0" max="100" step="1" value={form.autoThreshold} onChange={(e) => setForm({ ...form, autoThreshold: e.target.value })} className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Smart Count: Warn % (ต้องขออนุมัติ)</label>
              <input type="number" min="0" max="100" step="1" value={form.warnThreshold} onChange={(e) => setForm({ ...form, warnThreshold: e.target.value })} className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving || !form.name || !form.branchId} className="h-8 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
              {saving ? "บันทึก..." : "บันทึก"}
            </button>
            <button onClick={() => { setShowForm(false); setEditing(null) }} className="h-8 px-3 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground">ยกเลิก</button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">วัตถุดิบ</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden md:table-cell">สาขา</th>
              <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">คงเหลือ</th>
              <th className="text-right px-4 py-2.5 font-medium text-muted-foreground hidden sm:table-cell">ต้นทุน/หน่วย</th>
              <th className="text-right px-4 py-2.5 font-medium text-muted-foreground hidden lg:table-cell">มูลค่า</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((ing) => {
              const isLow = Number(ing.currentQty) <= Number(ing.minQty)
              return (
                <tr key={ing.id} className={`hover:bg-muted/20 ${isLow ? "bg-yellow-500/5" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {isLow && <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 shrink-0" />}
                      <span className="font-medium">{ing.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{ing.branch?.name}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={isLow ? "text-yellow-400 font-medium" : ""}>{Number(ing.currentQty).toFixed(2)} {ing.unit}</span>
                    {isLow && <span className="text-xs text-muted-foreground ml-1">(min {Number(ing.minQty).toFixed(2)})</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground hidden sm:table-cell">{formatCurrency(Number(ing.costPerUnit))}</td>
                  <td className="px-4 py-3 text-right font-medium hidden lg:table-cell">{formatCurrency(Number(ing.currentQty) * Number(ing.costPerUnit))}</td>
                  <td className="px-4 py-3">
                    {canEdit && (
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => openEdit(ing)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(ing.id)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">ไม่พบวัตถุดิบ</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
