# CLAUDE.md

- 技術棧：Node.js 20+ 原生 ES modules、靜態 HTML/CSS/JavaScript，零外部 npm 套件。
- 驗收指令：`npm run check`；瀏覽器驗收前執行 `python3 -m http.server 4173 -d dist`。
- 部署方式：目前未部署；使用者已授權將原始碼推送至 `https://github.com/jack926509/Korean-trip.git`。對外網站部署仍需另行授權。
- 特殊規則：來源資料只讀；未知資訊保留 `null` 或 `[]`；不得猜測店址、分店、營業、航班、票券或庫存；不可手動編輯 `dist/`。
- 資料來源：Google Sheets「行程」「吃吃喝喝」「購物清單」「資訊」A1:Z80，讀取日 2026-09-19；完整規則見 `PLAN.md`。
- 分工：Sol 負責本次程式實作與修正；Astra 負責獨立驗收，包含真實瀏覽器 375 px 與桌面檢查。
