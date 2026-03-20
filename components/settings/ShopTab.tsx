"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const schema = z.object({
  shopName: z.string().min(1, "กรุณากรอกชื่อร้าน"),
  address: z.string().optional(),
  phone: z.string().optional(),
  taxId: z.string().optional(),
  receiptHeader: z.string().optional(),
  receiptFooter: z.string().optional(),
})
type FormData = z.infer<typeof schema>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ShopTab({ data }: { data: any }) {
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState("")

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      shopName: data?.shopName ?? "",
      address: data?.address ?? "",
      phone: data?.phone ?? "",
      taxId: data?.taxId ?? "",
      receiptHeader: data?.receiptHeader ?? "",
      receiptFooter: data?.receiptFooter ?? "",
    },
  })

  async function onSubmit(values: FormData) {
    setSaving(true)
    setMsg("")
    const res = await fetch("/api/settings/shop", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
    setSaving(false)
    setMsg(res.ok ? "บันทึกสำเร็จ ✅" : "เกิดข้อผิดพลาด ❌")
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">ข้อมูลร้าน</h2>

        <div className="space-y-2">
          <Label>ชื่อร้าน *</Label>
          <Input {...register("shopName")} placeholder="Tier Coffee" />
          {errors.shopName && <p className="text-xs text-destructive">{errors.shopName.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>ที่อยู่</Label>
          <Input {...register("address")} placeholder="ที่อยู่ร้าน" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>เบอร์โทร</Label>
            <Input {...register("phone")} placeholder="02-xxx-xxxx" />
          </div>
          <div className="space-y-2">
            <Label>เลขภาษี</Label>
            <Input {...register("taxId")} placeholder="0-0000-00000-00-0" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">ใบเสร็จ</h2>

        <div className="space-y-2">
          <Label>ข้อความหัวใบเสร็จ</Label>
          <Textarea {...register("receiptHeader")} placeholder="ขอบคุณที่ใช้บริการ..." rows={2} />
        </div>

        <div className="space-y-2">
          <Label>ข้อความท้ายใบเสร็จ</Label>
          <Textarea {...register("receiptFooter")} placeholder="พบกันใหม่นะคะ..." rows={2} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving} className="gap-2">
          <Save className="w-4 h-4" />
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </Button>
        {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
      </div>
    </form>
  )
}
