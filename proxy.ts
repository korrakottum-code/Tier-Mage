import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

const publicPaths = ["/login"]

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isPublic = publicPaths.some((p) => pathname.startsWith(p))

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  })

  if (!token && !isPublic) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (token && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  const role = token?.role as string | undefined

  if (pathname.startsWith("/settings") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  if (
    pathname.startsWith("/accounting") &&
    role !== "ADMIN" &&
    role !== "MANAGER"
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  if (
    pathname.startsWith("/analytics") &&
    role !== "ADMIN" &&
    role !== "MANAGER"
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  if (
    pathname.startsWith("/employees") &&
    role !== "ADMIN" &&
    role !== "MANAGER" &&
    role !== "STAFF"
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  if (
    pathname.startsWith("/shift-closing") &&
    role !== "ADMIN" &&
    role !== "MANAGER" &&
    role !== "STAFF"
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  if (
    pathname.startsWith("/settlements") &&
    role !== "ADMIN" &&
    role !== "MANAGER"
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icons|manifest.json).*)"],
}
