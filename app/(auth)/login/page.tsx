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
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-background overflow-hidden">
      {/* Abstract Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,var(--color-primary)_0%,transparent_70%)] opacity-15" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      
      <div className="relative w-full max-w-sm z-10">
        <div className="bg-card/40 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-3xl p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/5 border border-primary/20 flex items-center justify-center mb-6 shadow-lg shadow-primary/20 relative group">
              <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Coffee className="w-10 h-10 text-primary relative z-10" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">Tier Coffee</h1>
            <p className="text-muted-foreground text-sm mt-2 font-medium tracking-wide">ระบบจัดการร้าน</p>
          </div>

          {/* Mode Toggle */}
          <div className="flex rounded-xl bg-background/50 border border-white/5 p-1 mb-8 backdrop-blur-md">
            <button
              type="button"
              onClick={() => { setMode("email"); setError("") }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-300",
                mode === "email"
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
            <button
              type="button"
              onClick={() => { setMode("pin"); setError("") }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-300",
                mode === "pin"
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              <Hash className="w-4 h-4" />
              PIN
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground/90 ml-1">อีเมล</label>
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
                className="h-11 w-full rounded-xl border border-white/10 bg-background/50 backdrop-blur-sm px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
              />
            </div>

            {mode === "email" ? (
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground/90 ml-1">รหัสผ่าน</label>
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
                    className="h-11 w-full rounded-xl border border-white/10 bg-background/50 backdrop-blur-sm px-4 pr-11 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label htmlFor="pin" className="text-sm font-medium text-foreground/90 ml-1">PIN (4-6 หลัก)</label>
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
                  className="h-11 w-full rounded-xl border border-white/10 bg-background/50 backdrop-blur-sm px-4 text-center text-3xl tracking-[1rem] outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/30 font-mono"
                />
              </div>
            )}

            {error && (
              <div className="animate-in fade-in slide-in-from-top-1 bg-destructive/15 border border-destructive/30 text-destructive text-sm text-center rounded-xl py-2.5 px-3 font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              data-testid="login-button"
              className="w-full h-11 mt-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:bg-primary/90 shadow-[0_4px_14px_0_rgba(217,119,6,0.2)] hover:shadow-[0_6px_20px_rgba(217,119,6,0.3)] hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none disabled:hover:translate-y-0"
            >
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </form>

          {/* Dev hint */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-8 p-4 rounded-xl border border-white/5 bg-black/20 text-xs text-muted-foreground/80 space-y-1.5 backdrop-blur-md">
              <p className="font-semibold text-foreground/90 mb-2 flex items-center gap-1.5"><Coffee className="w-3 h-3"/> Test Accounts</p>
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono">
                <span>admin@tiercoffee.com</span><span className="text-right opacity-50">0000</span>
                <span>manager@tiercoffee.com</span><span className="text-right opacity-50">1111</span>
                <span>staff@tiercoffee.com</span><span className="text-right opacity-50">2222</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
