# CLAUDE.md

這個檔案會在每次對話開始時自動載入 Claude Code 的 context。
寫在這裡的規則，Claude 每次都會看到，不需要你重複交代。

## 這是什麼專案

一個仿 Claude Code 的聊天機器人，前後端分離：

- `apps/web` — Next.js 16 App Router，跑在 :3000
- `apps/api` — Fastify 5，跑在 :3001
- `packages/shared` — 前後端共用的 zod schema 與型別
- `packages/db` — Prisma schema、migration、Prisma Client 單例

## 指令

| 目的 | 指令 |
|---|---|
| 啟動資料庫 | `npm run db:up` |
| 前後端一起跑 | `npm run dev` |
| 只跑後端 | `npm run dev:api` |
| 只跑前端 | `npm run dev:web` |
| 建 migration 並套用 | `npm run db:migrate` |
| 資料庫砍掉重來 | `npm run db:reset` |
| 型別檢查 | `npm run typecheck` |

Node 版本用 `.nvmrc` 指定的 24（Prisma 7 不支援 Node 21/23 這種奇數版）。

## 專案規則

**架構**

- 前端只透過 HTTP 呼叫 `apps/api`，**不要**在 Next.js 裡直接連資料庫、也不要在 `app/api/` 開 route handler。所有後端邏輯都在 Fastify。
- 前後端之間傳的每一種資料，型別都定義在 `packages/shared`，兩邊 import 同一份。不要在單邊各寫一份 interface。
- 資料庫只透過 `packages/db` 匯出的 `prisma` 單例存取。不要在別的地方 `new PrismaClient()`。

**後端**

- 每支 API 是一個 Fastify plugin，放在 `apps/api/src/routes/`，在 `server.ts` 註冊。照 `routes/health.ts` 的寫法。
- 進來的 request 一律用 `packages/shared` 的 zod schema 驗證後才使用。
- 新增環境變數時，必須同時加進 `apps/api/src/env.ts` 的 schema 和 `.env.example`。

**資料庫**

- schema 改動一律經由 `npm run db:migrate` 產生 migration，**不要**用 `prisma db push`，也不要手改 `migrations/` 底下已經套用過的 SQL。
- 向量欄位（單元 7）Prisma 沒有原生型別，用 `Unsupported("vector(1024)")` 宣告，搭配 `$queryRaw` 做相似度查詢。

**前端**

- 預設寫 Server Component。只有真的需要 state、effect、事件處理時才加 `'use client'`。
- 樣式用 Tailwind 4。設計 token 定義在 `apps/web/app/globals.css` 的 `@theme` 區塊，**顏色與間距請引用 token，不要寫死 hex 或 magic number**。
- 沒有 `tailwind.config.js`，Tailwind 4 不需要。

**慣用工具**

- 套件管理是 npm workspaces。不要建議改用 pnpm 或 yarn，也不要在子目錄各自 `npm install`。
- 不要為了型別方便就用 `any`。真的不知道型別就用 `unknown` 再收斂。

## 關於 apps/web/AGENTS.md

`apps/web/` 底下的 `CLAUDE.md` 與 `AGENTS.md` 是 **Next.js 自己產生的**，
每次跑 `next dev` 都會重新寫入。內容是提醒 AI「Next 16 跟你訓練資料裡的不一樣，
請先讀 node_modules/next/dist/docs/」。

不要刪除它們（刪了下次 dev 又會出現），把它們一起 commit 進去就好。
Claude Code 支援巢狀 CLAUDE.md：在 `apps/web` 底下工作時，
根目錄這份和那份會同時生效。

## 目前進度

這是課程的起始狀態：只有健康檢查頁 + `/health` API。
`packages/db/prisma/schema.prisma` 目前沒有任何 model —— 這是刻意的，
第六章的單元會一步步把 model 加上去。
