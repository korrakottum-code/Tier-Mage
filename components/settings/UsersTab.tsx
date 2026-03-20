"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, User, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

interface UserData {
  id: string
  email: string
  role: string
  employeeId: string | null
  employee?: { name: string; branchId: string } | null
}

const roleColors: Record<string, string> = {
  ADMIN: "bg-red-500/10 text-red-400 border-red-500/20",
  MANAGER: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  STAFF: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  VIEWER: "bg-muted text-muted-foreground",
}
const roleLabel: Record<string, string> = {
  ADMIN: "Admin", MANAGER: "ผู้จัดการ", STAFF: "พนักงาน", VIEWER: "ผู้ดู",
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function UsersTab({ data }: { data: any[] }) {
  const [users, setUsers] = useState<UserData[]>(data)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<UserData | null>(null)
  const [form, setForm] = useState({ email: "", password: "", role: "STAFF" })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState("")

  async function handleSave() {
    setSaving(true); setMsg("")
    const body = editing
      ? { id: editing.id, email: form.email, role: form.role, ...(form.password ? { password: form.password } : {}) }
      : { email: form.email, password: form.password, role: form.role }
    const res = await fetch("/api/settings/users", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const updated = await res.json()
      if (editing) setUsers((p) => p.map((u) => (u.id === updated.id ? updated : u)))
      else setUsers((p) => [...p, updated])
      setEditing(null); setAdding(false)
      setForm({ email: "", password: "", role: "STAFF" })
    } else {
      const err = await res.json()
      setMsg(err.error ?? "เกิดข้อผิดพลาด")
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("ลบผู้ใช้นี้?")) return
    const res = await fetch(`/api/settings/users?id=${id}`, { method: "DELETE" })
    if (res.ok) setUsers((p) => p.filter((u) => u.id !== id))
  }

  function startEdit(u: UserData) {
    setEditing(u); setAdding(false)
    setForm({ email: u.email, password: "", role: u.role })
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">ผู้ใช้งาน ({users.length})</h2>
        <Button size="sm" onClick={() => { setAdding(true); setEditing(null) }} className="gap-1.5">
          <Plus className="w-4 h-4" /> เพิ่มผู้ใช้
        </Button>
      </div>

      {(adding || editing) && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h3 className="font-medium text-sm">{editing ? "แก้ไขผู้ใช้" : "เพิ่มผู้ใช้ใหม่"}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label>อีเมล *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="user@tiercoffee.com" />
            </div>
            <div className="space-y-1.5">
              <Label>{editing ? "PIN / รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)" : "PIN / รหัสผ่าน *"}</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••" />
            </div>
            <div className="space-y-1.5">
              <Label>บทบาท</Label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">ผู้จัดการ</option>
                <option value="STAFF">พนักงาน</option>
                <option value="VIEWER">ผู้ดู</option>
              </select>
            </div>
          </div>
          {msg && <p className="text-xs text-destructive">{msg}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving || !form.email || (!editing && !form.password)}>
              {saving ? "บันทึก..." : "บันทึก"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setEditing(null); setAdding(false); setMsg("") }}>ยกเลิก</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-sm">{u.employee?.name ?? u.email}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${roleColors[u.role]}`}>
                  {roleLabel[u.role]}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{u.email}</p>
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => startEdit(u)}><Pencil className="w-3.5 h-3.5" /></Button>
              <Button size="icon" variant="ghost" className="w-8 h-8 text-destructive hover:text-destructive" onClick={() => handleDelete(u.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
