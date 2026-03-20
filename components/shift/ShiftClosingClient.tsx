"use client"

import React, { useState, useEffect } from "react"
import { Plus, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, Upload, Paperclip, CalendarIcon } from "lucide-react"
import { formatCurrency, cn } from "@/lib/utils"
import { format } from "date-fns"
import { th } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface Branch { id: string; name: string }
interface Employee { id: string; name: string }

interface ShiftClosing {
  id: string
  branchId: string
  branch: { id: string; name: string }
  employee: { id: string; name: string }
  shiftDate: string
  shift: string
  cashExpected: number
  cashActual: number | null
  cashDifference: number | null
  transferExpected: number
  transferActual: number | null
  transferDifference: number | null
  status: string
  reviewedBy: string | null
  reviewNote: string | null
  closedAt: string
  slips: { id: string; fileName: string; amount: number; uploadedAt: string }[]
}

const shiftLabel: Record<string, string> = {
  MORNING: "เช้า (08:00-14:00)",
  AFTERNOON: "บ่าย (14:00-20:00)",
  EVENING: "ค่ำ (20:00-24:00)",
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: "รออนุมัติ", color: "text-yellow-400 bg-yellow-400/10", icon: Clock },
  APPROVED: { label: "อนุมัติ", color: "text-emerald-400 bg-emerald-400/10", icon: CheckCircle },
  REJECTED: { label: "ปฏิเสธ", color: "text-red-400 bg-red-400/10", icon: XCircle },
  AUTO_APPROVED: { label: "ผ่านอัตโนมัติ", color: "text-blue-400 bg-blue-400/10", icon: CheckCircle },
}

const emptyForm = {
  branchId: "",
  shift: "MORNING",
  startingCash: "",
  cashExpected: "",
  cashActual: "",
  transferExpected: "",
  transferActual: "",
}

