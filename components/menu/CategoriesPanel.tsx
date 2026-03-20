"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react"

interface Category { id: string; name: string; sortOrder: number }

interface CategoriesPanelProps {
  categories: Category[]
  onAdd: (cat: Category) => void
  onUpdate: (cat: Category) => void
  onDelete: (id: string) => void
}

export function CategoriesPanel({ categories, onAdd, onUpdate, onDelete }: CategoriesPanelProps) {
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [name, setName] = useState("")
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    const body = editing
      ? { id: editing.id, name, sortOrder: editing.sortOrder }
      : { name, sortOrder: categories.length }
    const res = await fetch("/api/menu/categories", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const data = await res.json()
      editing ? onUpdate(data) : onAdd(data)
      setEditing(null); setAdding(false); setName("")
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("ลบหมวดหมู่นี้? เมนูในหมวดนี้จะถูกลบด้วย")) return
    const res = await fetch(`/api/menu/categories?id=${id}`, { method: "DELETE" })
    if (res.ok) onDelete(id)
  }

  function startEdit(cat: Category) {
    setEditing(cat); setAdding(false); setName(cat.name)
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3 h-fit">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm">หมวดหมู่</h2>
        <button
          onClick={() => { setAdding(true); setEditing(null); setName("") }}
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> เพิ่ม
        </button>
      </div>

      {(adding || editing) && (
        <div className="flex gap-2">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            placeholder="ชื่อหมวดหมู่"
            className="flex-1 h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring"
          />
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-sm disabled:opacity-50"
          >
            {saving ? "..." : "บันทึก"}
          </button>
          <button
            onClick={() => { setAdding(false); setEditing(null); setName("") }}
            className="h-8 px-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>
      )}

      <div className="space-y-1">
        {categories.map((cat) => (
          <div key={cat.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted group">
            <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
            <span className="flex-1 text-sm">{cat.name}</span>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => startEdit(cat)} className="p-1 rounded text-muted-foreground hover:text-foreground">
                <Pencil className="w-3 h-3" />
              </button>
              <button onClick={() => handleDelete(cat.id)} className="p-1 rounded text-muted-foreground hover:text-destructive">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">ยังไม่มีหมวดหมู่</p>
        )}
      </div>
    </div>
  )
}
