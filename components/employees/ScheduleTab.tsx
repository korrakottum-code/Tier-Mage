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
  const [viewMode, setViewMode] = useState<"all" | "personal">("all")
  const [selectedEmpId, setSelectedEmpId] = useState<string>("")
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ employeeId: "", workDate: formatDate(new Date()), shift: "MORNING", isLeave: false, leaveType: "" })

  const canEdit = ["ADMIN", "MANAGER"].includes(role)
  const branchEmployees = employees.filter((e) => e.branchId === branchId)

  async function load() {
    setLoading(true)
    const days = viewMode === "personal" ? 28 : 7
    const res = await fetch(`/api/employees/schedule?branchId=${branchId}&weekStart=${weekStart}&days=${days}`)
    if (res.ok) setSchedules(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [branchId, weekStart, viewMode])
  
  // Set default selected employee when changing branch or mode
  useEffect(() => {
    if (viewMode === "personal" && (!selectedEmpId || !branchEmployees.find(e => e.id === selectedEmpId))) {
      setSelectedEmpId(branchEmployees[0]?.id ?? "")
    }
  }, [viewMode, branchId, branchEmployees])

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

  // Build days array depending on view mode
  const ws = new Date(weekStart)
  const numDays = viewMode === "personal" ? 28 : 7
  const days = Array.from({ length: numDays }, (_, i) => {
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
        <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="h-9 rounded-xl border border-input bg-background px-3 text-sm outline-none font-medium text-foreground">
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        
        <div className="flex items-center bg-muted/50 p-1 rounded-xl">
          <button onClick={() => setViewMode("all")} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${viewMode === "all" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            ดูภาพรวม (สัปดาห์)
          </button>
          <button onClick={() => setViewMode("personal")} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${viewMode === "personal" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            ดูรายบุคคล (4 สัปดาห์)
          </button>
        </div>

        {viewMode === "personal" && (
          <select value={selectedEmpId} onChange={(e) => setSelectedEmpId(e.target.value)} className="h-9 rounded-xl border border-input bg-background px-3 text-sm outline-none bg-primary/5 text-primary font-bold">
            {branchEmployees.map((e) => <option key={e.id} value={e.id}>{e.name} ({e.position})</option>)}
          </select>
        )}

        <div className="flex items-center gap-1 bg-background border border-border/50 rounded-xl p-0.5">
          <button onClick={prevWeek} className="h-8 px-2.5 rounded-lg text-sm hover:bg-muted/50 transition-colors">&lt;</button>
          <span className="text-sm px-3 font-medium flex items-center gap-1.5 text-muted-foreground">
            <CalendarDays className="w-4 h-4" />
            {days[0].toLocaleDateString("th-TH", { day: "numeric", month: "short" })} — {days[days.length - 1].toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}
          </span>
          <button onClick={nextWeek} className="h-8 px-2.5 rounded-lg text-sm hover:bg-muted/50 transition-colors">&gt;</button>
        </div>
        
        {canEdit && (
          <button onClick={() => { setForm({ ...form, employeeId: viewMode === "personal" ? selectedEmpId : (branchEmployees[0]?.id ?? "") }); setShowForm(true) }} className="ml-auto flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-sm hover:bg-primary/90 transition-all active:scale-95">
            <Plus className="w-4.5 h-4.5" /> เพิ่มกะ
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
      ) : viewMode === "all" ? (
        <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-x-auto shadow-sm">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="border-b border-border/50 bg-muted/20">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground w-36">พนักงาน</th>
                {days.map((d) => (
                  <th key={d.toISOString()} className="text-center px-2 py-3 font-medium text-muted-foreground text-xs border-l border-border/30">
                    <span className="block text-foreground">{d.toLocaleDateString("th-TH", { weekday: "short" })}</span>
                    <span className="text-[10px]">{d.getDate()} {d.toLocaleDateString("th-TH", { month: "short" })}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {branchEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-bold text-sm text-foreground">{emp.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 px-1.5 py-0.5 rounded-full bg-muted w-fit">{emp.position}</p>
                  </td>
                  {days.map((d) => {
                    const dayStr = formatDate(d)
                    const daySchedules = schedules.filter((s) => s.employeeId === emp.id && s.workDate.slice(0, 10) === dayStr)
                    return (
                      <td key={dayStr} className="text-center px-1 py-3 border-l border-border/30">
                        {daySchedules.length === 0 ? (
                          <span className="text-xs text-muted-foreground/20 font-medium">—</span>
                        ) : (
                          <div className="space-y-1">
                            {daySchedules.map((s) => (
                              <div key={s.id} className="group relative w-fit mx-auto">
                                <span className={`text-xs px-2.5 py-1 rounded-lg font-bold shadow-[0_2px_10px_rgba(0,0,0,0.02)] ${s.isLeave ? "bg-red-500/10 text-red-500" : shiftColor[s.shift] ?? ""}`}>
                                  {s.isLeave ? (s.leaveType ?? "ลา") : shiftLabel[s.shift]}
                                </span>
                                {canEdit && (
                                  <button onClick={() => handleDelete(s.id)} className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white shadow-sm hidden group-hover:flex items-center justify-center animate-in zoom-in z-10">
                                    <Trash2 className="w-2.5 h-2.5" />
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
      ) : (
        /* Personal View Grid */
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {days.map((d) => {
            const dayStr = formatDate(d)
            const daySchedules = schedules.filter((s) => s.employeeId === selectedEmpId && s.workDate.slice(0, 10) === dayStr)
            const isToday = dayStr === formatDate(new Date())
            
            return (
              <div key={dayStr} className={`rounded-2xl border ${isToday ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20" : "border-border/50 bg-card"} p-3 flex flex-col min-h-[100px] shadow-sm hover:shadow-md transition-all`}>
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                    {d.toLocaleDateString("th-TH", { weekday: "long" })}
                  </span>
                  <span className={`text-lg font-black ${isToday ? "text-primary" : "text-foreground"}`}>
                    {d.getDate()}
                  </span>
                </div>
                
                <div className="flex-1 flex flex-col gap-1.5 justify-center">
                  {daySchedules.length === 0 ? (
                    <span className="text-xs text-muted-foreground/50 text-center block mt-2 font-medium">วันหยุด</span>
                  ) : (
                    daySchedules.map((s) => (
                      <div key={s.id} className="group relative w-full">
                        <div className={`text-xs px-2 py-1.5 rounded-lg font-bold text-center shadow-sm w-full ${s.isLeave ? "bg-red-500/10 text-red-500 border border-red-500/20" : `${shiftColor[s.shift]} border border-white/5`}`}>
                          {s.isLeave ? (s.leaveType ?? "ลา") : shiftLabel[s.shift]}
                        </div>
                        {canEdit && (
                          <button onClick={() => handleDelete(s.id)} className="absolute -right-1.5 -top-1.5 w-5 h-5 rounded-full bg-red-500 text-white shadow-md hidden group-hover:flex items-center justify-center z-10 animate-in zoom-in">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
