"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

interface PaymentChannel {
  id: string
  name: string
  type: string
  gpPercent: number
  feePercent: number
  settlementDays: number
  isActive: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function PaymentChannelsTab({ data }: { data: any[] }) {
  const [channels, setChannels] = useState<PaymentChannel[]>(data)
  const [editing, setEditing] = useState<PaymentChannel | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: "", type: "INSTANT", gpPercent: "0", feePercent: "0", settlementDays: "0" })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const body = {
      ...(editing ? { id: editing.id } : {}),
      name: form.name,
      type: form.type,
      gpPercent: parseFloat(form.gpPercent),
      feePercent: parseFloat(form.feePercent),
      settlementDays: parseInt(form.settlementDays),
    }
    const res = await fetch("/api/settings/payment-channels", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const updated = await res.json()
      if (editing) setChannels((p) => p.map((c) => (c.id === updated.id ? updated : c)))
      else setChannels((p) => [...p, updated])
      setEditing(null); setAdding(false)
      setForm({ name: "", type: "INSTANT", gpPercent: "0", feePercent: "0", settlementDays: "0" })
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("ลบช่องทางนี้?")) return
    const res = await fetch(`/api/settings/payment-channels?id=${id}`, { method: "DELETE" })
    if (res.ok) setChannels((p) => p.filter((c) => c.id !== id))
  }

  function startEdit(ch: PaymentChannel) {
    setEditing(ch); setAdding(false)
    setForm({ name: ch.name, type: ch.type, gpPercent: String(ch.gpPercent), feePercent: String(ch.feePercent), settlementDays: String(ch.settlementDays) })
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">ช่องทางรับเงิน ({channels.length})</h2>
        <Button size="sm" onClick={() => { setAdding(true); setEditing(null) }} className="gap-1.5">
          <Plus className="w-4 h-4" /> เพิ่มช่องทาง
        </Button>
      </div>

      {(adding || editing) && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h3 className="font-medium text-sm">{editing ? "แก้ไขช่องทาง" : "เพิ่มช่องทางใหม่"}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label>ชื่อช่องทาง *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Grab Food" />
            </div>
            <div className="space-y-1.5">
              <Label>ประเภท</Label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="INSTANT">รับเงินทันที</option>
                <option value="DEFERRED">รับภายหลัง</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>วันที่รับเงิน (วัน)</Label>
              <Input type="number" min="0" value={form.settlementDays} onChange={(e) => setForm({ ...form, settlementDays: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>GP % (หัก)</Label>
              <Input type="number" min="0" max="100" step="0.1" value={form.gpPercent} onChange={(e) => setForm({ ...form, gpPercent: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>ค่าธรรมเนียม %</Label>
              <Input type="number" min="0" max="100" step="0.1" value={form.feePercent} onChange={(e) => setForm({ ...form, feePercent: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving || !form.name}>{saving ? "กำลังบันทึก..." : "บันทึก"}</Button>
            <Button size="sm" variant="outline" onClick={() => { setEditing(null); setAdding(false) }}>ยกเลิก</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {channels.map((ch) => (
          <div key={ch.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-sm">{ch.name}</p>
                <Badge variant={ch.type === "INSTANT" ? "default" : "secondary"} className="text-xs">
                  {ch.type === "INSTANT" ? "ทันที" : `รับใน ${ch.settlementDays} วัน`}
                </Badge>
                {Number(ch.gpPercent) > 0 && <span className="text-xs text-muted-foreground">GP {ch.gpPercent}%</span>}
                {!ch.isActive && <Badge variant="destructive" className="text-xs">ปิด</Badge>}
              </div>
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => startEdit(ch)}><Pencil className="w-3.5 h-3.5" /></Button>
              <Button size="icon" variant="ghost" className="w-8 h-8 text-destructive hover:text-destructive" onClick={() => handleDelete(ch.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
