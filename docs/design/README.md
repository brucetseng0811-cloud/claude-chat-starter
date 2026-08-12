# 聊天室設計稿

第六章單元 4「用 Figma MCP 將設計稿轉為 React 元件」的素材。

---

## ⚠️ 先講重點：Figma 免費帳號每個月只有 6 次 MCP 呼叫

這不是危言聳聽，是實測結果。Figma 的 Starter（免費）方案對 MCP 的額度是
**每月 6 次 tool call**，而且用完就是用完，要等下個月。

哪些動作會扣額度：

| 動作 | 扣額度嗎 |
|---|---|
| `get_design_context`（讀設計稿內容） | ✅ 扣 |
| `get_screenshot`（截圖） | ✅ 扣 |
| `get_metadata`（讀圖層結構） | ✅ 扣 |
| `get_variable_defs`（讀 variables） | ✅ 扣 |
| `use_figma`（寫入 / 執行腳本） | ✅ 扣 |
| `generate_figma_design`（把網頁擷取進 Figma） | ❌ 不扣 |
| `whoami` | ❌ 不扣 |

**所以請把 6 次當成 3 次用**（留一半當作出錯重來的餘裕）。
單元 4 的講稿會教你怎麼用「一次呼叫抓完整頁」的提示詞，
而不是逐個元件慢慢問 —— 這本身就是 MCP 成本控制的實戰練習。

因為額度這麼緊，這個資料夾提供了**完整的離線素材**。
沒有 Figma 帳號、或額度用完的人，一樣可以完成整個單元。

---

## 兩條路線

### A 軌 — Figma MCP（主線示範）

1. 老師會提供 Figma Community 連結
2. 點「Open in Figma」把檔案複製到你自己的 drafts
3. 從網址列複製你自己那份的 URL（含 `?node-id=...`）
4. 照單元 4 的提示詞操作

複製到自己帳號很重要 —— MCP 讀的是「你有權限的檔案」，
而且改壞了也不會影響別人。

### B 軌 — 離線素材（額度用完 / 不想註冊）

直接用這個資料夾裡的東西，效果一樣：

| 檔案 | 內容 |
|---|---|
| `tokens.json` | 全部設計 token：顏色、字級、間距、圓角 |
| `chat-desktop.png` | 聊天主畫面（1280×800） |
| `chat-streaming.png` | 逐字回應中的狀態 |
| `chat-empty.png` | 空狀態 |
| `chat-dark.png` | 深色模式 |
| `chat-mobile.png` | 手機版（390×844） |
| `components-states.png` | 元件六種狀態一覽 |
| `tokens-color.png` | 色票對照表 |
| `mockup/index.html` | **設計稿的原始檔**，用瀏覽器打開可以量測、檢查元素 |

B 軌其實有個 A 軌沒有的好處：`mockup/index.html` 可以用開發者工具直接檢查，
想知道某個間距是幾 px，右鍵檢查就有了。

---

## 設計稿內容

七個畫板，對應第六章後面幾個單元會做到的畫面：

| # | 畫板 | 用在哪個單元 |
|---|---|---|
| 01 | Chat / Desktop / Light | 單元 4 主要實作目標 |
| 02 | Chat / Streaming | 單元 5（逐字輸出的游標與停止鍵） |
| 03 | Chat / Empty | 單元 4（第一次進站的樣子） |
| 04 | Chat / Desktop / Dark | 單元 4（深色模式 token） |
| 05 | Chat / Mobile | 單元 4（RWD） |
| 06 | Components / States | 單元 4–6（訊息三態、載入、錯誤、輸入框三態） |
| 07 | Tokens / Color | 單元 4（同步 token 進 globals.css） |

---

## 修改設計稿

`mockup/index.html` 是唯一的來源。改完之後：

```bash
# 重新產生全部截圖（用 headless Chrome，不碰 Figma、不扣額度）
node docs/design/capture.mjs
```

需要本機有 Google Chrome 和 Python 3（含 Pillow）。

要同步回 Figma 的話，用 `generate_figma_design`（這個不扣額度）重新擷取一次。

### ⚠️ 改 mockup 時的一個陷阱

**含有 `<code>` 的段落，`<code>` 後面的文字不能長到換行。**

Figma 的網頁擷取引擎沒辦法正確定位「行內元素之後又換行」的文字，
兩段文字會被疊在同一個座標上，變成一團看不懂的東西。

錯誤示範：

```html
<!-- code 後面的文字太長，會換行 → 擷取後重疊 -->
<p>建議把「偏好」抽成獨立的 <code>Memory</code> 資料表，而不是塞在對話紀錄裡。對話會越長越沒用。</p>
```

正確寫法 —— 拆成兩段，含 code 的那段保持短：

```html
<p>建議把「偏好」抽成獨立的 <code>Memory</code> 資料表。</p>
<p>對話紀錄會越長越沒用，但偏好是要跨對話重複使用的。</p>
```

沒有行內元素的段落換行幾行都沒問題，只有這個組合會出事。

---

## token 的三份一致性

同一組值存在三個地方，改任何一邊都要三邊一起改：

```
docs/design/tokens.json          ← 給人看、給 B 軌學員抄
docs/design/mockup/index.html    ← :root 的 CSS 變數，設計稿的來源
apps/web/app/globals.css         ← @theme 區塊，程式碼實際用的
```

用 hex 而不是 oklch，是因為 Figma 內部存 RGB —— 用 hex 三邊才對得起來。
