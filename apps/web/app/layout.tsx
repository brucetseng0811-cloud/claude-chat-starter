import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Claude Chat — 環境檢查',
  description: 'Next.js + Fastify 仿 Claude Code 聊天機器人',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  )
}
