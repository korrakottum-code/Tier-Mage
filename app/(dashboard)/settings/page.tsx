import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { SettingsTabs } from "@/components/settings/SettingsTabs"

export default async function SettingsPage() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") redirect("/")

  const [shopSettings, branches, paymentChannels, shiftConfigs, users] = await Promise.all([
    prisma.shopSettings.findFirst(),
    prisma.branch.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.paymentChannel.findMany({ orderBy: { name: "asc" } }),
    prisma.shiftConfig.findMany({ orderBy: { startTime: "asc" } }),
    prisma.user.findMany({
      include: { employee: { select: { name: true, branchId: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ตั้งค่าระบบ</h1>
        <p className="text-muted-foreground text-sm mt-1">จัดการร้าน, สาขา, ช่องทางรับเงิน และผู้ใช้</p>
      </div>
      <SettingsTabs
        shopSettings={shopSettings}
        branches={branches}
        paymentChannels={paymentChannels}
        shiftConfigs={shiftConfigs}
        users={users}
      />
    </div>
  )
}
