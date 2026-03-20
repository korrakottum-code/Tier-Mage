"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, CalendarDays } from "lucide-react"

interface Branch { id: string; name: string }
interface Employee { id: string; name: string; position: string; branchId: string }

interface Schedule {
  id: string
  employeeId: string
  employee: { id: string; name: string; position: string }
  workDate: string
  shift: string
  isLeave: boolean
  leaveType: string | null
}

const shiftLabel: Record<string, string> = {
  MORNING: "เช้า",
  AFTERNOON: "บ่าย",
  EVENING: "ค่ำ",
}
const shiftColor: Record<string, string> = {
  MORNING: "bg-amber-400/10 text-amber-400",
  AFTERNOON: "bg-blue-400/10 text-blue-400",
  EVENING: "bg-purple-400/10 text-purple-400",
}

function getWeekStart(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

export function ScheduleTab({ employees, branches, role }: { employees: Employee[]; branches: Branch[]; role: string }) {
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "")
  const [weekStart, setWeekStart] = useState(formatDate(getWeekStart(new Date())))
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ employeeId: "", workDate: formatDate(new Date()), shift: "MORNING", isLeave: false, leaveType: "" })

  const canEdit = ["ADMIN", "MANAGER"].includes(role)
  const branchEmployees = employees.filter((e) => e.branchId === branchId)

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/employees/schedule?branchId=${branchId}&weekStart=${weekStart}`)
    if (res.ok) setSchedules(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [branchId, weekStart])

  async function handleAdd() {
    if (!form.employeeId || !form.workDate) return
    const res = await fetch("/api/employees/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      load()
      setShowForm(false)
      setForm({ employeeId: branchEmployees[0]?.id ?? "", workDate: formatDate(new Date()), shift: "MORNING", isLeave: false, leaveType: "" })
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("ลบกะนี้?")) return
    await fetch(`/api/employees/schedule?id=${id}`, { method: "DELETE" })
    setSchedules((p) => p.filter((s) => s.id !== id))
  }

  // Build week days
  const ws = new Date(weekStart)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(ws)
    d.setDate(d.getDate() + i)
    return d
  })

  function prevWeek() {
    const d = new Date(weekStart)
    d.setDate(d.getDate() - 7)
    setWeekStart(formatDate(d))
  }
  function nextWeek() {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + 7)
    setWeekStart(formatDate(d))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="h-8 rounded-lg border border-input bg-background px-3 text-sm outline-none">
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <div className="flex items-center gap-1">
          <button onClick={prevWeek} className="h-8 px-2 rounded-lg border border-border text-sm hover:bg-muted/30">&lt;</button>
          <span className="text-sm px-2 font-medium flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
            {days[0].toLocaleDateString("th-TH", { day: "numeric", month: "short" })} — {days[6].toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}
          </span>
          <button onClick={nextWeek} className="h-8 px-2 rounded-lg border border-border text-sm hover:bg-muted/30">&gt;</button>
        </div>
        {canEdit && (
          <button onClick={() => { setForm({ ...form, employeeId: branchEmployees[0]?.id ?? "" }); setShowForm(true) }} className="ml-auto flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
            <Plus className="w-4 h-4" /> เพิ่มกะ
          </button>
        )}
      </div>

      {showForm && (
        <div className="rounded-xl border border-border bg-card p-4 grid grid-cols-2 sm:grid-cols-5 gap-3 items-end">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">พนักงาน</label>
            <select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none">
              {branchEmployees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">วันที่</label>
            <input type="date" value={form.workDate} onChange={(e) => setForm({ ...form, workDate: e.target.value })} className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">กะ</label>
            <select value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value })} className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none">
              {Object.entries(shiftLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 h-8">
            <label className="text-xs text-muted-foreground flex items-center gap-1">
              <input type="checkbox" checked={form.isLeave} onChange={(e) => setForm({ ...form, isLeave: e.target.checked })} /> ลา
            </label>
            {form.isLeave && <input value={form.leaveType} onChange={(e) => setForm({ ...form, leaveType: e.target.value })} placeholder="ประเภทลา" className="h-8 flex-1 rounded-lg border border-input bg-background px-2.5 text-xs outline-none" />}
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium">บันทึก</button>
            <button onClick={() => setShowForm(false)} className="h-8 px-3 rounded-lg border border-border text-sm text-muted-foreground">ยกเลิก</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-muted-foreground text-sm">กำลังโหลด...</div>
      ) : (
        <div className="rounded-xl border border-border overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground w-32">พนักงาน</th>
                {days.map((d) => (
                  <th key={d.toISOString()} className="text-center px-2 py-2.5 font-medium text-muted-foreground text-xs">
                    {d.toLocaleDateString("th-TH", { weekday: "short" })}<br />{d.getDate()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {branchEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-muted/10">
                  <td className="px-3 py-2">
                    <p className="font-medium text-xs">{emp.name}</p>
                    <p className="text-xs text-muted-foreground">{emp.position}</p>
                  </td>
                  {days.map((d) => {
                    const dayStr = formatDate(d)
                    const daySchedules = schedules.filter((s) => s.employeeId === emp.id && s.workDate.slice(0, 10) === dayStr)
                    return (
                      <td key={dayStr} className="text-center px-1 py-2">
                        {daySchedules.length === 0 ? (
                          <span className="text-xs text-muted-foreground/30">—</span>
                        ) : (
                          <div className="space-y-0.5">
                            {daySchedules.map((s) => (
                              <div key={s.id} className="group relative">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${s.isLeave ? "bg-red-400/10 text-red-400" : shiftColor[s.shift] ?? ""}`}>
                                  {s.isLeave ? (s.leaveType ?? "ลา") : shiftLabel[s.shift]}
                                </span>
                                {canEdit && (
                                  <button onClick={() => handleDelete(s.id)} className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white hidden group-hover:flex items-center justify-center">
                                    <Trash2 className="w-2 h-2" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
