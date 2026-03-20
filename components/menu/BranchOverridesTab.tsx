"use client"

import { useState, useEffect } from "react"
import { Save, Trash2, Eye, EyeOff } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface Branch { id: string; name: string }

interface Override {
  id: string
  branchId: string
  menuItemId: string
  price: number | null
  isAvailable: boolean
  menuItem: { id: string; name: string; price: number; category: { name: string } }
}

export function BranchOverridesTab({ branches }: { branches: Branch[] }) {
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "")
  const [overrides, setOverrides] = useState<Override[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/menu/overrides?branchId=${branchId}`)
    if (res.ok) setOverrides(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [branchId])

  async function handleSave(menuItemId: string, price: number | null, isAvailable: boolean) {
    setSaving(menuItemId)
    const res = await fetch("/api/menu/overrides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ branchId, menuItemId, price, isAvailable }),
    })
    if (res.ok) load()
    setSaving(null)
  }

  async function handleDelete(id: string) {
    if (!confirm("ลบ override นี้? จะใช้ราคา/สถานะปกติ")) return
    await fetch(`/api/menu/overrides?id=${id}`, { method: "DELETE" })
    setOverrides((p) => p.filter((o) => o.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="h-8 rounded-lg border border-input bg-background px-3 text-sm outline-none">
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <span className="text-xs text-muted-foreground">{overrides.length} overrides</span>
      </div>

      {loading ? (
        <div className="text-center py-10 text-muted-foreground text-sm">กำลังโหลด...</div>
      ) : overrides.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm">ยังไม่มี override สำหรับสาขานี้</div>
      ) : (
        <div className="rounded-xl border border-border overflow-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">เมนู</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">หมวดหมู่</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">ราคาปกติ</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">ราคาสาขา</th>
                <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">เปิดขาย</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {overrides.map((o) => (
                <tr key={o.id} className="hover:bg-muted/10">
                  <td className="px-4 py-2 text-xs font-medium">{o.menuItem.name}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{o.menuItem.category.name}</td>
                  <td className="px-4 py-2 text-xs text-right text-muted-foreground">{formatCurrency(Number(o.menuItem.price))}</td>
                  <td className="px-4 py-2 text-xs text-right">
                    <input
                      type="number"
                      defaultValue={o.price != null ? Number(o.price) : ""}
                      onBlur={(e) => {
                        const val = e.target.value ? Number(e.target.value) : null
                        if (val !== o.price) handleSave(o.menuItemId, val, o.isAvailable)
                      }}
                      className="h-6 w-20 rounded border border-input bg-background px-1.5 text-xs text-right outline-none"
                      placeholder="ปกติ"
                    />
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => handleSave(o.menuItemId, o.price != null ? Number(o.price) : null, !o.isAvailable)}
                      disabled={saving === o.menuItemId}
                      className={`p-1 rounded ${o.isAvailable ? "text-emerald-400" : "text-muted-foreground"}`}
                    >
                      {o.isAvailable ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </td>
                  <td className="px-4 py-2">
                    <button onClick={() => handleDelete(o.id)} className="p-1 rounded text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
