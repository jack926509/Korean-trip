# 韓遊帖｜2026 韓國旅遊手冊

這是一份以手機使用為主的首爾、全州、大田七日旅遊網站。首頁快速掌握日期、航班、住宿及重要提醒；其餘分頁可查每日行程、景點、17 筆餐廳、商店與實用資訊。

目前所有行程都屬暫定。餐廳營業、價格、休假、地址與交通班次尚未逐項向官方查證，網站會顯示「待確認」，不會把原始筆記當成已確認資訊。購物商品清單目前為空，等使用者提供後再加入。

## 本機預覽

電腦需安裝 Node.js 20 以上版本，不需安裝任何套件。

```bash
npm run check
python3 -m http.server 4173 -d dist
```

瀏覽器開啟 [http://localhost:4173](http://localhost:4173)。修改資料後需重新執行 `npm run build`，再重新整理瀏覽器。

## 更新資料

- 每日行程：編輯 `data/days.json`。
- 餐廳：編輯 `data/restaurants.json`，來源快照同步更新 `data/sources.json`。
- 景點與商店：編輯 `data/attractions.json`、`data/stores.json`。
- 購物商品：在 `data/shopping-items.json` 加入資料；目前為空，收到商品即可新增。
- 航班、鐵路、住宿與提醒：編輯 `data/transport.json`、`data/stays.json`、`data/notices.json`。

識別碼是資料關聯用的固定名稱，例如 `food-015`。更新店名時不要更換識別碼，也不要直接修改 `dist/`；`dist/` 由建置指令重新產生。

每次更新後執行：

```bash
npm run check
```

這會依序檢查資料日期、必要欄位、重複識別碼、跨檔關聯、頁面內容與搜尋邏輯，最後重新產生六個頁面。

## 專案結構

```text
data/       旅程、每日行程與分類資料
src/        共用樣式與瀏覽器互動
scripts/    資料驗證與靜態網站建置
tests/      Node.js 自動測試
dist/       自動產生的可發布網站
docs/       規劃、盤點與審查文件
```

GitHub 儲存庫為 [jack926509/Korean-trip](https://github.com/jack926509/Korean-trip)。本專案沒有自動部署流程；GitHub Actions 只執行資料、測試與建置檢查。
