# PWA 圖示

以 `src/icons/pwa-icon-korea-v2.png` 為原稿，使用 macOS sips 縮放產生 192、512、180、32 px PNG。六頁共用 head 引用 manifest、Apple touch icon 及 favicon；建置以二進位方式複製圖示至 `dist/assets/icons/`。

Manifest 設定根目錄啟動與範圍、standalone 顯示、韓遊帖名稱。圖示 purpose 為 any，不宣稱符合 maskable 安全區。此次不新增 service worker 或離線快取。

驗收條件：PNG 實際尺寸符合宣告、六頁相對路徑有效、瀏覽器可載入圖示、資料與原頁面不變。`npm run check` 共 11 個測試通過並成功建置。本機瀏覽器已確認 head 引用正確。實體手機的加入主畫面流程仍須由使用者操作確認。
