import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client.js'

/**
 * Prisma Client 單例。
 *
 * Prisma 7 開始一定要搭配 driver adapter（這裡是 PrismaPg，底層就是 node-postgres），
 * 不再有內建的 Rust query engine。好處是 bundle 小很多、也能跑在 edge runtime。
 *
 * 為什麼要單例：dev 模式下檔案一存檔就 hot reload，每次 reload 都 new 一個
 * PrismaClient 會把資料庫連線數吃光。掛在 globalThis 上就只會建立一次。
 */

const connectionString = process.env['DATABASE_URL']

if (!connectionString) {
  throw new Error(
    'DATABASE_URL 沒有設定。請把專案根目錄的 .env.example 複製成 .env。',
  )
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  })

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.prisma = prisma
}

export * from '../generated/prisma/client.js'
