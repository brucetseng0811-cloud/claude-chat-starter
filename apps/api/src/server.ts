import Fastify from 'fastify'
import cors from '@fastify/cors'
import { env } from './env.js'
import healthRoute from './routes/health.js'

/**
 * Fastify 進入點。
 *
 * 結構刻意保持最小：建立 instance → 註冊 plugin → 註冊路由 → listen。
 * 之後每個單元都是往「註冊路由」那一段加一行，不會動到其他部分。
 */

const fastify = Fastify({
  logger: {
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport:
      env.NODE_ENV === 'production'
        ? undefined
        : { target: 'pino-pretty', options: { colorize: true } },
  },
})

// 前端跑在 3000、後端跑在 3001，屬於跨來源請求，所以要開 CORS。
await fastify.register(cors, {
  origin: env.WEB_ORIGIN,
  credentials: true,
})

await fastify.register(healthRoute)

// 單元 3 會在這裡加上：await fastify.register(chatRoute)

const shutdown = async (signal: string) => {
  fastify.log.info(`收到 ${signal}，正在關閉伺服器…`)
  await fastify.close()
  process.exit(0)
}

process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))

try {
  // host 用 0.0.0.0，第七章單元 5 部署到 Cloud Run 時才連得進來。
  await fastify.listen({ port: env.PORT, host: '0.0.0.0' })
} catch (error) {
  fastify.log.error(error)
  process.exit(1)
}
