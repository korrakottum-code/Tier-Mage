"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, BookOpen, ToggleLeft, ToggleRight, X, Check } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface Category { id: string; name: string; sortOrder: number }
interface Ingredient { id: string; name: string; unit: string }
interface Recipe { id: string; ingredientId: string; quantity: number; unit: string; ingredient: Ingredient }
interface MenuItem {
  id: string; name: string; price: number; isAvailable: boolean; imageUrl: string | null
  categoryId: string; category: Category; recipes: Recipe[]
}

interface MenuItemsPanelProps {
  items: MenuItem[]
  categories: Category[]
  ingredients: Ingredient[]
  view: "grid" | "list"
  onAdd: (item: MenuItem) => void
  onUpdate: (item: MenuItem) => void
  onDelete: (id: string) => void
}

const emptyForm = { name: "", categoryId: "", price: "", isAvailable: true, imageUrl: "" }

export function MenuItemsPanel({ items, categories, ingredients, view, onAdd, onUpdate, onDelete }: MenuItemsPanelProps) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<MenuItem | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [recipeItem, setRecipeItem] = useState<MenuItem | null>(null)

  function openAdd() {
    setEditing(null)
    setForm({ ...emptyForm, categoryId: categories[0]?.id ?? "" })
    setShowForm(true)
  }

  function openEdit(item: MenuItem) {
    setEditing(item)
    setForm({ name: item.name, categoryId: item.categoryId, price: String(item.price), isAvailable: item.isAvailable, imageUrl: item.imageUrl ?? "" })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.name || !form.categoryId || !form.price) return
    setSaving(true)
    const body = {
      ...(editing ? { id: editing.id } : {}),
      name: form.name,
      categoryId: form.categoryId,
      price: parseFloat(form.price),
      isAvailable: form.isAvailable,
      imageUrl: form.imageUrl || null,
    }
    const res = await fetch("/api/menu/items", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const data = await res.json()
      editing ? onUpdate(data) : onAdd(data)
      setShowForm(false); setEditing(null); setForm(emptyForm)
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("ลบเมนูนี้?")) return
    const res = await fetch(`/api/menu/items?id=${id}`, { method: "DELETE" })
    if (res.ok) onDelete(id)
  }

  async function toggleAvailable(item: MenuItem) {
    const res = await fetch("/api/menu/items", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, name: item.name, categoryId: item.categoryId, price: Number(item.price), isAvailable: !item.isAvailable }),
    })
    if (res.ok) onUpdate(await res.json())
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{items.length} รายการ</p>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> เพิ่มเมนู
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">{editing ? "แก้ไขเมนู" : "เพิ่มเมนูใหม่"}</h3>
            <button onClick={() => { setShowForm(false); setEditing(null) }} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-medium text-muted-foreground">ชื่อเมนู *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ลาเต้เย็น" className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">หมวดหมู่ *</label>
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring">
                <option value="">-- เลือก --</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">ราคา (บาท) *</label>
              <input type="number" min="0" step="0.5" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="65" className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring" />
            </div>
            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-medium text-muted-foreground">URL รูปภาพ (ไม่บังคับ)</label>
              <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring" />
            </div>
            <div className="flex items-center gap-2 col-span-2">
              <label className="text-xs font-medium text-muted-foreground">สถานะ</label>
              <button type="button" onClick={() => setForm({ ...form, isAvailable: !form.isAvailable })} className="flex items-center gap-1.5 text-sm">
                {form.isAvailable
                  ? <><ToggleRight className="w-5 h-5 text-emerald-400" /><span className="text-emerald-400">เปิดขาย</span></>
                  : <><ToggleLeft className="w-5 h-5 text-muted-foreground" /><span className="text-muted-foreground">ปิดขาย</span></>}
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving || !form.name || !form.categoryId || !form.price} className="h-8 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:bg-primary/90">
              {saving ? "บันทึก..." : "บันทึก"}
            </button>
            <button onClick={() => { setShowForm(false); setEditing(null) }} className="h-8 px-3 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground">
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* Grid View */}
      {view === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {items.map((item) => (
            <div key={item.id} className={`rounded-xl border bg-card overflow-hidden flex flex-col ${!item.isAvailable ? "opacity-60" : "border-border"}`}>
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt={item.name} className="w-full h-28 object-cover" />
              ) : (
                <div className="w-full h-28 bg-muted flex items-center justify-center text-2xl">☕</div>
              )}
              <div className="p-3 flex flex-col gap-2 flex-1">
                <div>
                  <p className="font-medium text-sm leading-tight">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.category.name}</p>
                </div>
                <p className="text-base font-bold text-primary">{formatCurrency(Number(item.price))}</p>
                <div className="flex items-center gap-1 mt-auto">
                  <button onClick={() => toggleAvailable(item)} className="p-1 rounded text-muted-foreground hover:text-foreground" title="toggle">
                    {item.isAvailable ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                  <button onClick={() => setRecipeItem(item)} className="p-1 rounded text-muted-foreground hover:text-blue-400" title="สูตร">
                    <BookOpen className="w-4 h-4" />
                  </button>
                  <button onClick={() => openEdit(item)} className="p-1 rounded text-muted-foreground hover:text-foreground" title="แก้ไข">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-1 rounded text-muted-foreground hover:text-destructive" title="ลบ">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="col-span-full flex items-center justify-center py-16 text-muted-foreground text-sm">ยังไม่มีเมนู</div>
          )}
        </div>
      ) : (
        /* List View */
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">เมนู</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden sm:table-cell">หมวด</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">ราคา</th>
                <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">สถานะ</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item) => (
                <tr key={item.id} className={`hover:bg-muted/20 ${!item.isAvailable ? "opacity-60" : ""}`}>
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{item.category.name}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(Number(item.price))}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleAvailable(item)}>
                      {item.isAvailable
                        ? <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">เปิด</span>
                        : <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">ปิด</span>}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => setRecipeItem(item)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-blue-400"><BookOpen className="w-3.5 h-3.5" /></button>
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 text-muted-foreground">ยังไม่มีเมนู</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Recipe Modal */}
      {recipeItem && (
        <RecipeModal
          item={recipeItem}
          ingredients={ingredients}
          onUpdate={(updated) => { onUpdate(updated); setRecipeItem(updated) }}
          onClose={() => setRecipeItem(null)}
        />
      )}
    </div>
  )
}

