"use client"

import { useState, useMemo } from "react"
import { Plus, Pencil, Trash2, BookOpen, ToggleLeft, ToggleRight, X, Check, ListPlus } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface Category { id: string; name: string; sortOrder: number }
interface Ingredient { id: string; name: string; unit: string }
interface Recipe { id: string; ingredientId: string; quantity: number; unit: string; ingredient: Ingredient }
interface MenuOption { id: string; menuItemId: string; name: string; choices: string[]; priceModifier: number[] }
interface MenuItem {
  id: string; name: string; price: number; isAvailable: boolean; imageUrl: string | null
  categoryId: string; category: Category; recipes: Recipe[]; menuOptions?: MenuOption[]
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
  const [uploading, setUploading] = useState(false)
  const [recipeItem, setRecipeItem] = useState<MenuItem | null>(null)
  const [optionItem, setOptionItem] = useState<MenuItem | null>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    try {
      const res = await fetch("/api/upload/image", { method: "POST", body: formData })
      if (res.ok) {
        const data = await res.json()
        setForm({ ...form, imageUrl: data.url })
      }
    } catch {
      // ignore
    } finally {
      setUploading(false)
    }
  }

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
              <label className="text-xs font-medium text-muted-foreground">รูปภาพ</label>
              <div className="flex gap-2">
                <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="URL รูปภาพ..." className="h-8 flex-1 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring" />
                <label className="h-8 px-3 rounded-lg border border-border text-[10px] font-medium flex items-center justify-center cursor-pointer hover:bg-muted transition-colors whitespace-nowrap">
                  {uploading ? "กำลังอัพ..." : "อัพโหลด"}
                  <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
                </label>
              </div>
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
                <img src={item.imageUrl} alt={item.name} className="w-full h-28 object-contain bg-white/5" />
              ) : (
                <div className="w-full h-28 bg-muted flex items-center justify-center text-2xl">☕</div>
              )}
              <div className="p-3 flex flex-col gap-2 flex-1">
                <div>
                  <p className="font-medium text-sm leading-tight">
                    {item.name}
                    {item.menuOptions && item.menuOptions.length > 0 && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-medium text-orange-500 ring-1 ring-inset ring-orange-500/20">
                        + ตัวเลือก
                      </span>
                    )}
                  </p>
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
                  <button onClick={() => setOptionItem(item)} className="p-1 rounded text-muted-foreground hover:text-orange-400" title="ตัวเลือกเพิ่มเติม">
                    <ListPlus className="w-4 h-4" />
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
                  <td className="px-4 py-3 font-medium">
                    {item.name}
                    {item.menuOptions && item.menuOptions.length > 0 && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-medium text-orange-500 ring-1 ring-inset ring-orange-500/20">
                        + ตัวเลือก
                      </span>
                    )}
                  </td>
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
                      <button onClick={() => setOptionItem(item)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-orange-400"><ListPlus className="w-3.5 h-3.5" /></button>
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

      {/* Options Modal */}
      {optionItem && (
        <OptionsModal
          item={optionItem}
          allItems={items}
          onUpdate={(updated) => { onUpdate(updated); setOptionItem(updated) }}
          onClose={() => setOptionItem(null)}
        />
      )}
    </div>
  )
}

