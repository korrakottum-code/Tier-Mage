"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, User, X, Users, CalendarDays, Clock, Banknote } from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import { ScheduleTab } from "@/components/employees/ScheduleTab"
import { AttendanceTab } from "@/components/employees/AttendanceTab"
import { PayrollTab } from "@/components/employees/PayrollTab"

interface Branch { id: string; name: string }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Employee = any

interface EmployeesClientProps {
  initialEmployees: Employee[]
  branches: Branch[]
  role: string
}

const emptyForm = { name: "", branchId: "", position: "", phone: "", hourlyRate: "", startDate: new Date().toISOString().slice(0, 10) }

const tabs = [
  { id: "employees", label: "พนักงาน", icon: Users },
  { id: "schedule", label: "ตารางกะ", icon: CalendarDays },
  { id: "attendance", label: "เวลาเข้างาน", icon: Clock },
  { id: "payroll", label: "เงินเดือน", icon: Banknote },
] as const

export function EmployeesClient({ initialEmployees, branches, role }: EmployeesClientProps) {
  const [activeTab, setActiveTab] = useState<string>("employees")
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [form, setForm] = useState({ ...emptyForm, branchId: branches[0]?.id ?? "" })
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")

  const canEdit = ["ADMIN", "MANAGER"].includes(role)
  const filtered = employees.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.position.toLowerCase().includes(search.toLowerCase())
  )

  function openEdit(e: Employee) {
    setEditing(e)
    setForm({
      name: e.name, branchId: e.branchId, position: e.position,
      phone: e.phone ?? "", hourlyRate: String(e.hourlyRate),
      startDate: new Date(e.startDate).toISOString().slice(0, 10),
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.name || !form.branchId || !form.position) return
    // For non-Admin roles, hourlyRate is required
    if (role !== "ADMIN" && !form.hourlyRate) return
    setSaving(true)
    const body = {
      ...(editing ? { id: editing.id } : {}),
      name: form.name, branchId: form.branchId, position: form.position,
      phone: form.phone || null, hourlyRate: parseFloat(form.hourlyRate) || 0,
      startDate: form.startDate,
    }
    const res = await fetch("/api/employees", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const data = await res.json()
      editing ? setEmployees((p) => p.map((e) => e.id === data.id ? data : e)) : setEmployees((p) => [...p, data])
      setShowForm(false); setEditing(null); setForm({ ...emptyForm, branchId: branches[0]?.id ?? "" })
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("ปิดการใช้งานพนักงานนี้?")) return
    const res = await fetch(`/api/employees?id=${id}`, { method: "DELETE" })
    if (res.ok) setEmployees((p) => p.filter((e) => e.id !== id))
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border -mx-1 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap",
                activeTab === tab.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === "schedule" && <ScheduleTab employees={employees} branches={branches} role={role} />}
      {activeTab === "attendance" && <AttendanceTab employees={employees} branches={branches} role={role} />}
      {activeTab === "payroll" && <PayrollTab branches={branches} role={role} />}

      {activeTab === "employees" && <>
      <div className="flex items-center gap-3">
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาพนักงาน..."
          className="flex-1 h-8 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring"
        />
        {canEdit && (
          <button
            onClick={() => { setShowForm(true); setEditing(null); setForm({ ...emptyForm, branchId: branches[0]?.id ?? "" }) }}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" /> เพิ่มพนักงาน
          </button>
        )}
      </div>

      {showForm && canEdit && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">{editing ? "แก้ไขพนักงาน" : "เพิ่มพนักงานใหม่"}</h3>
            <button onClick={() => { setShowForm(false); setEditing(null) }} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 col-span-2">
              <label className="text-xs text-muted-foreground">ชื่อ-นามสกุล *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="สมชาย ใจดี" className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">สาขา *</label>
              <select value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })} className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none">
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">ตำแหน่ง *</label>
              <input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="บาริสต้า" className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">เบอร์โทร</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="08x-xxx-xxxx" className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">ค่าแรง/ชั่วโมง (บาท) <span className="text-muted-foreground/60">(ไม่บังคับสำหรับ Admin)</span></label>
              <input type="number" min="0" step="0.5" value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })} placeholder="0" className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">วันเริ่มงาน</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving || !form.name || !form.branchId || !form.position} className="h-8 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
              {saving ? "บันทึก..." : "บันทึก"}
            </button>
            <button onClick={() => { setShowForm(false); setEditing(null) }} className="h-8 px-3 rounded-lg border border-border text-sm text-muted-foreground">ยกเลิก</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((emp) => (
          <div key={emp.id} className="rounded-xl border border-border bg-card p-4 flex gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-sm">{emp.name}</p>
                  <p className="text-xs text-muted-foreground">{emp.position} · {emp.branch?.name}</p>
                </div>
                {canEdit && (
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openEdit(emp)} className="p-1 rounded text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(emp.id)} className="p-1 rounded text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                )}
              </div>
              <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                {emp.phone && <span>📞 {emp.phone}</span>}
                <span>💰 {formatCurrency(Number(emp.hourlyRate))}/ชม.</span>
              </div>
              {emp.user && (
                <p className="text-xs text-muted-foreground mt-1">
                  🔑 {emp.user.email}
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-muted text-[10px]">{emp.user.role}</span>
                </p>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-10 text-muted-foreground text-sm">ไม่พบพนักงาน</div>
        )}
      </div>
      </>}
    </div>
  )
}
