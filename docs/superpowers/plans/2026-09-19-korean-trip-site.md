# 韓國旅遊手冊網站 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立可在手機快速查閱 7 天行程，並能搜尋景點、美食、購物與實用資訊的六頁靜態網站。

**Architecture:** 旅遊內容存於 `data/*.json`，`scripts/build.mjs` 讀取資料並用共用版型產生 `dist/` 六頁。瀏覽器端 `src/app.js` 只負責日期切換、搜尋、篩選與展開細節；資料驗證集中在 `scripts/validate-data.mjs`，避免頁面自行猜測或補資料。

**Tech Stack:** Node.js 20+、原生 ES modules、HTML5、CSS、原生 JavaScript、Node test runner。

**Spec:** `PLAN.md`

## Global Constraints

- 全站繁體中文，行程採韓國當地日期與時間，更新時間採 Asia/Taipei。
- 未查證的店址、營業、假期、分店與交通資訊必須明示「待確認」。
- 17 筆餐廳與兩筆山清烤肉須完整保留；無垢屋、新村豆腐鍋與行程建立關聯。
- 購物商品初始為空陣列，頁面顯示待補狀態，不建立示範商品。
- 不使用帳號、後端、外部套件或需金鑰的服務。
- 手機 375 px 無水平溢出，互動元件可用鍵盤操作並尊重減少動態效果設定。

---

### Task 1: 建置契約與資料驗證

**Files:**
- Create: `package.json`
- Create: `CLAUDE.md`
- Create: `scripts/validate-data.mjs`
- Create: `tests/data.test.mjs`

**Interfaces:**
- Consumes: `data/*.json`
- Produces: `npm test` 與 `npm run validate`，檢查日期、識別碼、來源及跨檔關聯。

- [ ] **Step 1: Write the failing test** — 先寫入 7 天、17 間餐廳、空商品、跨檔關聯及未知欄位規則。
- [ ] **Step 2: Run test to verify it fails** — 執行 `node --test tests/data.test.mjs`，預期因資料檔尚未建立而失敗。
- [ ] **Step 3: Write minimal implementation** — 建立 JSON 資料與驗證器，錯誤時列出精確檔案和識別碼。
- [ ] **Step 4: Run test to verify it passes** — 執行 `npm test`，預期全部通過。

### Task 2: 共用建置器與六頁輸出

**Files:**
- Create: `scripts/build.mjs`
- Create: `tests/build.test.mjs`
- Create: `src/styles.css`
- Create: `src/app.js`

**Interfaces:**
- Consumes: 已驗證的 JSON 資料。
- Produces: `buildSite({ rootDir, outputDir })` 與 `dist/index.html`、`dist/itinerary/index.html`、`dist/attractions/index.html`、`dist/food/index.html`、`dist/shopping/index.html`、`dist/info/index.html`。

- [ ] **Step 1: Write the failing test** — 斷言六頁、共用資產、頁面標題、17 張餐廳卡、7 個日期入口與購物空狀態。
- [ ] **Step 2: Run test to verify it fails** — 執行 `node --test tests/build.test.mjs`，預期因建置器缺少而失敗。
- [ ] **Step 3: Write minimal implementation** — 實作 HTML escape、共用 header/footer/nav、各頁 renderer 與相對資產路徑。
- [ ] **Step 4: Run test to verify it passes** — 執行 `npm run build && npm test`，預期六頁完整產生。

### Task 3: 韓國旅行手冊視覺與互動

**Files:**
- Modify: `src/styles.css`
- Modify: `src/app.js`
- Create: `tests/client.test.mjs`

**Interfaces:**
- Consumes: `data-filter-*`、`data-search-text`、`data-day-panel`、`details` 等 HTML hooks。
- Produces: `filterCards`、`activateDay`、`clearFilters`，以及手機底部導覽、無結果提示和可展開內容。

- [ ] **Step 1: Write the failing test** — 測試中韓文正規化搜尋、多條件篩選、日期切換與清除條件。
- [ ] **Step 2: Run test to verify it fails** — 執行 `node --test tests/client.test.mjs`，預期因函式未建立而失敗。
- [ ] **Step 3: Write minimal implementation** — 完成無框架互動，更新 `hidden`、`aria-selected` 和結果數。
- [ ] **Step 4: Run test to verify it passes** — 執行 `npm test`，預期互動邏輯全部通過。

### Task 4: 文件、品質檢查與交叉驗收交接

**Files:**
- Create: `README.md`
- Create: `.gitignore`
- Create: `docs/review-handoff.md`
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: 最終程式與驗收結果。
- Produces: 冷啟動開發說明、GitHub Pages 靜態輸出說明與 Astra 審查包。

- [ ] **Step 1: Run full verification** — 執行 `npm run check`，預期資料驗證、測試與建置全部成功。
- [ ] **Step 2: Run local smoke check** — 啟動 `python3 -m http.server 4173 -d dist`，逐頁要求 HTTP 200 並確認無外部資產依賴。
- [ ] **Step 3: Inspect responsive output** — 使用瀏覽器檢查 375 px 與桌面版，不得有水平溢出、遮擋或無作用按鈕。
- [ ] **Step 4: Write handoff** — 記錄改動檔案、驗收條件、實跑證據與資料不確定性，交由 Astra 獨立審查。
