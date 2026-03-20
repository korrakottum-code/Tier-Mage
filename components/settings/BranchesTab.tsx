"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

interface Branch {
  id: string
  name: string
  type: string
  address: string | null
  phone: string | null
  isActive: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function BranchesTab({ data }: { data: any[] }) {
  const [branches, setBranches] = useState<Branch[]>(data)
  const [editing, setEditing] = useState<Branch | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: "", type: "Branch", address: "", phone: "" })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const method = editing ? "PUT" : "POST"
    const body = editing ? { ...form, id: editing.id } : form
    const res = await fetch("/api/settings/branches", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const updated = await res.json()
      if (editing) {
        setBranches((prev) => prev.map((b) => (b.id === updated.id ? updated : b)))
      } else {
        setBranches((prev) => [...prev, updated])
      }
      setEditing(null)
      setAdding(false)
      setForm({ name: "", type: "Branch", address: "", phone: "" })
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("ลบสาขานี้? (จะลบออกจากระบบถาวร)")) return
    const res = await fetch(`/api/settings/branches?id=${id}`, { method: "DELETE" })
    if (res.ok) {
      // ลบออกจาก state ทันทีเพื่อไม่ให้แสดงในรายการ
      setBranches((prev) => prev.filter((b) => b.id !== id))
    }
  }

  function startEdit(branch: Branch) {
    setEditing(branch)
    setAdding(false)
    setForm({ name: branch.name, type: branch.type, address: branch.address ?? "", phone: branch.phone ?? "" })
  }

  function startAdd() {
    setAdding(true)
    setEditing(null)
    setForm({ name: "", type: "Branch", address: "", phone: "" })
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">สาขาทั้งหมด ({branches.length})</h2>
        <Button size="sm" onClick={startAdd} className="gap-1.5">
          <Plus className="w-4 h-4" /> เพิ่มสาขา
        </Button>
      </div>

      {/* Form */}
      {(adding || editing) && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h3 className="font-medium text-sm">{editing ? "แก้ไขสาขา" : "เพิ่มสาขาใหม่"}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>ชื่อสาขา *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Tier สยาม" />
            </div>
            <div className="space-y-1.5">
              <Label>ประเภท</Label>
              <Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="Branch" />
            </div>
            <div className="space-y-1.5">
              <Label>ที่อยู่</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>เบอร์โทร</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving || !form.name}>
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setEditing(null); setAdding(false) }}>
              ยกเลิก
            </Button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {branches.map((branch) => (
          <div key={branch.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm">{branch.name}</p>
                <Badge variant="secondary" className="text-xs">{branch.type}</Badge>
                {!branch.isActive && <Badge variant="destructive" className="text-xs">ปิด</Badge>}
              </div>
              {branch.address && <p className="text-xs text-muted-foreground truncate">{branch.address}</p>}
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => startEdit(branch)}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="w-8 h-8 text-destructive hover:text-destructive" onClick={() => handleDelete(branch.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