function OptionsModal({ item, allItems, onUpdate, onClose }: {
  item: MenuItem
  allItems: MenuItem[]
  onUpdate: (item: MenuItem) => void
  onClose: () => void
}) {
  const [options, setOptions] = useState<MenuOption[]>(item.menuOptions || [])
  const [name, setName] = useState("")
  const [choices, setChoices] = useState<{name: string; price: string}[]>([{name: "", price: "0"}])
  const [saving, setSaving] = useState(false)

  // Compute unique templates from other items
  const existingOptions = useMemo(() => {
    const map = new Map<string, MenuOption>()
    allItems.forEach(mi => {
      mi.menuOptions?.forEach(mo => {
        const key = mo.name + JSON.stringify(mo.choices) + JSON.stringify(mo.priceModifier)
        if (!map.has(key)) map.set(key, mo)
      })
    })
    return Array.from(map.values())
  }, [allItems])

  function handleSelectTemplate(e: React.ChangeEvent<HTMLSelectElement>) {
    const tmplId = e.target.value
    if (!tmplId) return
    const tmpl = existingOptions.find(o => o.id === tmplId)
    if (tmpl) {
      setName(tmpl.name)
      setChoices(tmpl.choices.map((c, i) => ({
        name: c,
        price: String(tmpl.priceModifier?.[i] ?? 0)
      })))
    }
  }

  async function handleAdd() {
    const validChoices = choices.filter(c => c.name.trim() !== "")
    if (!name || validChoices.length === 0) return
    setSaving(true)
    
    const res = await fetch("/api/menu/options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        menuItemId: item.id, 
        name, 
        choices: validChoices.map(c => c.name.trim()), 
        priceModifier: validChoices.map(c => parseFloat(c.price) || 0) 
      }),
    })
    if (res.ok) {
      const o = await res.json()
      const newOptions = [...options, o]
      setOptions(newOptions)
      onUpdate({ ...item, menuOptions: newOptions })
      setName("")
      setChoices([{name: "", price: "0"}])
    }
    setSaving(false)
  }

  async function handleDeleteOption(id: string) {
    const res = await fetch(`/api/menu/options?id=${id}`, { method: "DELETE" })
    if (res.ok) {
      const newOptions = options.filter((o) => o.id !== id)
      setOptions(newOptions)
      onUpdate({ ...item, menuOptions: newOptions })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-bold text-lg">ตัวเลือกเพิ่มเติม (Add-ons)</h3>
            <p className="text-sm text-primary font-medium">{item.name}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current options */}
        <div className="space-y-3 overflow-y-auto custom-scrollbar shrink-0 max-h-48">
          {options.length === 0 && <div className="text-sm text-muted-foreground text-center py-6 bg-muted/20 rounded-xl border border-dashed border-border/50">ยังไม่มีตัวเลือกให้เลือกเลย</div>}
          {options.map((o) => (
            <div key={o.id} className="flex flex-col gap-1.5 rounded-xl bg-card border border-border shadow-sm p-3 relative hover:border-primary/50 transition-colors group">
              <button onClick={() => handleDeleteOption(o.id)} className="absolute top-2 right-2 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground p-1 rounded-md transition-all opacity-0 group-hover:opacity-100">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <span className="font-bold text-sm text-foreground pr-6">{o.name}</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {o.choices.map((c, idx) => (
                  <span key={idx} className="text-xs font-semibold bg-muted/50 text-foreground px-2.5 py-1 rounded-md border border-border/50 shadow-sm flex items-center gap-1.5">
                    {c} {o.priceModifier?.[idx] > 0 && <span className="text-orange-500">(+{o.priceModifier[idx]})</span>}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Add option */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col gap-3 shadow-inner flex-1 min-h-[50%] overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-foreground">สร้างเซ็ตตัวเลือกใหม่</p>
            {existingOptions.length > 0 && (
              <select onChange={handleSelectTemplate} className="text-xs h-7 rounded-md border border-input bg-background/80 px-2 max-w-[150px] outline-none hover:border-primary transition-colors cursor-pointer text-muted-foreground">
                <option value="">คัดลอกรูปแบบเดิม...</option>
                {existingOptions.map(o => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            )}
          </div>
          
          <div className="space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ตั้งชื่อ เช่น ความหวาน, ขนาด, ท็อปปิ้ง"
              className="h-9 w-full rounded-xl border border-input bg-card px-3 text-sm font-medium outline-none focus:border-primary shadow-sm"
            />
            
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider ml-1">รายการตัวเลือก</label>
              <div className="space-y-2">
                {choices.map((c, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      value={c.name}
                      onChange={(e) => {
                        const newC = [...choices]; newC[i].name = e.target.value; setChoices(newC)
                      }}
                      placeholder="เช่น หวาน 50%"
                      className="h-8 flex-1 rounded-lg border border-input bg-card px-2.5 text-sm outline-none focus:border-primary shadow-sm"
                    />
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">+฿</span>
                      <input
                        type="number" min="0" value={c.price}
                        onChange={(e) => {
                          const newC = [...choices]; newC[i].price = e.target.value; setChoices(newC)
                        }}
                        className="h-8 w-20 rounded-lg border border-input bg-card pl-7 pr-2.5 text-sm outline-none focus:border-primary shadow-sm tabular-nums"
                      />
                    </div>
                    {choices.length > 1 ? (
                      <button onClick={() => setChoices(choices.filter((_, idx) => idx !== i))} className="p-1.5 text-muted-foreground hover:text-destructive bg-card border border-transparent hover:border-destructive/30 rounded-lg transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    ) : <div className="w-7"></div>}
                  </div>
                ))}
              </div>
            </div>
            
            <button onClick={() => setChoices([...choices, {name: "", price: "0"}])} className="w-full h-8 border border-dashed border-primary/40 rounded-lg text-xs font-semibold text-primary/70 hover:text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-1">
              <Plus className="w-3.5 h-3.5" /> เพิ่มรายละเอียด
            </button>
          </div>
          
          <button
            onClick={handleAdd}
            disabled={saving || !name || !choices.some(c => c.name.trim())}
            className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-md shadow-primary/20 disabled:opacity-50 hover:bg-primary/90 hover:shadow-lg transition-all flex items-center justify-center gap-1.5 mt-auto"
          >
            <Check className="w-4.5 h-4.5" />
            {saving ? "กำลังเพิ่ม..." : "เพิ่มเซ็ตตัวเลือกลงในเมนู"}
          </button>
        </div>
      </div>
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
