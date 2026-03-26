import type { Metadata } from "next"
import { Prompt, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"

const sans = Prompt({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["thai", "latin"],
  variable: "--font-sans",
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Tier Coffee | Management System",
  description: "ระบบจัดการร้าน Tier Coffee",
  manifest: "/manifest.json",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="th"
      className={`${sans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full bg-background text-foreground">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
