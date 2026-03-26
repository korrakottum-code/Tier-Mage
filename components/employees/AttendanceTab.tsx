"use client"

import { useState, useEffect } from "react"
import { Clock, LogIn, LogOut, FileHeart } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface Branch { id: string; name: string }
interface Employee { id: string; name: string; branchId: string }

interface Attendance {
  id: string
  employeeId: string
  employee: { id: string; name: string; position: string }
  workDate: string
  clockIn: string | null
  clockOut: string | null
  hoursWorked: number | null
  overtimeHours: number
  status: string
}

const statusLabel: Record<string, string> = {
  PRESENT: "มาทำงาน",
  LATE: "มาสาย",
  ABSENT: "ขาดงาน",
  LEAVE: "ลา",
}
const statusColor: Record<string, string> = {
  PRESENT: "text-emerald-400 bg-emerald-400/10",
  LATE: "text-yellow-400 bg-yellow-400/10",
  ABSENT: "text-red-400 bg-red-400/10",
  LEAVE: "text-blue-400 bg-blue-400/10",
}

export function AttendanceTab({ employees, branches, role, currentUserId }: {
  employees: Employee[]
  branches: Branch[]
  role: string
  currentUserId?: string
}) {
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "")
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [records, setRecords] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/employees/attendance?branchId=${branchId}&month=${month}`)
    if (res.ok) setRecords(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [branchId, month])

  async function clockAction(employeeId: string, action: "clockIn" | "clockOut" | "markLeave") {
    if (action === "markLeave" && !confirm("ยืนยันการบันทึกวันลาสำหรับพนักงานคนนี้?")) return
    
    setActing(employeeId)
    const res = await fetch("/api/employees/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId, action }),
    })
    if (res.ok) load()
    else {
      const err = await res.json()
      alert(err.error ?? "เกิดข้อผิดพลาด")
    }
    setActing(null)
  }

  const today = new Date().toISOString().slice(0, 10)
  const branchEmployees = employees.filter((e) => e.branchId === branchId)

  // Summary
  const presentCount = records.filter((r) => r.status === "PRESENT").length
  const lateCount = records.filter((r) => r.status === "LATE").length
  const totalHours = records.reduce((s, r) => s + Number(r.hoursWorked ?? 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="h-8 rounded-lg border border-input bg-background px-3 text-sm outline-none">
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="h-8 rounded-lg border border-input bg-background px-3 text-sm outline-none" />
        <div className="flex gap-3 text-xs text-muted-foreground ml-auto">
          <span>มาทำงาน: <strong className="text-emerald-400">{presentCount}</strong></span>
          <span>มาสาย: <strong className="text-yellow-400">{lateCount}</strong></span>
          <span>รวมชั่วโมง: <strong className="text-foreground">{totalHours.toFixed(1)}</strong></span>
        </div>
      </div>

      {/* Quick clock in/out for today */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-muted-foreground" /> บันทึกเวลาวันนี้</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {branchEmployees.map((emp) => {
            const todayRecord = records.find((r) => r.employeeId === emp.id && r.workDate.slice(0, 10) === today)
            const hasClockedIn = !!todayRecord?.clockIn
            const hasClockedOut = !!todayRecord?.clockOut
            return (
              <div key={emp.id} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{emp.name}</p>
                  {hasClockedIn && <p className="text-[10px] text-muted-foreground">เข้า {new Date(todayRecord!.clockIn!).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}</p>}
                </div>
                {!hasClockedIn && todayRecord?.status !== "LEAVE" && todayRecord?.status !== "ABSENT" ? (
                  <div className="flex gap-1">
                    <button onClick={() => clockAction(emp.id, "clockIn")} disabled={acting === emp.id} className="h-7 px-2.5 rounded-lg bg-emerald-500/10 text-emerald-500 font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-500/20 disabled:opacity-50 transition-colors shadow-sm">
                      <LogIn className="w-3.5 h-3.5" /> เข้างาน
                    </button>
                    <button onClick={() => clockAction(emp.id, "markLeave")} disabled={acting === emp.id} className="h-7 px-2.5 rounded-lg bg-blue-500/10 text-blue-500 font-bold text-xs flex items-center gap-1.5 hover:bg-blue-500/20 disabled:opacity-50 transition-colors shadow-sm">
                      <FileHeart className="w-3.5 h-3.5" /> ลา
                    </button>
                  </div>
                ) : !hasClockedOut && todayRecord?.status !== "LEAVE" && todayRecord?.status !== "ABSENT" ? (
                  <button onClick={() => clockAction(emp.id, "clockOut")} disabled={acting === emp.id} className="h-7 px-3 rounded-lg bg-orange-500/10 text-orange-500 font-bold text-xs flex items-center gap-1.5 hover:bg-orange-500/20 disabled:opacity-50 transition-colors shadow-sm">
                    <LogOut className="w-3.5 h-3.5" /> ออกงาน
                  </button>
                ) : (
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${statusColor[todayRecord?.status ?? "PRESENT"]}`}>
                    {todayRecord?.status === "LEAVE" ? "ลางาน" : todayRecord?.status === "ABSENT" ? "ขาดงาน" : `${Number(todayRecord!.hoursWorked ?? 0).toFixed(1)} ชม.`}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* History table */}
      {loading ? (
        <div className="text-center py-10 text-muted-foreground text-sm">กำลังโหลด...</div>
      ) : (
        <div className="rounded-xl border border-border overflow-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">พนักงาน</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">วันที่</th>
                <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">เข้า</th>
                <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">ออก</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">ชม.</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">OT</th>
                <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-muted/10">
                  <td className="px-4 py-2 text-xs font-medium">{r.employee.name}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(r.workDate).toLocaleDateString("th-TH", { dateStyle: "short" })}</td>
                  <td className="px-4 py-2 text-xs text-center">{r.clockIn ? new Date(r.clockIn).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                  <td className="px-4 py-2 text-xs text-center">{r.clockOut ? new Date(r.clockOut).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                  <td className="px-4 py-2 text-xs text-right">{r.hoursWorked != null ? Number(r.hoursWorked).toFixed(1) : "—"}</td>
                  <td className="px-4 py-2 text-xs text-right">{Number(r.overtimeHours) > 0 ? Number(r.overtimeHours).toFixed(1) : "—"}</td>
                  <td className="px-4 py-2 text-center">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor[r.status] ?? ""}`}>
                      {statusLabel[r.status] ?? r.status}
                    </span>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-muted-foreground text-sm">ไม่มีข้อมูล</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
