"use client"

import { useState } from "react"
import { Minus, Plus, Trash2, CreditCard, Banknote, X, ShoppingCart } from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = any

function AddOnsDialog({ item, onAdd, onClose }: { item: AnyRecord; onAdd: (item: AnyRecord, options: any[]) => void; onClose: () => void }) {
  const [selectedChoices, setSelectedChoices] = useState<Record<string, number>>({})

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">{item.name}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {item.menuOptions?.map((option: AnyRecord) => {
            const selected = selectedChoices[option.id] ?? 0
            return (
              <div key={option.id} className="space-y-2">
                <label className="text-sm font-medium">{option.name}</label>
                <div className="grid grid-cols-2 gap-2">
                  {option.choices.map((choice: string, idx: number) => {
                    const priceModifier = option.priceModifier?.[idx] || 0
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedChoices(prev => ({ ...prev, [option.id]: idx }))}
                        className={cn(
                          "px-3 py-2 rounded-lg border text-sm transition-colors",
                          selected === idx
                            ? "border-primary bg-primary/10 text-primary font-medium"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        {choice}
                        {priceModifier > 0 && <span className="text-xs ml-1">+{priceModifier}฿</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <button
          onClick={() => {
            const options = item.menuOptions?.map((opt: AnyRecord) => {
              const choiceIdx = selectedChoices[opt.id] ?? 0
              return {
                name: opt.name,
                choice: opt.choices[choiceIdx],
                priceModifier: opt.priceModifier?.[choiceIdx] || 0
              }
            })
            onAdd(item, options)
          }}
          className="w-full h-10 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
        >
          เพิ่มลงตะกร้า
        </button>
      </div>
    </div>
  )
}

interface CartItem {
  menuItemId: string
  name: string
  unitPrice: number
  quantity: number
  options?: { name: string; choice: string; priceModifier: number }[]
}

interface PosOrderPanelProps {
  menuItems: AnyRecord[]
  categories: AnyRecord[]
  paymentChannels: AnyRecord[]
  branches: { id: string; name: string }[]
}

const sourceOptions = [
  { value: "WALK_IN", label: "Walk-in" },
  { value: "GRAB", label: "Grab" },
  { value: "LINE_MAN", label: "LINE MAN" },
  { value: "ROBINHOOD", label: "Robinhood" },
  { value: "SHOPEE_FOOD", label: "Shopee Food" },
  { value: "OTHER_DELIVERY", label: "Delivery อื่น" },
]

export function PosOrderPanel({ menuItems, categories, paymentChannels, branches }: PosOrderPanelProps) {
  const [activeCat, setActiveCat] = useState<string | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [discount, setDiscount] = useState(0)
  const [source, setSource] = useState("WALK_IN")
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "")
  const [channelId, setChannelId] = useState(paymentChannels[0]?.id ?? "")
  const [amountPaid, setAmountPaid] = useState("")
  const [showCheckout, setShowCheckout] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [lastOrder, setLastOrder] = useState<AnyRecord | null>(null)
  const [showMobileCart, setShowMobileCart] = useState(false)
  const [editingTotal, setEditingTotal] = useState(false)
  const [customTotal, setCustomTotal] = useState<number | null>(null)
  const [selectedItem, setSelectedItem] = useState<AnyRecord | null>(null)

  const filteredItems = activeCat ? menuItems.filter((m) => m.categoryId === activeCat) : menuItems
  const subtotal = cart.reduce((s, i) => {
    const optionsPrice = (i.options || []).reduce((sum, opt) => sum + opt.priceModifier, 0)
    return s + (i.unitPrice + optionsPrice) * i.quantity
  }, 0)
  const total = customTotal !== null ? customTotal : Math.max(0, subtotal - discount)
  const change = parseFloat(amountPaid || "0") - total

  function addToCart(item: AnyRecord, options?: { name: string; choice: string; priceModifier: number }[]) {
    setCart((prev) => [
      ...prev,
      { menuItemId: item.id, name: item.name, unitPrice: Number(item.price), quantity: 1, options }
    ])
    setSelectedItem(null)
  }

  function handleItemClick(item: AnyRecord) {
    // ถ้าเมนูมี options ให้แสดง dialog เลือก add-ons
    if (item.menuOptions && item.menuOptions.length > 0) {
      setSelectedItem(item)
    } else {
      addToCart(item)
    }
  }

  function updateQty(itemIndex: number, delta: number) {
    setCart((prev) => prev
      .map((c, idx) => idx === itemIndex ? { ...c, quantity: c.quantity + delta } : c)
      .filter((c) => c.quantity > 0)
    )
  }

  function clearCart() {
    setCart([]); setDiscount(0); setAmountPaid(""); setLastOrder(null); setShowMobileCart(false); setCustomTotal(null); setEditingTotal(false)
  }

  async function handleCheckout() {
    if (cart.length === 0) return
    setSubmitting(true)
    const res = await fetch("/api/pos/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        branchId,
        channelId,
        source,
        items: cart.map((c) => ({ 
          menuItemId: c.menuItemId, 
          quantity: c.quantity, 
          unitPrice: c.unitPrice,
          options: c.options || null
        })),
        discount,
        amountPaid: parseFloat(amountPaid) || total,
      }),
    })
    if (res.ok) {
      const order = await res.json()
      setLastOrder(order)
      setShowCheckout(false)
      clearCart()
    }
    setSubmitting(false)
  }

  return (
    <div className="flex h-full overflow-hidden relative">
      {/* Left: Menu */}
      <div className={cn("flex-1 flex flex-col overflow-hidden border-r border-border transition-all", showMobileCart ? "hidden md:flex" : "flex")}>
        {/* Category filter */}
        <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto shrink-0 border-b border-border">
          <button
            onClick={() => setActiveCat(null)}
            className={cn("shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors", activeCat === null ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}
          >
            ทั้งหมด
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              className={cn("shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors", activeCat === cat.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Menu grid */}
        <div className="flex-1 overflow-y-auto p-3 pb-20 md:pb-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {filteredItems.map((item) => {
              const inCart = cart.some((c) => c.menuItemId === item.id)
              const totalQty = cart.filter((c) => c.menuItemId === item.id).reduce((sum, c) => sum + c.quantity, 0)
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={cn(
                    "relative rounded-xl border p-3 text-left transition-all hover:border-primary/50 hover:bg-primary/5 active:scale-95",
                    inCart ? "border-primary/40 bg-primary/5" : "border-border bg-card"
                  )}
                >
                  {inCart && (
                    <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                      {totalQty}
                    </span>
                  )}
                  {item.imageUrl ? (
                    <div className="w-full aspect-square rounded-lg bg-muted mb-2 overflow-hidden">
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-full aspect-square rounded-lg bg-muted flex items-center justify-center text-3xl mb-2">☕</div>
                  )}
                  <p className="text-xs font-medium leading-tight line-clamp-2">{item.name}</p>
                  <p className="text-sm font-bold text-primary mt-1">{formatCurrency(Number(item.price))}</p>
                </button>
              )
            })}
            {filteredItems.length === 0 && (
              <div className="col-span-full text-center py-10 text-muted-foreground text-sm">ไม่มีเมนู</div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Floating Cart Button */}
      {!showMobileCart && cart.length > 0 && (
        <button
          onClick={() => setShowMobileCart(true)}
          className="md:hidden absolute bottom-4 left-4 right-4 h-12 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg flex items-center justify-between px-4 z-10 animate-in slide-in-from-bottom-5"
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            <span>{cart.length} รายการ</span>
          </div>
          <span>{formatCurrency(total)}</span>
        </button>
      )}

      {/* Right: Cart */}
      <div className={cn("w-full md:w-72 xl:w-80 flex-col shrink-0 bg-card", showMobileCart ? "flex" : "hidden md:flex")}>
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowMobileCart(false)} className="md:hidden p-1 -ml-1 rounded text-muted-foreground hover:bg-muted">
              <X className="w-5 h-5" />
            </button>
            <span className="font-semibold text-sm">ออเดอร์ ({cart.length} รายการ)</span>
          </div>
          {cart.length > 0 && (
            <button onClick={clearCart} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" /> ล้าง
            </button>
          )}
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-8">
              <p className="text-3xl mb-2">🛒</p>
              <p>ยังไม่มีรายการ</p>
              <p className="text-xs mt-1">แตะเมนูเพื่อเพิ่ม</p>
            </div>
          )}
          {cart.map((item, idx) => {
            const optionsPrice = (item.options || []).reduce((sum, opt) => sum + opt.priceModifier, 0)
            const itemTotal = (item.unitPrice + optionsPrice) * item.quantity
            return (
              <div key={idx} className="flex items-center gap-2 rounded-lg bg-muted/30 px-2 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{item.name}</p>
                  {item.options && item.options.length > 0 && (
                    <p className="text-[10px] text-muted-foreground">
                      {item.options.map(opt => `${opt.choice}${opt.priceModifier > 0 ? ` +${opt.priceModifier}฿` : ''}`).join(', ')}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">{formatCurrency(item.unitPrice + optionsPrice)} × {item.quantity}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => updateQty(idx, -1)} className="w-6 h-6 rounded-md bg-muted hover:bg-muted/80 flex items-center justify-center">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-xs font-medium">{item.quantity}</span>
                  <button onClick={() => updateQty(idx, 1)} className="w-6 h-6 rounded-md bg-primary/20 hover:bg-primary/30 flex items-center justify-center">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs font-bold w-14 text-right shrink-0">{formatCurrency(itemTotal)}</p>
              </div>
            )
          })}
        </div>

        {/* Summary */}
        <div className="px-4 py-3 border-t border-border space-y-2 shrink-0">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>ยอดรวม</span><span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">ส่วนลด</span>
            <input
              type="number" min="0" value={discount || ""}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              className="w-20 h-7 px-2 rounded-md border border-input bg-background text-right text-xs outline-none"
            />
          </div>
          <div className="flex justify-between text-sm font-bold">
            <span>ยอดสุทธิ</span>
            {editingTotal ? (
              <input
                type="number"
                value={customTotal ?? total}
                onChange={(e) => setCustomTotal(parseFloat(e.target.value) || 0)}
                onBlur={() => setEditingTotal(false)}
                className="w-24 text-right px-2 py-0.5 rounded border border-primary bg-background text-primary font-bold text-sm"
                autoFocus
              />
            ) : (
              <button
                onClick={() => { setEditingTotal(true); setCustomTotal(total) }}
                className="text-primary hover:underline"
              >
                {formatCurrency(total)}
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">สาขา</label>
              <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="h-7 w-full rounded-md border border-input bg-background px-2 text-xs outline-none">
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">ช่องทาง</label>
              <select value={source} onChange={(e) => setSource(e.target.value)} className="h-7 w-full rounded-md border border-input bg-background px-2 text-xs outline-none">
                {sourceOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <button
            onClick={() => setShowCheckout(true)}
            disabled={cart.length === 0}
            className="w-full h-10 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-40 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <CreditCard className="w-4 h-4" /> ชำระเงิน {formatCurrency(total)}
          </button>
        </div>
      </div>

      {/* Add-ons Selection Dialog */}
      {selectedItem && (
        <AddOnsDialog
          item={selectedItem}
          onAdd={addToCart}
          onClose={() => setSelectedItem(null)}
        />
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">ชำระเงิน</h3>
              <button onClick={() => setShowCheckout(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>

            <div className="text-center py-2">
              <p className="text-muted-foreground text-sm">ยอดที่ต้องชำระ</p>
              <p className="text-4xl font-bold text-primary mt-1">{formatCurrency(total)}</p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">ช่องทางชำระ</label>
                <select value={channelId} onChange={(e) => setChannelId(e.target.value)} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring">
                  {paymentChannels.map((ch) => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">รับเงินมา (บาท)</label>
                <input
                  type="number" min={total} step="0.25" value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder={String(total)}
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring text-right"
                />
              </div>
              {parseFloat(amountPaid) >= total && (
                <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 px-3 py-2">
                  <span className="text-sm text-emerald-400 font-medium">เงินทอน</span>
                  <span className="text-lg font-bold text-emerald-400">{formatCurrency(change)}</span>
                </div>
              )}

              {/* Quick cash buttons */}
              <div className="grid grid-cols-4 gap-1.5">
                {[20, 50, 100, 500].map((amt) => (
                  <button key={amt} onClick={() => setAmountPaid(String(Math.ceil(total / amt) * amt))}
                    className="h-8 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors">
                    {amt >= 100 ? `${amt}` : amt}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={submitting || cart.length === 0 || (parseFloat(amountPaid || "0") < total && channelId === paymentChannels.find(c => c.type === "INSTANT")?.id)}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold text-base disabled:opacity-40 hover:bg-primary/90 flex items-center justify-center gap-2"
            >
              <Banknote className="w-5 h-5" />
              {submitting ? "กำลังบันทึก..." : "ยืนยันการชำระเงิน"}
            </button>
          </div>
        </div>
      )}

      {/* Success toast */}
      {lastOrder && (
        <div className="fixed bottom-4 right-4 z-50 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 flex items-center gap-3 shadow-lg">
          <span className="text-emerald-400 text-xl">✓</span>
          <div>
            <p className="text-sm font-semibold text-emerald-300">บันทึกออเดอร์สำเร็จ</p>
            <p className="text-xs text-muted-foreground">{lastOrder.orderNumber}</p>
          </div>
          <button onClick={() => setLastOrder(null)} className="text-muted-foreground hover:text-foreground ml-2"><X className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  )
}
