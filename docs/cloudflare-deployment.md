# Cloudflare Pages 部署計畫

狀態：已部署，正式站瀏覽器驗收通過
自訂網域：[https://korean.xiehnet.com](https://korean.xiehnet.com)

## 部署設定

- Cloudflare Pages 專案：`korean-trip`
- 來源儲存庫：`jack926509/Korean-trip`
- 正式分支：`main`
- 框架：None
- 建置指令：`npm run check`
- 輸出目錄：`dist`
- 觸發方式：每次推送 `main` 後自動驗收與部署

## 完成條件

部署只有在以下項目全部有實際證據時才標記完成：

1. Cloudflare Pages 的正式環境建置成功，建置記錄顯示 `npm run check` 通過。
2. `https://korean.xiehnet.com` 可透過 HTTPS 開啟，TLS 憑證有效且沒有憑證警告。
3. 首頁、行程、景點、美食、購物及實用資訊六頁皆回應成功並正確渲染。
4. 375 px 手機寬度可使用底部導覽、日期切換、分類篩選、清除篩選及餐廳深連結，且沒有水平溢出或阻礙操作的瀏覽器錯誤。
5. Cloudflare 正式部署所顯示的 Git commit SHA 與 GitHub `main` 最新 SHA 一致。

## 驗收記錄

首次雲端部署與自訂網域已完成：

- 正式部署 Git SHA：`f9b347f`
- Cloudflare Pages 部署 ID：`fbd9b53e-44f5-4b0e-bc26-3259e3448dcd`
- Git 整合：成功，來源為 GitHub `main`
- DNS：已建立 `korean` CNAME，目標為 `korean-trip.pages.dev`
- HTTPS：`curl https://korean.xiehnet.com` 已取得 TLS 連線與 HTTP/2 200

Astra 已完成正式網址六頁在 375 px 與 1440 px 的瀏覽器驗收；分類與清除、日期切換及餐廳深連結正常，沒有整頁水平溢出或瀏覽器錯誤。Cloudflare 管理介面顯示網域「使用中」與「SSL 已啟用」。詳細紀錄見 cloudflare-acceptance.md。
