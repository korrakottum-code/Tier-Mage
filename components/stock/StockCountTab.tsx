"use client"

import { useState, useMemo } from "react"
import { Search, Minus, Plus, CheckCircle, Info, Save, X, AlertTriangle } from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

interface Branch { id: string; name: string }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Ingredient = any

interface StockCountTabProps {
  ingredients: Ingredient[]
  branches: Branch[]
  role: string
  onUpdateIngredient: (i: Ingredient) => void
}

export function StockCountTab({ ingredients, branches, role, onUpdateIngredient }: StockCountTabProps) {
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "")
  const [frequency, setFrequency] = useState<"Daily" | "Weekly">("Daily")
  const [search, setSearch] = useState("")
  
  // State for batch counts: Record<ingredientId, countedQty>
  const [counts, setCounts] = useState<Record<string, string>>({})
  
  const [showConfirm, setShowConfirm] = useState(false)
  const [saving, setSaving] = useState(false)

  // Filter ingredients by search and frequency
  const filteredIngredients = useMemo(() => {
    return ingredients.filter(i => {
      const matchFreq = (i.checkFrequency || "Daily") === frequency
      const matchSearch = i.name.toLowerCase().includes(search.toLowerCase())
      return matchFreq && matchSearch
    })
  }, [ingredients, frequency, search])

  // Initializing missing counts with current system quantity when viewing
  const getQty = (id: string, sysQty: string) => {
    return counts[id] !== undefined ? counts[id] : sysQty
  }

  const handleUpdateQty = (id: string, sysQty: string, delta: number | string) => {
    const current = parseFloat(getQty(id, sysQty) || "0")
    if (typeof delta === 'number') {
      const newVal = Math.max(0, current + delta)
      setCounts(prev => ({ ...prev, [id]: newVal.toString() }))
    } else {
      setCounts(prev => ({ ...prev, [id]: delta }))
    }
  }

  const itemsToSubmit = useMemo(() => {
    return Object.entries(counts).map(([id, qty]) => {
      const ing = ingredients.find(i => i.id === id)
      if (!ing) return null
      return {
        ingredientId: id,
        name: ing.name,
        systemQty: Number(ing.currentQty),
        countedQty: parseFloat(qty),
        unit: ing.unit
      }
    }).filter(item => item !== null && !isNaN(item.countedQty) && item.countedQty !== item.systemQty)
  }, [counts, ingredients])

  async function handleSave() {
    if (itemsToSubmit.length === 0) {
      toast.info("ไม่มีรายการที่ถูกเปลี่ยนแปลง")
      setShowConfirm(false)
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/stock/count/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId,
          counts: itemsToSubmit.map(item => ({
            ingredientId: item?.ingredientId,
            countedQty: item?.countedQty,
            reason: "OTHER", // Default for now
            reasonNote: "นับสต็อกแบบกลุ่ม",
          }))
        }),
      })

      if (!res.ok) throw new Error("Failed to save")

      const results = await res.json()
      toast.success(`บันทึกการนับสต็อก ${results.length} รายการสำเร็จ`)
      
      // Update local ingredients
      itemsToSubmit.forEach(item => {
        if (!item) return
        const ing = ingredients.find(i => i.id === item.ingredientId)
        if (ing) onUpdateIngredient({ ...ing, currentQty: item.countedQty })
      })

      setCounts({})
      setShowConfirm(false)
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการบันทึก")
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        {/* Header Options */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">นับที่สาขา</label>
          <select 
            value={branchId} 
            onChange={(e) => setBranchId(e.target.value)} 
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          >
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>

        {/* Frequency Tabs */}
        <Tabs defaultValue="Daily" value={frequency} onValueChange={(v) => setFrequency(v as "Daily" | "Weekly")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-11">
            <TabsTrigger value="Daily" className="font-medium">📅 รายวัน (Daily)</TabsTrigger>
            <TabsTrigger value="Weekly" className="font-medium">📆 รายสัปดาห์ (Weekly)</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={`ค้นหาสินค้า (${frequency === "Daily" ? "รายวัน" : "รายสัปดาห์"})...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Items List */}
        <div className="space-y-2 mt-4 max-h-[60vh] overflow-y-auto pr-1">
          {filteredIngredients.length === 0 && (
            <div className="text-center py-10 text-muted-foreground text-sm">
              ไม่พบรายการสินค้าที่ต้องนับ
            </div>
          )}
          
          {filteredIngredients.map(ing => {
            const currentCount = getQty(ing.id, ing.currentQty)
            const diff = parseFloat(currentCount) - Number(ing.currentQty)
            const isChanged = counts[ing.id] !== undefined && diff !== 0

            return (
              <div key={ing.id} className={cn(
                "flex items-center justify-between p-3 rounded-xl border transition-colors",
                isChanged ? "border-primary/50 bg-primary/5" : "border-border bg-background"
              )}>
                <div className="flex-1 min-w-0 pr-4">
                  <p className="font-semibold text-sm truncate text-foreground">{ing.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                    ในระบบ: {Number(ing.currentQty).toFixed(2)} {ing.unit}
                    {isChanged && (
                      <span className={cn(
                        "font-medium",
                        diff > 0 ? "text-emerald-500" : "text-red-500"
                      )}>
                        ({diff > 0 ? "+" : ""}{diff.toFixed(2)})
                      </span>
                    )}
                  </p>
                </div>
                
                <div className="flex items-center gap-1 shrink-0 bg-muted/30 p-1 rounded-lg border border-border/50">
                  <button 
                    onClick={() => handleUpdateQty(ing.id, ing.currentQty, -1)}
                    className="w-9 h-9 flex items-center justify-center rounded-md bg-background hover:bg-muted text-foreground border border-border shadow-sm active:scale-95 transition-all"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={currentCount}
                    onChange={(e) => handleUpdateQty(ing.id, ing.currentQty, e.target.value)}
                    className="w-14 h-9 text-center font-bold text-sm bg-transparent outline-none"
                    onFocus={(e) => e.target.select()}
                  />
                  <button 
                    onClick={() => handleUpdateQty(ing.id, ing.currentQty, 1)}
                    className="w-9 h-9 flex items-center justify-center rounded-md bg-background hover:bg-muted text-foreground border border-border shadow-sm active:scale-95 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Floating Action Bar for Submission */}
      <div className="sticky bottom-4 w-full pt-2">
        <div className="bg-card border border-border shadow-lg rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">
              เปลี่ยนแปลง <span className="text-primary">{itemsToSubmit.length}</span> รายการ
            </p>
            <p className="text-xs text-muted-foreground">จากทั้งหมด {ingredients.length} รายการ</p>
          </div>
          
          <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
            <DialogTrigger asChild>
              <button
                disabled={itemsToSubmit.length === 0}
                className="h-11 px-6 rounded-xl bg-primary text-primary-foreground font-bold disabled:opacity-50 flex items-center gap-2 shadow-sm hover:shadow active:scale-95 transition-all"
              >
                <Save className="w-5 h-5" /> ยืนยันการนับ
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>ยืนยันการบันทึกสต็อก</DialogTitle>
                <DialogDescription>
                  คุณต้องการบันทึกการนับสต็อกทั้ง {itemsToSubmit.length} รายการนี้ใช่หรือไม่?
                </DialogDescription>
              </DialogHeader>
              
              <div className="max-h-[40vh] overflow-y-auto py-4 space-y-3 border-y border-border my-2">
                {itemsToSubmit.map(item => {
                  const diff = (item?.countedQty ?? 0) - (item?.systemQty ?? 0)
                  return (
                    <div key={item?.ingredientId} className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate pr-2">{item?.name}</span>
                      <div className="flex items-center gap-3 shrink-0 text-right">
                        <span className="text-muted-foreground w-16 line-through">{item?.systemQty.toFixed(2)}</span>
                        <span>→</span>
                        <span className="font-bold w-16">{item?.countedQty.toFixed(2)}</span>
                        <span className={cn(
                          "w-14 text-xs font-semibold px-2 py-0.5 rounded-full text-center",
                          diff > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                        )}>
                          {diff > 0 ? "+" : ""}{diff.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="h-10 px-4 rounded-lg border border-border text-sm font-medium hover:bg-muted"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="h-10 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
                >
                  {saving ? "กำลังบันทึก..." : "ยืนยันการบันทึก"}
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
