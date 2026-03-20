import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { TicketsClient } from "@/components/tickets/TicketsClient"

export default async function TicketsPage() {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">คำร้อง</h1>
        <p className="text-muted-foreground text-sm mt-1">แจ้งปัญหา ขอวัตถุดิบ หรือส่งข้อความถึงผู้จัดการ</p>
      </div>
      <TicketsClient role={session.user?.role ?? "STAFF"} />
    </div>
  )
}
