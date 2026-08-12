import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from 'dotenv'
import { defineConfig } from 'prisma/config'

/**
 * Prisma 7 把 CLI 設定從 schema.prisma 搬到這個檔案。
 *
 * 注意 dotenv 的路徑：.env 放在「專案根目錄」，但 Prisma CLI 是從
 * packages/db 底下執行的，所以要明確指到上兩層，不能只寫 import 'dotenv/config'
 * （那樣只會找當前目錄，然後你會拿到一個很難懂的 "datasource.url is required" 錯誤）。
 */
const here = path.dirname(fileURLToPath(import.meta.url))
config({ path: path.resolve(here, '../../.env') })

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DATABASE_URL']!,
  },
})
