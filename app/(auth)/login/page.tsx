"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Coffee, Eye, EyeOff, Hash, Mail } from "lucide-react"
import { cn } from "@/lib/utils"

type LoginMode = "email" | "pin"

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<LoginMode>("email")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [pin, setPin] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const credentials =
      mode === "email"
        ? { email, password }
        : { email, password: pin }

    const result = await signIn("credentials", {
      ...credentials,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError("อีเมล / PIN ไม่ถูกต้อง")
    } else {
      router.push("/")
      router.refresh()
    }
  }

  function handlePinInput(val: string) {
    if (/^\d{0,6}$/.test(val)) setPin(val)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
            <Coffee className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Tier Coffee</h1>
          <p className="text-muted-foreground text-sm mt-1">ระบบจัดการร้าน</p>
        </div>

        {/* Mode Toggle */}
        <div className="flex rounded-lg border border-border p-1 mb-6">
          <button
            type="button"
            onClick={() => { setMode("email"); setError("") }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors",
              mode === "email"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Mail className="w-4 h-4" />
            Email
          </button>
          <button
            type="button"
            onClick={() => { setMode("pin"); setError("") }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors",
              mode === "pin"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Hash className="w-4 h-4" />
            PIN
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">อีเมล</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@tiercoffee.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              data-testid="email-input"
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground"
            />
          </div>

          {mode === "email" ? (
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">รหัสผ่าน</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  data-testid="password-input"
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 pr-10 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label htmlFor="pin" className="text-sm font-medium text-foreground">PIN (4-6 หลัก)</label>
              <input
                id="pin"
                name="pin"
                type="password"
                inputMode="numeric"
                placeholder="••••"
                value={pin}
                onChange={(e) => handlePinInput(e.target.value)}
                required
                maxLength={6}
                data-testid="pin-input"
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-center text-2xl tracking-[1rem] outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground"
              />
            </div>
          )}

          {error && (
            <p className="text-destructive text-sm text-center bg-destructive/10 rounded-lg py-2 px-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            data-testid="login-button"
            className="w-full h-9 rounded-lg bg-primary text-primary-foreground font-medium text-sm transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        {/* Dev hint */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-6 p-3 rounded-lg border border-border/50 bg-muted/30 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Dev accounts:</p>
            <p>admin@tiercoffee.com / PIN: 0000</p>
            <p>manager@tiercoffee.com / PIN: 1111</p>
            <p>staff@tiercoffee.com / PIN: 2222</p>
          </div>
        )}
      </div>
    </div>
  )
}
