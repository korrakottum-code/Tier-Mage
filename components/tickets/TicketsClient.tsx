"use client"

import { useState, useEffect } from "react"
import { Plus, X, MessageSquare, CheckCircle, XCircle, PlayCircle } from "lucide-react"

const ticketTypes = [
  { value: "GENERAL", label: "ทั่วไป" },
  { value: "RESTOCK", label: "ขอวัตถุดิบ" },
  { value: "URGENT", label: "เร่งด่วน" },
  { value: "MAINTENANCE", label: "แจ้งซ่อม" },
]

const statusConfig: Record<string, { label: string; color: string }> = {
  OPEN: { label: "เปิด", color: "text-blue-400 bg-blue-400/10" },
  IN_PROGRESS: { label: "กำลังดำเนินการ", color: "text-yellow-400 bg-yellow-400/10" },
  COMPLETED: { label: "เสร็จสิ้น", color: "text-emerald-400 bg-emerald-400/10" },
  REJECTED: { label: "ปฏิเสธ", color: "text-red-400 bg-red-400/10" },
  CANCELLED: { label: "ยกเลิก", color: "text-muted-foreground bg-muted" },
}

const typeConfig: Record<string, { label: string; color: string }> = {
  GENERAL: { label: "ทั่วไป", color: "text-muted-foreground" },
  RESTOCK: { label: "ขอวัตถุดิบ", color: "text-blue-400" },
  URGENT: { label: "เร่งด่วน", color: "text-red-400" },
  MAINTENANCE: { label: "แจ้งซ่อม", color: "text-orange-400" },
}

interface Ticket {
  id: string
  title: string
  details?: string | null
  type: string
  status: string
  createdBy: string
  responder?: string | null
  responseNote?: string | null
  cancelNote?: string | null
  createdAt: string
  updatedAt?: string | null
}

export function TicketsClient({ role }: { role: string }) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>("ALL")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ type: "GENERAL", title: "", details: "" })
  const [saving, setSaving] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)
  const [responseNote, setResponseNote] = useState("")

  const canManage = ["ADMIN", "MANAGER"].includes(role)

  async function load() {
    setLoading(true)
    const res = await fetch("/api/tickets")
    if (res.ok) setTickets(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSave() {
    if (!form.title) return
    setSaving(true)
    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: form.title, details: form.details || null, type: form.type }),
    })
    if (res.ok) {
      const t = await res.json()
      setTickets((p) => [t, ...p])
      setShowForm(false)
      setForm({ type: "GENERAL", title: "", details: "" })
    }
    setSaving(false)
  }

  async function handleAction(id: string, action: string) {
    setActionId(id)
    const res = await fetch("/api/tickets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, responseNote: responseNote || null }),
    })
    if (res.ok) {
      const updated = await res.json()
      setTickets((p) => p.map((t) => t.id === id ? updated : t))
      setResponseNote("")
    }
    setActionId(null)
  }

  const filtered = filterStatus === "ALL" ? tickets : tickets.filter((t) => t.status === filterStatus)

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-8 rounded-lg border border-input bg-background px-3 text-sm outline-none"
        >
          <option value="ALL">ทั้งหมด</option>
          {Object.entries(statusConfig).map(([v, c]) => (
            <option key={v} value={v}>{c.label}</option>
          ))}
        </select>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 ml-auto"
        >
          <Plus className="w-4 h-4" /> สร้างคำร้อง
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">สร้างคำร้องใหม่</h3>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">ประเภท</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none">
                {ticketTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">หัวข้อ *</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="หัวข้อคำร้อง..."
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">รายละเอียด</label>
              <textarea
                value={form.details}
                onChange={(e) => setForm({ ...form, details: e.target.value })}
                placeholder="อธิบายรายละเอียด..."
                rows={3}
                className="w-full rounded-lg border border-input bg-background px-2.5 py-2 text-sm outline-none focus:border-ring resize-none"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving || !form.title} className="h-8 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
              {saving ? "ส่ง..." : "ส่งคำร้อง"}
            </button>
            <button onClick={() => setShowForm(false)} className="h-8 px-3 rounded-lg border border-border text-sm text-muted-foreground">ยกเลิก</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-muted-foreground text-sm">กำลังโหลด...</div>
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <MessageSquare className="w-10 h-10 opacity-30" />
              <p className="text-sm">ไม่พบคำร้อง</p>
            </div>
          )}
          {filtered.map((t) => {
            const sc = statusConfig[t.status]
            const tc = typeConfig[t.type]
            const isOpen = t.status === "OPEN"
            const isInProgress = t.status === "IN_PROGRESS"
            const isDone = ["COMPLETED", "REJECTED", "CANCELLED"].includes(t.status)
            return (
              <div key={t.id} className={`rounded-xl border border-border bg-card p-4 space-y-2 ${isDone ? "opacity-70" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{t.title}</span>
                      <span className={`text-xs font-medium ${tc?.color}`}>{tc?.label ?? t.type}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc?.color}`}>{sc?.label ?? t.status}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      โดย {t.createdBy} · {new Date(t.createdAt).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}
                    </p>
                  </div>
                  {canManage && (isOpen || isInProgress) && (
                    <div className="flex gap-1 shrink-0">
                      {isOpen && (
                        <button
                          onClick={() => handleAction(t.id, "acknowledge")}
                          disabled={actionId === t.id}
                          className="p-1.5 rounded hover:bg-yellow-500/10 text-muted-foreground hover:text-yellow-400"
                          title="รับงาน"
                        >
                          <PlayCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleAction(t.id, "complete")}
                        disabled={actionId === t.id}
                        className="p-1.5 rounded hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-400"
                        title="เสร็จสิ้น"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleAction(t.id, "reject")}
                        disabled={actionId === t.id}
                        className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400"
                        title="ปฏิเสธ"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                {t.details && <p className="text-sm text-muted-foreground">{t.details}</p>}
                {t.responseNote && (
                  <p className="text-xs text-muted-foreground border-t border-border pt-2 mt-2">
                    <span className="font-medium">{t.responder}:</span> {t.responseNote}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
