# 最新旅遊摘要與公開來源清理：獨立驗收

日期：2026-09-19（Asia/Taipei）
比較基準：`b285d9b`；Sol 實作，Astra 獨立驗收。
本機結論：通過，沒有未解的阻擋問題。正式網站驗收待本次推送及部署完成後補記。

## 自動驗收與資料完整性

Astra 獨立執行 `npm run check`：退出碼 0，資料驗證通過、9/9 tests PASS、6 頁 build 成功。

逐位元比較 `days.json`、`restaurants.json`、`sources.json`、`stays.json`、`stores.json`、`transport.json`，均與基準提交相同。17 筆餐廳、7 天既有行程、原始欄位與來源資料未刪除或更動。新摘要採獨立 `travel-updates.json`，沒有把候選景點或餐點加入原行程。

掃描六頁產生 HTML，沒有 Google Sheets URL／試算表 ID、「吃吃喝喝」、「原表」、「資訊表」、「儲存格」、`sourceRefs`、內部 `src-food` 或餐廳來源欄位。原始資料保留於專案內，建置器不把來源 JSON 複製至網站產物。住宿、營業及重複麵包店安排的公開文字已改為旅客可讀提醒，未把待確認事項變成確定事實。

## 真實 Chrome 驗收

以 Google Chrome + Playwright，在本機 375 px 與 1440 px 各載入首頁、行程、景點、美食、購物、實用資訊，共 12 組，全部正常渲染且無水平溢出。瀏覽器 console／JavaScript 錯誤為 0。

- 三分類頁沒有文字搜尋欄；古蹟、新堂站、超市篩選分別為 1、2、1 筆，清除後恢復 3、17、7 筆。
- 日期 query 與頁籤切換正常；`food-015`、`food-002` 深連結仍正確。
- 首頁「查看旅遊摘要」實點到達 `/info/#travel-updates`。
- 實用資訊有秋夕、首爾、全州、大田 4 張摘要卡與 7 個可區別的官方旅遊連結。所有連結使用 HTTPS，網域為韓國觀光公社或首爾官方旅遊網站。
- 每卡可見 2026/9/19 更新日期及韓國當地時間／日期說明；新增建議明示候選尚未排入，營業及入場限制仍保留待確認提示。
- 已實看手機單欄、桌面雙欄摘要截圖，文字與連結可讀，沒有卡片水平溢出。

## 證據與範圍

腳本 `/tmp/korean-travel-summary.cjs`；摘要截圖 `/tmp/korean-travel-updates-375.png`、`/tmp/korean-travel-updates-1440.png`。大型截圖不提交。

摘要內容與既有 `docs/2026-travel-research.md` 核對一致；本次驗收確認公開呈現、候選語意與來源隱藏，不重做所有店家、交通及景點官方查證，也不把既有餐廳營業資訊宣稱為已確認。
