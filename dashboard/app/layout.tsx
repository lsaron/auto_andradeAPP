import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Auto Andrade",
  description: "Sistema de gestión para taller mecánico Auto Andrade",
  generator: 'kroma-studios',
  icons: {
    icon: '/auto-andrade.png',
    shortcut: '/auto-andrade.png',
    apple: '/auto-andrade.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
