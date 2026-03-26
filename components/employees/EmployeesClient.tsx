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
  const isStaff = role === "STAFF"
  const visibleTabs = isStaff ? tabs.filter(t => t.id !== "payroll") : tabs
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
    <div className="space-y-6 relative">
      <div className="absolute top-[-20%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border/50 pb-2 overflow-x-auto custom-scrollbar">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 pointer-events-auto whitespace-nowrap border border-transparent",
                isActive ? "bg-card/80 backdrop-blur-md text-primary shadow-[0_4px_16px_rgba(0,0,0,0.03)] border-border/40" : "text-muted-foreground hover:bg-accent/40 hover:text-foreground hover:border-border/30"
              )}
            >
              <Icon className={cn("w-4 h-4 transition-transform", isActive ? "scale-110" : "")} /> {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === "schedule" && <ScheduleTab employees={employees} branches={branches} role={role} />}
      {activeTab === "attendance" && <AttendanceTab employees={employees} branches={branches} role={role} />}
      {activeTab === "payroll" && <PayrollTab branches={branches} role={role} />}

      {activeTab === "employees" && <>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาพนักงาน..."
            className="h-11 w-full rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-shadow shadow-sm placeholder:text-muted-foreground/50"
          />
        </div>
        {canEdit && (
          <button
            onClick={() => { setShowForm(true); setEditing(null); setForm({ ...emptyForm, branchId: branches[0]?.id ?? "" }) }}
            className="flex items-center justify-center gap-2 h-11 px-5 rounded-2xl bg-primary text-primary-foreground text-sm font-bold shadow-[0_4px_14px_0_rgba(217,119,6,0.2)] hover:shadow-[0_6px_20px_rgba(217,119,6,0.3)] hover:-translate-y-0.5 transition-all w-full sm:w-auto overflow-hidden group relative"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            <Plus className="w-4 h-4 shrink-0 transition-transform group-hover:rotate-180" /> <span className="relative z-10">เพิ่มพนักงาน</span>
          </button>
        )}
      </div>

      {showForm && canEdit && (
        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-5 space-y-4 shadow-[0_8px_32px_rgba(0,0,0,0.04)] animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              {editing ? "แก้ไขพนักงาน" : "เพิ่มพนักงานใหม่"}
            </h3>
            <button onClick={() => { setShowForm(false); setEditing(null) }} className="p-1 rounded-full bg-accent/50 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-semibold text-muted-foreground ml-1">ชื่อ-นามสกุล *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="สมชาย ใจดี" className="h-10 w-full rounded-xl border border-white/5 bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-shadow" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground ml-1">สาขา *</label>
              <select value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })} className="h-10 w-full rounded-xl border border-white/5 bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-shadow">
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground ml-1">ตำแหน่ง *</label>
              <input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="บาริสต้า" className="h-10 w-full rounded-xl border border-white/5 bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-shadow" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground ml-1">เบอร์โทร</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="08x-xxx-xxxx" className="h-10 w-full rounded-xl border border-white/5 bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-shadow" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground ml-1">ค่าแรง/ชั่วโมง (บาท) <span className="opacity-60 font-normal">(ไม่บังคับ Admin)</span></label>
              <input type="number" min="0" step="0.5" value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })} placeholder="0" className="h-10 w-full rounded-xl border border-white/5 bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-shadow" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground ml-1">วันเริ่มงาน</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="h-10 w-full rounded-xl border border-white/5 bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-shadow" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={saving || !form.name || !form.branchId || !form.position} className="h-10 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 disabled:opacity-50 transition-all hover:-translate-y-px">
              {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
            </button>
            <button onClick={() => { setShowForm(false); setEditing(null) }} className="h-10 px-4 rounded-xl border border-border bg-accent/50 text-sm font-medium hover:bg-accent transition-colors">ยกเลิก</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((emp) => (
          <div key={emp.id} className="group relative rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-5 flex gap-4 shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.05)] transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/5 border border-primary/20 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-300">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-foreground text-base tracking-tight">{emp.name}</p>
                  <p className="text-xs font-medium text-primary mt-0.5 bg-primary/10 px-2 py-0.5 rounded-md inline-block">{emp.position}</p>
                </div>
                {canEdit && (
                  <div className="flex gap-1.5 shrink-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(emp)} className="p-1.5 rounded-lg bg-accent/50 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(emp.id)} className="p-1.5 rounded-lg bg-destructive/10 text-destructive/70 hover:bg-destructive/20 hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                )}
              </div>
              
              <div className="mt-4 pt-3 border-t border-border/40 grid grid-cols-2 gap-2 text-xs font-medium text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="text-primary/70">📍</span>
                  <span className="truncate">{emp.branch?.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-primary/70">💰</span>
                  <span>{formatCurrency(Number(emp.hourlyRate))}/ชม.</span>
                </div>
                {emp.phone && (
                  <div className="flex items-center gap-1.5 col-span-2">
                    <span className="text-primary/70">📞</span>
                    <span>{emp.phone}</span>
                  </div>
                )}
                {emp.user && (
                  <div className="flex items-center gap-1.5 col-span-2 w-full">
                    <span className="text-primary/70">🔑</span>
                    <span className="truncate">{emp.user.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
             <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center shadow-inner">
               <Users className="w-8 h-8 opacity-40" />
             </div>
             <p className="text-sm font-semibold mt-2">ไม่พบพนักงาน</p>
          </div>
        )}
      </div>
      </>}
    </div>
  )
}
