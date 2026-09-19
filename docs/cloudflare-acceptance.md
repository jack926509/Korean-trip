# Cloudflare 正式網站獨立驗收

時間：2026-09-19 21:26–21:29（Asia/Taipei）
正式網址：[https://korean.xiehnet.com](https://korean.xiehnet.com)
驗收者：Astra；本輪未修改應用程式碼。
應用版本：`f9b347f279782094ebb86f1feb4720af62a845a0`。後續部署文件提交不改應用內容，遠端最新 SHA 與部署狀態由主代理另行核對。

## 結果

通過。使用本機正式 Google Chrome 與 Playwright，直接連正式 HTTPS 網域，沒有略過 TLS 驗證。

| 頁面 | 375 px | 1440 px |
| --- | --- | --- |
| 首頁 | 通過 | 通過 |
| 每日行程 | 通過 | 通過 |
| 景點 | 通過 | 通過 |
| 美食 | 通過 | 通過 |
| 購物 | 通過 | 通過 |
| 實用資訊 | 通過 | 通過 |

12 組頁面均正常渲染，沒有整頁水平溢出；瀏覽器 console 與 JavaScript 頁面錯誤共 0。

景點、美食、購物均無文字搜尋輸入或 `data-search`。實際選取古蹟、新堂站、超市後，分別顯示 1、2、1 筆；清除後恢復 3、17、7 筆。日期 `?day=day-02` 正確，頁籤可切至第 3 天；無垢屋 `food-015` 與新村豆腐鍋 `food-002` 深連結皆能開啟指定卡片。手機、桌面各實跑一遍，並查看正式網站截圖。

## 上線內容核對

以 Chrome 讀取六頁 HTML 及 `assets/app.js`、`assets/styles.css`，均回應 HTTP 200。兩份共用資產逐位元符合已驗收的本機 `dist/`；六頁 HTML 唯一差異為 Cloudflare 自動插入的 analytics beacon，排除該段後全部與本機建置一致。

本輪 Python urllib 客戶端曾收到 HTTP 403，因此內容核對改採可正常存取的真實 Chrome；不以該客戶端失敗判定網站故障。

主代理另以 Cloudflare 管理介面確認自訂網域「使用中」、SSL「已啟用」。此為主代理提供的管理介面證據，獨立驗收者確認的範圍為正式網址的 TLS、頁面內容、渲染與互動。

## 證據

- `/tmp/korean-cloudflare.cjs`：六頁、兩尺寸與核心互動腳本。
- `/tmp/korean-live-parity.cjs`：正式內容與本機建置比對腳本。
- `/tmp/korean-cloudflare-375-{attractions,food,shopping}.png`。
- `/tmp/korean-cloudflare-1440-{attractions,food,shopping}.png`。

沒有未解的阻擋問題。大型截圖與下載頁面不提交。此紀錄只證明正式部署可用，不代表餐廳、交通及其他旅遊筆記已向官方查證；資料不確定性維持既有標示。
