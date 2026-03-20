"use client"

import { useState } from "react"
import { Download, Upload, Trash2, AlertTriangle } from "lucide-react"

export function SystemTab() {
  const [exporting, setExporting] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetScope, setResetScope] = useState<"transactions" | "all">("transactions")
  const [confirmCode, setConfirmCode] = useState("")
  const [showReset, setShowReset] = useState(false)

  async function handleBackup() {
    setExporting(true)
    const res = await fetch("/api/system?action=backup")
    if (res.ok) {
      const data = await res.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `tier-coffee-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
    setExporting(false)
  }

  async function handleReset() {
    if (confirmCode !== "RESET-TIER-COFFEE") {
      alert("รหัสยืนยันไม่ถูกต้อง")
      return
    }
    if (!confirm(`ยืนยันล้างข้อมูล${resetScope === "all" ? "ทั้งหมด" : "รายการ"}? การกระทำนี้ไม่สามารถย้อนกลับได้`)) return
    setResetting(true)
    const res = await fetch("/api/system", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset", scope: resetScope, confirmCode }),
    })
    if (res.ok) {
      alert("ล้างข้อมูลสำเร็จ")
      setShowReset(false)
      setConfirmCode("")
    } else {
      const err = await res.json()
      alert(err.error ?? "เกิดข้อผิดพลาด")
    }
    setResetting(false)
  }

  return (
    <div className="space-y-6">
      {/* Backup */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2"><Download className="w-4 h-4 text-blue-400" /> สำรองข้อมูล (Backup)</h3>
        <p className="text-xs text-muted-foreground">ส่งออกข้อมูลทั้งหมดเป็นไฟล์ JSON สำหรับสำรองหรือย้ายระบบ</p>
        <button
          onClick={handleBackup}
          disabled={exporting}
          className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-blue-500/10 text-blue-400 text-sm font-medium hover:bg-blue-500/20 disabled:opacity-50"
        >
          <Download className="w-4 h-4" /> {exporting ? "กำลังส่งออก..." : "ดาวน์โหลด Backup"}
        </button>
      </div>

      {/* Reset */}
      <div className="rounded-xl border border-red-500/30 bg-card p-4 space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2 text-red-400"><AlertTriangle className="w-4 h-4" /> ล้างข้อมูล (Factory Reset)</h3>
        <p className="text-xs text-muted-foreground">ล้างข้อมูลรายการทั้งหมด (ออเดอร์, สต็อก, บัญชี, ปิดกะ) หรือล้างทุกอย่าง (เก็บ user และ branch ไว้)</p>

        {!showReset ? (
          <button
            onClick={() => setShowReset(true)}
            className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20"
          >
            <Trash2 className="w-4 h-4" /> เปิดหน้าล้างข้อมูล
          </button>
        ) : (
          <div className="space-y-3 border-t border-border pt-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">ขอบเขตการล้าง</label>
              <select
                value={resetScope}
                onChange={(e) => setResetScope(e.target.value as "transactions" | "all")}
                className="h-8 w-full sm:w-auto rounded-lg border border-input bg-background px-3 text-sm outline-none"
              >
                <option value="transactions">เฉพาะรายการ (ออเดอร์, สต็อก, บัญชี, ปิดกะ)</option>
                <option value="all">ทุกอย่าง (เก็บ user + branch)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">พิมพ์ <code className="bg-muted px-1 rounded">RESET-TIER-COFFEE</code> เพื่อยืนยัน</label>
              <input
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value)}
                placeholder="RESET-TIER-COFFEE"
                className="h-8 w-full sm:w-64 rounded-lg border border-red-500/30 bg-background px-3 text-sm outline-none font-mono"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                disabled={resetting || confirmCode !== "RESET-TIER-COFFEE"}
                className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" /> {resetting ? "กำลังล้าง..." : "ล้างข้อมูล"}
              </button>
              <button
                onClick={() => { setShowReset(false); setConfirmCode("") }}
                className="h-8 px-3 rounded-lg border border-border text-sm text-muted-foreground"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
