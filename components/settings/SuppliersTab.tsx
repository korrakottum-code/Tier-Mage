"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, X, Truck } from "lucide-react"

interface Supplier {
  id: string
  name: string
  contact: string | null
  phone: string | null
  _count?: { movements: number }
}

export function SuppliersTab() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [form, setForm] = useState({ name: "", contact: "", phone: "" })
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const res = await fetch("/api/suppliers")
    if (res.ok) setSuppliers(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openEdit(s: Supplier) {
    setEditing(s)
    setForm({ name: s.name, contact: s.contact ?? "", phone: s.phone ?? "" })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.name) return
    setSaving(true)
    const res = await fetch("/api/suppliers", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...(editing ? { id: editing.id } : {}), ...form }),
    })
    if (res.ok) {
      load()
      setShowForm(false)
      setEditing(null)
      setForm({ name: "", contact: "", phone: "" })
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("ลบ Supplier นี้?")) return
    const res = await fetch(`/api/suppliers?id=${id}`, { method: "DELETE" })
    if (res.ok) setSuppliers((p) => p.filter((s) => s.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2"><Truck className="w-4 h-4 text-muted-foreground" /> Suppliers ({suppliers.length})</h3>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: "", contact: "", phone: "" }) }} className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> เพิ่ม
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">{editing ? "แก้ไข Supplier" : "เพิ่ม Supplier"}</h4>
            <button onClick={() => { setShowForm(false); setEditing(null) }}><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">ชื่อ *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">ผู้ติดต่อ</label>
              <input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">เบอร์โทร</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving || !form.name} className="h-8 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">{saving ? "บันทึก..." : "บันทึก"}</button>
            <button onClick={() => { setShowForm(false); setEditing(null) }} className="h-8 px-3 rounded-lg border border-border text-sm text-muted-foreground">ยกเลิก</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-muted-foreground text-sm">กำลังโหลด...</div>
      ) : suppliers.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm">ยังไม่มี Supplier</div>
      ) : (
        <div className="space-y-2">
          {suppliers.map((s) => (
            <div key={s.id} className="rounded-xl border border-border bg-card p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{s.name}</p>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  {s.contact && <span>{s.contact}</span>}
                  {s.phone && <span>{s.phone}</span>}
                  {s._count && <span>{s._count.movements} รายการ</span>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEdit(s)} className="p-1.5 rounded text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