function RecipeModal({ item, ingredients, onUpdate, onClose }: {
  item: MenuItem
  ingredients: Ingredient[]
  onUpdate: (item: MenuItem) => void
  onClose: () => void
}) {
  const [recipes, setRecipes] = useState<Recipe[]>(item.recipes)
  const [ingredientId, setIngredientId] = useState(ingredients[0]?.id ?? "")
  const [quantity, setQuantity] = useState("1")
  const [unit, setUnit] = useState(ingredients[0]?.unit ?? "")
  const [saving, setSaving] = useState(false)

  async function handleAdd() {
    if (!ingredientId || !quantity) return
    setSaving(true)
    const res = await fetch("/api/menu/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ menuItemId: item.id, ingredientId, quantity: parseFloat(quantity), unit }),
    })
    if (res.ok) {
      const r = await res.json()
      const newRecipes = [...recipes, r]
      setRecipes(newRecipes)
      onUpdate({ ...item, recipes: newRecipes })
      setQuantity("1")
    }
    setSaving(false)
  }

  async function handleDeleteRecipe(id: string) {
    const res = await fetch(`/api/menu/recipes?id=${id}`, { method: "DELETE" })
    if (res.ok) {
      const newRecipes = recipes.filter((r) => r.id !== id)
      setRecipes(newRecipes)
      onUpdate({ ...item, recipes: newRecipes })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">สูตรวัตถุดิบ</h3>
            <p className="text-sm text-muted-foreground">{item.name}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current recipes */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {recipes.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">ยังไม่มีสูตร</p>}
          {recipes.map((r) => (
            <div key={r.id} className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2">
              <span className="flex-1 text-sm">{r.ingredient.name}</span>
              <span className="text-sm font-medium">{r.quantity} {r.unit}</span>
              <button onClick={() => handleDeleteRecipe(r.id)} className="text-muted-foreground hover:text-destructive ml-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Add recipe */}
        <div className="rounded-xl border border-border p-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">เพิ่มวัตถุดิบ</p>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={ingredientId}
              onChange={(e) => {
                setIngredientId(e.target.value)
                const ing = ingredients.find((i) => i.id === e.target.value)
                if (ing) setUnit(ing.unit)
              }}
              className="col-span-2 h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring"
            >
              {ingredients.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
            </select>
            <input
              type="number" min="0" step="0.01" value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="ปริมาณ"
              className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring"
            />
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="หน่วย"
              className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={saving || !ingredientId || !quantity}
            className="w-full h-8 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            {saving ? "กำลังบันทึก..." : "เพิ่มวัตถุดิบ"}
          </button>
        </div>
      </div>
    </div>
  )
}
