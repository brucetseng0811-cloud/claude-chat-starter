# Claude Chat Starter

第六章「Next.js + Fastify 仿 Claude Code 聊天機器人」的起始專案。

這個 repo **還不是**聊天機器人 —— 它只有一個環境檢查頁跟一支 `/health` API。
聊天功能、串流、對話記憶、RAG，都會在課程的單元裡帶著你用 Claude Code 一步步做出來。

先把無聊又容易出錯的部分（Docker、資料庫、monorepo 設定、型別鏈）準備好，
你才能把注意力放在真正要學的東西上。

---

## 環境需求

| 需要 | 版本 | 怎麼確認 |
|---|---|---|
| Node.js | **20.19+ / 22.12+ / 24+** | `node -v` |
| Docker Desktop | 任何近期版本，**而且要開著** | `docker info` |
| Claude Code | 已安裝並登入 | `claude --version` |

> **Node 版本要注意**：Prisma 7 不支援 Node 21 和 23 這類奇數版本。
> 如果你用 nvm，在專案目錄下跑 `nvm use` 就會自動切到 `.nvmrc` 指定的版本。
> 沒裝過 24 的話先 `nvm install 24`。

---

## 啟動（三個步驟）

```bash
# 1. 安裝套件
npm install

# 2. 設定環境變數（資料庫那條直接用預設值就能跑）
cp .env.example .env

# 3. 啟動資料庫 → 建立資料表 → 跑起前後端
npm run db:up
npm run db:migrate
npm run dev
```

打開 <http://localhost:3000>，你應該看到四個綠燈：

```
● 前端 (Next.js :3000)
● 後端 (Fastify :3001)
● 資料庫 (PostgreSQL :5433)
● pgvector extension
```

四項全綠就代表環境沒問題，可以開始單元 2 了。

---

## 專案結構

```
claude-chat-starter/
├── apps/
│   ├── web/                    Next.js 16 App Router（:3000）
│   │   └── app/page.tsx        環境檢查頁 ← 單元 4 會換成真的聊天室
│   └── api/                    Fastify 5（:3001）
│       └── src/
│           ├── server.ts       進入點：建 instance → 註冊 plugin → listen
│           ├── env.ts          環境變數驗證（啟動時就擋掉設定錯誤）
│           └── routes/
│               └── health.ts   路由的範本，之後每支 API 照這個寫
├── packages/
│   ├── shared/                 前後端共用的 zod schema 與型別
│   └── db/
│       ├── prisma/
│       │   ├── schema.prisma   目前沒有 model，單元 2 開始加
│       │   └── migrations/     第一個 migration 只做一件事：啟用 pgvector
│       ├── prisma.config.ts    Prisma 7 的 CLI 設定
│       └── src/index.ts        Prisma Client 單例
├── docs/
│   ├── architecture.md         系統設計文件（單元 1 的產出，已附上；單元 2 會用到）
│   └── design/                 Figma 設計稿的離線備份（單元 4 用）
├── docker-compose.yml          PostgreSQL 17 + pgvector
├── CLAUDE.md                   給 Claude Code 看的專案規則
└── .env.example
```

### 為什麼是 monorepo

因為前後端要共用型別。`packages/shared` 定義一次 `ChatRequest`，
後端拿它驗證 request、前端拿它推導型別。改壞了會在**編譯期**就爆，
而不是等到上線後使用者按下送出才發現欄位名稱對不上。

### 為什麼資料庫用 5433 不是 5432

很多人本機已經裝了 PostgreSQL 佔著 5432。用 5433 可以避開衝突，
你不用先去停掉原本的服務。

### 為什麼一開始就裝 pgvector

單元 7 的 RAG 要做向量相似度檢索。與其到時候再換 image、重建資料庫，
不如一開始就用 `pgvector/pgvector:pg17`。前六個單元用不到它，但它也不礙事。

---

## 常見錯誤

**`Prisma only supports Node.js versions 20.19+, 22.12+, 24.0+`**
你的 Node 是不支援的版本（常見的是 21 或 23）。跑 `nvm use` 切到 24，
然後把 `node_modules` 刪掉重裝：`rm -rf node_modules && npm install`。

**`EADDRINUSE: address already in use 0.0.0.0:3001`**
3001 被別的程式佔走了（很可能是你之前沒關掉的 dev server）。兩種解法：

```bash
# 找出來關掉
lsof -nP -iTCP:3001 -sTCP:LISTEN

# 或改用別的 port：編輯 .env
PORT=3002
WEB_ORIGIN="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3002"
```

前端的 3000 被佔用也是同樣道理，改 `npm run dev:web -- --port 3005`。

**`Can't reach database server at localhost:5433`**
Docker 沒開，或容器沒起來。依序確認：

```bash
docker info           # Docker Desktop 有在跑嗎
docker compose ps     # 容器 STATUS 應該是 Up (healthy)
docker compose logs db --tail 30
```

如果容器一直重啟，通常是 5433 也被佔用了 —— 改 `docker-compose.yml` 的 `ports`
和 `.env` 的 `DATABASE_URL`，兩邊要一起改。

**`The datasource.url property is required in your Prisma config file`**
`.env` 沒建立。跑 `cp .env.example .env`。

**環境檢查頁「後端」是紅燈，但後端終端機看起來正常**
多半是 CORS。確認 `.env` 的 `WEB_ORIGIN` 跟你瀏覽器網址列的 origin 完全一致
（含 port，`localhost` 和 `127.0.0.1` 算不同的 origin）。

**pgvector 是紅燈**
`npm run db:migrate` 沒跑過。跑一次就會裝好。

**`Cannot find module '.../packages/db/generated/prisma/client.js'`**
Prisma Client 沒生成。正常情況下 `npm install` 會自動跑 `prisma generate`，
如果你手動刪過 `generated/`，補跑一次：

```bash
npm run -w @chat/db generate
```

**想全部砍掉重來**

```bash
npm run db:reset      # 刪掉資料庫 volume、重建、重跑 migration
```

如果連 node_modules 也要重來：

```bash
rm -rf node_modules apps/web/.next packages/db/generated
npm install
```

---

## 接下來

回到課程，開始 **第六章 單元 2 — 專案初始化**。
