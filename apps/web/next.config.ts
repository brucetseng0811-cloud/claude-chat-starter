import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // @chat/shared 是 workspace 內未編譯的 TypeScript source，
  // 要讓 Next 幫忙 transpile 才吃得下。
  transpilePackages: ['@chat/shared'],
}

export default nextConfig
