import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { EmployeesClient } from "@/components/employees/EmployeesClient"

export default async function EmployeesPage() {
  const session = await auth()
  if (!session) redirect("/login")
  if (!["ADMIN", "MANAGER", "STAFF"].includes(session.user?.role ?? "")) {
    return <div className="p-10 text-red-500 font-bold">Error: Your role ({session.user?.role}) is not allowed to view this page.</div>
  }

  const userRole = session.user.role
  const employeeId = session.user.employeeId

  const [employees, branches] = await Promise.all([
    prisma.employee.findMany({
      where: { 
        isActive: true,
        ...(userRole === "STAFF" && employeeId ? { id: employeeId } : {})
      },
      include: { branch: { select: { id: true, name: true } }, user: { select: { id: true, email: true, role: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.branch.findMany({ where: { isActive: true }, select: { id: true, name: true } }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">พนักงาน</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {userRole === "STAFF" ? "จัดการเวลาเข้างานและตารางกะของคุณ" : "จัดการข้อมูลพนักงานทุกสาขา"}
        </p>
      </div>
      <EmployeesClient initialEmployees={employees} branches={branches} role={session.user?.role ?? "STAFF"} />
    </div>
  )
}
