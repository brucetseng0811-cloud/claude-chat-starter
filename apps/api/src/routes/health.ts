import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '@chat/db'
import type { HealthResponse } from '@chat/shared'

/**
 * GET /health
 *
 * 這支 API 只有一個任務：讓學員一眼確認「環境到底通了沒」。
 * 它會分別檢查資料庫連得上嗎、pgvector extension 裝好了嗎，
 * 然後把結果丟給前端首頁畫成紅綠燈。
 *
 * 第六章單元 2 之後，路由會照這個 plugin 的寫法一支一支加上去。
 */
const healthRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async (_request, reply) => {
    let db: HealthResponse['db'] = 'error'
    let pgvector: HealthResponse['pgvector'] = 'missing'

    try {
      await prisma.$queryRaw`SELECT 1`
      db = 'ok'

      const rows = await prisma.$queryRaw<
        { installed: boolean }[]
      >`SELECT EXISTS (
          SELECT 1 FROM pg_extension WHERE extname = 'vector'
        ) AS installed`

      if (rows[0]?.installed) {
        pgvector = 'ok'
      }
    } catch (error) {
      fastify.log.error({ error }, '健康檢查失敗：資料庫連不上')
    }

    const body: HealthResponse = {
      status: 'ok',
      db,
      pgvector,
      uptimeSeconds: Math.round(process.uptime()),
    }

    return reply.code(db === 'ok' ? 200 : 503).send(body)
  })
}

export default healthRoute
