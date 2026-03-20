import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { DashboardShell } from "@/components/shared/DashboardShell"
import type { Role } from "@/types"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  return (
    <DashboardShell
      userName={session.user.name ?? session.user.email ?? "ผู้ใช้"}
      role={session.user.role as Role}
    >
      {children}
    </DashboardShell>
  )
}
