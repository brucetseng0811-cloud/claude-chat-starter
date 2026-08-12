#!/usr/bin/env node
/**
 * 從 mockup/index.html 重新產生所有設計稿截圖。
 *
 *   node docs/design/capture.mjs
 *
 * 改過 mockup 之後跑這支，docs/design/*.png 就會全部更新。
 * 完全不碰 Figma，所以不消耗任何 MCP 額度。
 *
 * 需要：本機裝有 Google Chrome。
 */

import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { readFile, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const PORT = 4288
const SCALE = 2

const CHROME_CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
]

/** 每個畫板的位置與尺寸（CSS px）。y 是該 section 的起點，實際上緣會自動偵測。 */
const FRAMES = [
  { file: 'chat-desktop.png', x: 64, y: 64, w: 1280, h: 800 },
  { file: 'chat-streaming.png', x: 64, y: 963, w: 1280, h: 800 },
  { file: 'chat-empty.png', x: 64, y: 1862, w: 1280, h: 800 },
  { file: 'chat-dark.png', x: 64, y: 2761, w: 1280, h: 800 },
  { file: 'chat-mobile.png', x: 64, y: 3660, w: 390, h: 844 },
  { file: 'components-states.png', x: 64, y: 4603, w: 1280, h: 716 },
  { file: 'tokens-color.png', x: 64, y: 5418, w: 1280, h: 549 },
]

async function findChrome() {
  for (const candidate of CHROME_CANDIDATES) {
    try {
      await readFile(candidate)
      return candidate
    } catch {
      // 讀不到就換下一個
    }
  }
  throw new Error(
    '找不到 Chrome。請安裝 Google Chrome，或自行修改 CHROME_CANDIDATES。',
  )
}

function serveMockup() {
  const server = createServer(async (req, res) => {
    try {
      const html = await readFile(path.join(here, 'mockup', 'index.html'))
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
      res.end(html)
    } catch (error) {
      res.writeHead(500)
      res.end(String(error))
    }
  })
  return new Promise((resolve) => server.listen(PORT, () => resolve(server)))
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'ignore' })
    child.on('error', reject)
    child.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`${cmd} 結束於 exit code ${code}`)),
    )
  })
}

const chrome = await findChrome()
const server = await serveMockup()
const workdir = await mkdtemp(path.join(tmpdir(), 'design-capture-'))
const fullPng = path.join(workdir, 'full.png')

try {
  await run(chrome, [
    '--headless',
    '--disable-gpu',
    '--hide-scrollbars',
    `--force-device-scale-factor=${SCALE}`,
    '--window-size=1728,6200',
    '--virtual-time-budget=4000',
    `--screenshot=${fullPng}`,
    `http://localhost:${PORT}/`,
  ])

  // 裁切交給 Python + Pillow —— Node 沒有內建的影像處理。
  const script = `
import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB')
S = ${SCALE}
PAGE_BG = (216, 213, 208)
frames = ${JSON.stringify(FRAMES.map((f) => [f.file, f.x, f.y, f.w, f.h]))}

def frame_top(x, y, w, limit=90):
    cx = (x + w // 2) * S
    for dy in range(limit * S):
        px = im.getpixel((cx, y * S + dy))
        if max(abs(px[i] - PAGE_BG[i]) for i in range(3)) > 6:
            return dy / S
    return 0

for name, x, y, w, h in frames:
    top = y + frame_top(x, y, w)
    im.crop((int(x*S), int(top*S), int((x+w)*S), int((top+h)*S))).save(
        sys.argv[2] + '/' + name, optimize=True)
    print(name)
`
  await run('python3', ['-c', script, fullPng, here])
  console.log(`\n✓ ${FRAMES.length} 張截圖已更新於 docs/design/`)
} finally {
  server.close()
  await rm(workdir, { recursive: true, force: true })
}
