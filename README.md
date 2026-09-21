# 韓遊帖｜2026 韓國旅遊手冊

這是一份以手機使用為主的首爾、全州、大田七日旅遊網站。首頁快速掌握日期、航班、住宿及重要提醒；其餘分頁可查每日行程、景點、17 筆餐廳、商店與實用資訊。

目前所有行程都屬暫定。餐廳營業、價格、休假、地址與交通班次尚未逐項向官方查證，網站會顯示「待確認」，不會把原始筆記當成已確認資訊。另依使用者提供的截圖加入 6 筆美食與 11 項購物，並保留原圖供現場辨識。

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
- 購物商品：在 `data/shopping-items.json` 維護；截圖原圖放在 `美食與購物清單/`，建置時複製至公開圖片目錄。
- 航班、鐵路、住宿與提醒：編輯 `data/transport.json`、`data/stays.json`、`data/notices.json`。
- 最新旅遊摘要：編輯 `data/travel-updates.json`，只加入已重新查閱的官方旅遊資訊；候選內容不可直接改成已排入行程。

### 公開文案欄位

網站顯示的文字一律來自資料檔，建置腳本不再依識別碼寫死內容。要改網站上的某句話，就改對應欄位：

| 欄位 | 位置 | 用途 |
| --- | --- | --- |
| `publicNote` | days 的 event、stays、stores | 卡片與時間軸上顯示的說明；`note` 保留原始整理記錄 |
| `publicTitle`、`publicContent` | notices | 提醒的公開標題與內容；`title`、`content` 保留原始記錄 |
| `publicNotes` | restaurants | 卡片展開區的注意事項；`notes` 保留原始筆記與推薦出處 |

原始欄位只供更新比對，不會輸出到公開頁面；推薦出處、navermap 與 catchtable 等整理痕跡留在 `notes` 即可。

### 餐廳欄位

| 欄位 | 說明 |
| --- | --- |
| `recordType` | `行程表`（原試算表整理，必須保留 `rawHours`）或 `截圖`（依截圖收錄，必須有 `image`） |
| `direction` | 原清單的東西南北中分組，只存單一個字，未分組用 `null`；美食頁依此分區排列 |
| `directionNote` | 方位是沿用原清單上一列推得時的說明，否則 `null` |

購物商品的購買線索欄位為 `purchaseHint`（例如「貼文提及 Daiso」），不再借用 `area`。

識別碼是資料關聯用的固定名稱，例如 `food-015`。更新店名時不要更換識別碼，也不要直接修改 `dist/`；`dist/` 由建置指令重新產生。

網站公開頁面不顯示內部試算表連結、分頁、儲存格或整理用的推薦出處。內部 `data/sources.json` 與 raw 欄位仍保留，僅供更新比對與資料追溯。

每次更新後執行：

```bash
npm run check
```

這會依序檢查資料日期、必要欄位、重複識別碼、跨檔關聯、頁面內容與日期切換邏輯，最後重新產生六個頁面。

## 專案結構

```text
data/       旅程、每日行程與分類資料
src/        共用樣式與瀏覽器互動
scripts/    資料驗證與靜態網站建置
tests/      Node.js 自動測試
dist/       自動產生的可發布網站
docs/       規劃、盤點與審查文件
```

GitHub 儲存庫為 [jack926509/Korean-trip](https://github.com/jack926509/Korean-trip)。Cloudflare Pages 專案 `korean-trip` 已連接此儲存庫的 `main` 分支；每次推送至 `main` 會自動執行 `npm run check`，成功後發布 `dist/`。

正式網站網址為 [https://korean.xiehnet.com](https://korean.xiehnet.com)，目前狀態為「已部署，正式站瀏覽器驗收通過」。首次部署、HTTPS、六頁及手機互動已由 Astra 驗收通過。驗收條件與實證見 [Cloudflare 部署計畫](docs/cloudflare-deployment.md)。
