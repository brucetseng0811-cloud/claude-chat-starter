import { z } from 'zod'

/**
 * 環境變數在啟動時就一次驗證完。
 *
 * 為什麼不直接用 process.env？因為打錯字或漏設定的話，你會在跑到第 37 行
 * 才拿到 undefined，而且錯誤訊息通常爛到看不出原因。在這裡先擋下來，
 * 啟動就失敗，訊息也清楚。
 *
 * .env 放在專案「根目錄」，不是放在 apps/api 底下 ——
 * 前端、後端、Prisma CLI 都讀同一份，不用維護三份。
 */

const EnvSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL 沒設定。把根目錄的 .env.example 複製成 .env 即可。'),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  WEB_ORIGIN: z.string().default('http://localhost:3000'),

  // 單元 3 才會用到，所以現在是選填。
  ANTHROPIC_API_KEY: z.string().optional(),
  // 單元 7（RAG）才會用到。
  VOYAGE_API_KEY: z.string().optional(),
})

const parsed = EnvSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ 環境變數設定有問題：')
  for (const issue of parsed.error.issues) {
    console.error(`   ${issue.path.join('.')}: ${issue.message}`)
  }
  process.exit(1)
}

export const env = parsed.data
