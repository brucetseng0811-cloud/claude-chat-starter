'use client'

import { useEffect, useState } from 'react'
import { HealthResponseSchema, type HealthResponse } from '@chat/shared'

/**
 * 環境檢查頁。
 *
 * 這頁不是產品的一部分 —— 它是給你（和學員）確認「四件事都通了沒」的儀表板：
 * 前端跑起來了、後端連得到、資料庫連得到、pgvector 裝好了。
 *
 * 第六章單元 4 我們會用 Figma MCP 把這頁換成真正的聊天室介面。
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

type Check = {
  label: string
  state: 'ok' | 'bad' | 'pending'
  hint: string
}

export default function Home() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    fetch(`${API_URL}/health`, { signal: controller.signal })
      .then((res) => res.json())
      .then((json) => setHealth(HealthResponseSchema.parse(json)))
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : String(err))
      })

    return () => controller.abort()
  }, [])

  const checks: Check[] = [
    {
      label: '前端 (Next.js :3000)',
      state: 'ok',
      hint: '你看得到這個畫面就代表沒問題',
    },
    {
      label: '後端 (Fastify :3001)',
      state: error ? 'bad' : health ? 'ok' : 'pending',
      hint: error
        ? '連不上。確認另一個終端機有跑 npm run dev'
        : '/health 有回應',
    },
    {
      label: '資料庫 (PostgreSQL :5433)',
      state: health ? (health.db === 'ok' ? 'ok' : 'bad') : 'pending',
      hint:
        health?.db === 'error'
          ? '連不上。先跑 npm run db:up 把 Docker 容器啟動'
          : 'SELECT 1 成功',
    },
    {
      label: 'pgvector extension',
      state: health ? (health.pgvector === 'ok' ? 'ok' : 'bad') : 'pending',
      hint:
        health?.pgvector === 'missing'
          ? '還沒安裝。跑 npm run db:migrate 即可（單元 7 才會真的用到）'
          : 'extension 已就緒',
    },
  ]

  const allOk = checks.every((c) => c.state === 'ok')

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-8 p-8">
      <header>
        <p className="text-sm font-medium tracking-wide text-(--color-ink-muted)">
          Next.js + Fastify 仿 Claude Code 聊天機器人
        </p>
        <h1 className="mt-1 text-3xl font-semibold">環境檢查</h1>
      </header>

      <ul className="flex flex-col gap-2">
        {checks.map((check) => (
          <li
            key={check.label}
            className="flex items-start gap-3 rounded-xl bg-(--color-surface-raised) p-4 shadow-sm"
          >
            <StatusDot state={check.state} />
            <div className="min-w-0">
              <p className="font-medium">{check.label}</p>
              <p className="text-sm text-(--color-ink-muted)">{check.hint}</p>
            </div>
          </li>
        ))}
      </ul>

      <footer className="text-sm text-(--color-ink-muted)">
        {allOk ? (
          <p className="font-medium text-(--color-ok)">
            四項全綠 — 環境沒問題，可以開始單元 2 了。
          </p>
        ) : (
          <p>
            有紅燈的話照著上面的提示修，修完重新整理這一頁。詳細排錯步驟在
            README.md。
          </p>
        )}
      </footer>
    </main>
  )
}

function StatusDot({ state }: { state: Check['state'] }) {
  const color =
    state === 'ok'
      ? 'bg-(--color-ok)'
      : state === 'bad'
        ? 'bg-(--color-bad)'
        : 'bg-(--color-ink-muted) animate-pulse'

  return (
    <span
      className={`mt-1.5 size-2.5 shrink-0 rounded-full ${color}`}
      role="img"
      aria-label={
        state === 'ok' ? '正常' : state === 'bad' ? '異常' : '檢查中'
      }
    />
  )
}
