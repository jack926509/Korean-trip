# 移除文字搜尋：獨立驗收

日期：2026-09-19（Asia/Taipei）
基準：`cf1f427`；實作 Sol，獨立驗收 Astra。
結論：通過，沒有未解的阻擋問題。此紀錄取代先前驗收文件中「文字搜尋」的功能描述，其餘旅遊資料驗收仍適用。

## 自動檢查

Astra 獨立執行 `npm run check`，退出碼 0：資料驗證通過、7/7 tests PASS、6 頁 build 成功。

對照基準檢查 `scripts/build.mjs`、`src/app.js`、樣式、測試與文件：三分類頁已移除搜尋輸入、`data-search`、`data-search-text` 及文字比對事件；分類下拉、清除按鈕、結果數、日期 query 維持。旅遊 `data/` 沒有本次異動。

## 真實瀏覽器

以本機正式 Google Chrome 與 Playwright 開啟 `http://127.0.0.1:4173/`，375 px、1440 px 各驗三分類頁，共 6 組。

| 頁面 | 搜尋輸入數 | 分類實測 | 清除後筆數 | 手機／桌面 |
| --- | --- | --- | --- | --- |
| 景點 | 0 | 古蹟 1 筆 | 3 | 通過 |
| 美食 | 0 | 新堂站 2 筆 | 17 | 通過 |
| 購物 | 0 | 超市 1 筆 | 7 | 通過 |

全部無水平溢出，console／JavaScript 錯誤為 0。清除後下拉恢復「全部分類」，資料筆數正確；手機兩欄篩選列與桌面畫面已看截圖確認。

兩尺寸均實測 `?day=day-02` 對應正確、日期頁籤可切至第 3 天；無垢屋 `food-015` 與新村豆腐鍋 `food-002` 深連結仍可點擊到達指定卡片。

## 審查修正與證據

審查時提醒的空結果「關鍵字」舊文案已改成分類提示；無搜尋的建置測試已包含景點頁。沒有其他未解 findings。

腳本：`/tmp/korean-search-removal.cjs`。
截圖：`/tmp/korean-no-search-375-{attractions,food,shopping}.png` 與 `/tmp/korean-no-search-1440-{attractions,food,shopping}.png`。大型截圖不提交。

本次只驗收搜尋功能移除及相關回歸，不代表旅遊資訊經官方查證，也不包含公開部署。
