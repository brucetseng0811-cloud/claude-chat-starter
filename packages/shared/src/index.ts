import { z } from 'zod'

/**
 * 前後端共用的型別與驗證 schema。
 *
 * 為什麼要有這個 package？
 * 後端用 zod schema 驗證進來的 request，前端用同一份 schema 推導出 TypeScript 型別。
 * 契約只寫一次，改了一邊另一邊會立刻編譯失敗 —— 這是 monorepo 最直接的好處。
 *
 * 第六章的每個單元都會往這裡加東西：
 *   單元 3  ChatRequest / ChatResponse
 *   單元 5  SSE 事件型別
 *   單元 6  Conversation / Message
 *   單元 7  Memory
 */

// ---------------------------------------------------------------------------
// 健康檢查（單元 2 用來確認前後端 + 資料庫都通了）
// ---------------------------------------------------------------------------

export const HealthResponseSchema = z.object({
  status: z.literal('ok'),
  db: z.enum(['ok', 'error']),
  /** pgvector extension 是否已安裝，單元 7 的 RAG 會需要 */
  pgvector: z.enum(['ok', 'missing']),
  uptimeSeconds: z.number(),
})

export type HealthResponse = z.infer<typeof HealthResponseSchema>

// ---------------------------------------------------------------------------
// 統一的錯誤回應格式
// ---------------------------------------------------------------------------

export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
})

export type ApiError = z.infer<typeof ApiErrorSchema>