export function ShiftClosingClient({
  branches,
  role,
}: {
  branches: Branch[]
  role: string
}) {
  const [closings, setClosings] = useState<ShiftClosing[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...emptyForm, branchId: branches[0]?.id ?? "" })
  const [formDate, setFormDate] = useState<Date>(new Date())
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterBranch, setFilterBranch] = useState(branches[0]?.id ?? "")
  const [reviewId, setReviewId] = useState<string | null>(null)
  const [reviewNote, setReviewNote] = useState("")
  const [uploadingId, setUploadingId] = useState<string | null>(null)

  const canManage = ["ADMIN", "MANAGER"].includes(role)

  async function handleSlipUpload(closingId: string, file: File, amount: string) {
    if (!file || !amount) return
    setUploadingId(closingId)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("shiftClosingId", closingId)
    formData.append("amount", amount)
    const res = await fetch("/api/upload", { method: "POST", body: formData })
    if (res.ok) {
      const slip = await res.json()
      setClosings((prev) => prev.map((c) =>
        c.id === closingId ? { ...c, slips: [...c.slips, slip] } : c
      ))
    }
    setUploadingId(null)
  }

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/shift-closing?branchId=${filterBranch}`)
    if (res.ok) setClosings(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [filterBranch])

  async function fetchExpected() {
    const dateStr = format(formDate, 'yyyy-MM-dd')
    const res = await fetch(`/api/shift-closing/expected?branchId=${form.branchId}&date=${dateStr}`)
    if (res.ok) {
      const data = await res.json()
      setForm((prev) => ({
        ...prev,
        cashExpected: String(Math.round(data.cashExpected)),
        transferExpected: String(Math.round(data.transferExpected)),
      }))
    }
  }

  async function handleSubmit() {
    if (!form.branchId || !formDate) return
    setSaving(true)
    const res = await fetch("/api/shift-closing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        shiftDate: format(formDate, 'yyyy-MM-dd'),
        cashExpected: Number(form.cashExpected) || 0,
        cashActual: Number(form.cashActual) || 0,
        transferExpected: Number(form.transferExpected) || 0,
        transferActual: Number(form.transferActual) || 0,
      }),
    })
    if (res.ok) {
      const created = await res.json()
      setClosings((p) => [created, ...p])
      setShowForm(false)
      setForm({ ...emptyForm, branchId: branches[0]?.id ?? "" })
      setFormDate(new Date())
    }
    setSaving(false)
  }

  async function handleReview(id: string, action: "approve" | "reject") {
    setReviewId(id)
    const res = await fetch("/api/shift-closing", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, reviewNote }),
    })
    if (res.ok) {
      const updated = await res.json()
      setClosings((p) => p.map((c) => c.id === id ? updated : c))
      setReviewNote("")
    }
    setReviewId(null)
  }

  const pendingCount = closings.filter((c) => c.status === "PENDING").length

  return (
    <div className="space-y-4">
      {/* Header actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={filterBranch}
          onChange={(e) => setFilterBranch(e.target.value)}
          className="h-8 rounded-lg border border-input bg-background px-3 text-sm outline-none"
        >
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        {canManage && pendingCount > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400 font-medium">
            {pendingCount} รายการรออนุมัติ
          </span>
        )}
        <button
          onClick={() => setShowForm(true)}
          className="ml-auto flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" /> ปิดกะ
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">บันทึกปิดกะ</h3>
            <button
              type="button"
              onClick={fetchExpected}
              className="text-xs px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
            >
              ดึงยอดจาก POS
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">สาขา</label>
              <select
                value={form.branchId}
                onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none"
              >
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="space-y-1 flex flex-col">
              <label className="text-xs text-muted-foreground">วันที่</label>
              <Popover>
                <PopoverTrigger
                  className={cn(
                    "flex items-center gap-2 h-9 w-full px-3 rounded-lg border border-input bg-background text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                    !formDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{formDate ? format(formDate, "PPP", { locale: th }) : "เลือกวันที่"}</span>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formDate}
                    onSelect={(day) => day && setFormDate(day)}
                    initialFocus
                    locale={th}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">กะ</label>
              <select
                value={form.shift}
                onChange={(e) => setForm({ ...form, shift: e.target.value })}
                className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none"
              >
                {Object.entries(shiftLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { key: "startingCash", label: "เงินทอนตั้งต้น" },
              { key: "cashExpected", label: "ยอดขายเงินสด (ควรได้)" },
              { key: "cashActual", label: "เงินสดที่นับได้จริง (รวมเงินทอน)" },
              { key: "transferExpected", label: "ยอดโอนที่ควรได้" },
              { key: "transferActual", label: "ยอดโอนจริง" },
            ].map(({ key, label }) => (
              <div key={key} className="space-y-1">
                <label className="text-xs text-muted-foreground">{label}</label>
                <input
                  type="number"
                  min="0"
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder="0"
                  className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-1"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-2 border-t border-border mt-4">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 transition-colors"
            >
              {saving ? "บันทึก..." : "บันทึกปิดกะ"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="h-10 px-4 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-10 text-muted-foreground text-sm">กำลังโหลด...</div>
      ) : closings.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">ยังไม่มีบันทึกปิดกะ</div>
      ) : (
        <div className="space-y-3">
          {closings.map((c: any) => {
            const sc = statusConfig[c.status] ?? statusConfig.PENDING
            const Icon = sc.icon
            const isOpen = expanded === c.id
            const cashDiff = Number(c.cashDifference ?? 0)
            const transferDiff = Number(c.transferDifference ?? 0)
            const startingCash = Number(c.startingCash ?? 0)
            const cashActual = Number(c.cashActual ?? 0)
            const netCashActual = cashActual - startingCash // เงินสดที่ขายได้จริง ไม่รวมเงินทอนตั้งต้น

            return (
              <div key={c.id} className="rounded-xl border border-border bg-card overflow-hidden transition-all hover:shadow-sm">
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/20"
                  onClick={() => setExpanded(isOpen ? null : c.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">{c.branch.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">{shiftLabel[c.shift]}</span>
                      <span className="text-xs text-muted-foreground ml-auto sm:ml-0">
                        {new Date(c.shiftDate).toLocaleDateString("th-TH", { dateStyle: "medium" })}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-xs">
                      <span className="text-muted-foreground flex items-center gap-1">
                        เงินสดส่วนต่าง: <span className={cn("font-medium", cashDiff !== 0 ? (cashDiff > 0 ? "text-emerald-500" : "text-red-500") : "text-foreground")}>{cashDiff > 0 ? "+" : ""}{formatCurrency(cashDiff)}</span>
                      </span>
                      <span className="text-muted-foreground flex items-center gap-1">
                        โอนส่วนต่าง: <span className={cn("font-medium", transferDiff !== 0 ? (transferDiff > 0 ? "text-emerald-500" : "text-red-500") : "text-foreground")}>{transferDiff > 0 ? "+" : ""}{formatCurrency(transferDiff)}</span>
                      </span>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 shrink-0 ${sc.color}`}>
                    <Icon className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{sc.label}</span>
                  </span>
                  {isOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" /> : <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />}
                </div>

                {isOpen && (
                  <div className="border-t border-border px-4 py-4 space-y-4 bg-muted/5 animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm">
                      <div className="space-y-1">
                        <p className="text-muted-foreground text-xs font-medium">เงินทอนตั้งต้น</p>
                        <p className="font-semibold">{formatCurrency(startingCash)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground text-xs font-medium">ยอดขายเงินสด (ควรได้)</p>
                        <p className="font-semibold text-primary">{formatCurrency(Number(c.cashExpected))}</p>
                      </div>
                      <div className="space-y-1 bg-background p-2 rounded-lg border border-border">
                        <p className="text-muted-foreground text-xs font-medium text-center">ยอดขายเงินสด (จริง)</p>
                        <p className="font-bold text-center text-lg">{formatCurrency(netCashActual)}</p>
                        <p className="text-[10px] text-muted-foreground text-center">(นับได้ {formatCurrency(cashActual)} - ทอน {formatCurrency(startingCash)})</p>
                      </div>
                      <div className="space-y-1 pl-2 border-l border-border/50">
                        <p className="text-muted-foreground text-xs font-medium">ยอดโอน (ควรได้)</p>
                        <p className="font-semibold text-blue-500">{formatCurrency(Number(c.transferExpected))}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground text-xs font-medium">ยอดโอน (จริง)</p>
                        <p className="font-semibold text-blue-500">{formatCurrency(Number(c.transferActual ?? 0))}</p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <span>พนักงาน: <strong className="text-foreground">{c.employee.name}</strong></span>
                      {c.reviewedBy && <span className="ml-3">ตรวจโดย: <strong className="text-foreground">{c.reviewedBy}</strong></span>}
                      {c.reviewNote && <p className="mt-1 text-muted-foreground">{c.reviewNote}</p>}
                    </div>

                    {/* Slips */}
                    {c.slips.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Paperclip className="w-3 h-3" /> สลิปแนบ ({c.slips.length})</p>
                        {c.slips.map((slip: any) => (
                          <div key={slip.id} className="flex items-center justify-between text-xs bg-background rounded-lg px-2.5 py-1.5 border border-border">
                            <span className="truncate">{slip.fileName}</span>
                            <span className="font-medium shrink-0 ml-2">{formatCurrency(Number(slip.amount))}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Upload slip */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-muted/50 text-muted-foreground text-xs cursor-pointer hover:bg-muted/80 border border-border">
                        <Upload className="w-3.5 h-3.5" /> อัปโหลดสลิป
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              const amt = prompt("ยอดเงินในสลิป (บาท):")
                              if (amt) handleSlipUpload(c.id, file, amt)
                            }
                            e.target.value = ""
                          }}
                          disabled={uploadingId === c.id}
                        />
                      </label>
                      {uploadingId === c.id && <span className="text-xs text-muted-foreground">กำลังอัปโหลด...</span>}
                    </div>

                    {canManage && c.status === "PENDING" && (
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          value={reviewNote}
                          onChange={(e) => setReviewNote(e.target.value)}
                          placeholder="หมายเหตุ (ถ้ามี)"
                          className="flex-1 h-7 rounded-lg border border-input bg-background px-2.5 text-xs outline-none"
                        />
                        <button
                          onClick={() => handleReview(c.id, "approve")}
                          disabled={reviewId === c.id}
                          className="flex items-center gap-1 h-7 px-3 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs hover:bg-emerald-500/20 disabled:opacity-50"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> อนุมัติ
                        </button>
                        <button
                          onClick={() => handleReview(c.id, "reject")}
                          disabled={reviewId === c.id}
                          className="flex items-center gap-1 h-7 px-3 rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20 disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" /> ปฏิเสธ
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
