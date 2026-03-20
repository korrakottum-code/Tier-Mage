"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ShiftConfig {
  id: string
  name: string
  startTime: string
  endTime: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ShiftsTab({ data }: { data: any[] }) {
  const [shifts, setShifts] = useState<ShiftConfig[]>(data)
  const [editing, setEditing] = useState<ShiftConfig | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: "", startTime: "08:00", endTime: "16:00" })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const body = editing ? { ...form, id: editing.id } : form
    const res = await fetch("/api/settings/shifts", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const updated = await res.json()
      if (editing) setShifts((p) => p.map((s) => (s.id === updated.id ? updated : s)))
      else setShifts((p) => [...p, updated])
      setEditing(null); setAdding(false)
      setForm({ name: "", startTime: "08:00", endTime: "16:00" })
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("ลบกะนี้?")) return
    const res = await fetch(`/api/settings/shifts?id=${id}`, { method: "DELETE" })
    if (res.ok) setShifts((p) => p.filter((s) => s.id !== id))
  }

  function startEdit(s: ShiftConfig) {
    setEditing(s); setAdding(false)
    setForm({ name: s.name, startTime: s.startTime, endTime: s.endTime })
  }

  return (
    <div className="space-y-4 max-w-lg">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">กะการทำงาน ({shifts.length})</h2>
        <Button size="sm" onClick={() => { setAdding(true); setEditing(null) }} className="gap-1.5">
          <Plus className="w-4 h-4" /> เพิ่มกะ
        </Button>
      </div>

      {(adding || editing) && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h3 className="font-medium text-sm">{editing ? "แก้ไขกะ" : "เพิ่มกะใหม่"}</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5 col-span-3">
              <Label>ชื่อกะ *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="เช้า" />
            </div>
            <div className="space-y-1.5">
              <Label>เริ่ม</Label>
              <Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>สิ้นสุด</Label>
              <Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving || !form.name}>{saving ? "บันทึก..." : "บันทึก"}</Button>
            <Button size="sm" variant="outline" onClick={() => { setEditing(null); setAdding(false) }}>ยกเลิก</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {shifts.map((s) => (
          <div key={s.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{s.name}</p>
              <p className="text-xs text-muted-foreground">{s.startTime} – {s.endTime}</p>
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => startEdit(s)}><Pencil className="w-3.5 h-3.5" /></Button>
              <Button size="icon" variant="ghost" className="w-8 h-8 text-destructive hover:text-destructive" onClick={() => handleDelete(s.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
