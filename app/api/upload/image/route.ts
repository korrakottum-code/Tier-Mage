import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || !["ADMIN", "MANAGER"].includes(session.user?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "ไฟล์ใหญ่เกินไป (สูงสุด 5MB)" }, { status: 400 })
    }

    // Validate type
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "รองรับเฉพาะ JPEG, PNG, WebP" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString("base64")
    const fileUrl = `data:${file.type};base64,${base64}`

    return NextResponse.json({ url: fileUrl })
  } catch (error) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
