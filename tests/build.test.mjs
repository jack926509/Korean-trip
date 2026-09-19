import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildSite } from '../scripts/build.mjs';
import { createHash } from 'node:crypto';

test('建置器產生六頁與共用資產', async () => {
  const outputDir = await mkdtemp(join(tmpdir(), 'korean-trip-'));
  await buildSite({ outputDir });
  const css = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');
  const stylesFile = `styles.${createHash('sha256').update(css).digest('hex').slice(0,12)}.css`;
  assert.equal(await readFile(join(outputDir, 'assets', stylesFile), 'utf8'), css);
  for (const page of ['index.html', 'itinerary/index.html', 'attractions/index.html', 'food/index.html', 'shopping/index.html', 'info/index.html']) {
    const html = await readFile(join(outputDir, page), 'utf8');
    assert.match(html, /lang="zh-Hant"/);
    assert.match(html, /韓遊帖/);
    assert.ok(html.includes(`assets/${stylesFile}`), `${page} 必須引用符合 CSS 內容的版本檔名`);
    assert.doesNotMatch(html, /href="[^\"]*assets\/styles\.css"/);
  }
  await readFile(join(outputDir, 'assets/styles.css'), 'utf8');
  await readFile(join(outputDir, 'assets/app.js'), 'utf8');
});

test('輸出完整的行程、餐廳與購物商品', async () => {
  const outputDir = await mkdtemp(join(tmpdir(), 'korean-trip-'));
  await buildSite({ outputDir });
  const itinerary = await readFile(join(outputDir, 'itinerary/index.html'), 'utf8');
  const attractions = await readFile(join(outputDir, 'attractions/index.html'), 'utf8');
  const food = await readFile(join(outputDir, 'food/index.html'), 'utf8');
  const shopping = await readFile(join(outputDir, 'shopping/index.html'), 'utf8');
  assert.equal((itinerary.match(/data-day-tab/g) || []).length, 7);
  assert.equal((food.match(/id="food-\d{3}"/g) || []).length, 23);
  assert.equal((food.match(/參考截圖/g) || []).length, 6);
  assert.doesNotMatch(food, /<span class="status">(?:待確認|截圖整理)<\/span>/);
  assert.equal((shopping.match(/class="catalog-card product-card"/g) || []).length, 11);
  assert.equal((shopping.match(/參考截圖/g) || []).length, 11);
  assert.doesNotMatch(shopping, /購物清單待補|之後會加入商品/);
  assert.match(food, /<h2>餐廳<\/h2>[\s\S]*<h2>美食清單<\/h2>/);
  const foodList = food.match(/<h2>美食清單<\/h2>[\s\S]*?<\/section>/)?.[0];
  assert.ok(foodList);
  assert.doesNotMatch(foodList, /確認狀態：|待確認/);
  for (const html of [itinerary, attractions, food, shopping]) {
    assert.doesNotMatch(html, /data-search(?:-text)?=/);
    assert.doesNotMatch(html, /type="search"/);
  }
  for (const html of [attractions, food, shopping]) {
    assert.doesNotMatch(html, /data-filter|data-clear|data-empty|data-result-count|data-card/);
    assert.doesNotMatch(html, /<select|清除篩選|沒有符合條件/);
  }
});

test('公開頁面不顯示試算表與內部整理痕跡', async () => {
  const outputDir = await mkdtemp(join(tmpdir(), 'korean-trip-'));
  await buildSite({ outputDir });
  const pages = ['index.html', 'itinerary/index.html', 'attractions/index.html', 'food/index.html', 'shopping/index.html', 'info/index.html'];
  const html = (await Promise.all(pages.map((page) => readFile(join(outputDir, page), 'utf8')))).join('\n');
  for (const hiddenText of ['docs.google.com/spreadsheets', '1IeNFIwueskbvd44iwC_IqpoAlSKPt8t0LOU51V3mfmk', '吃吃喝喝', '原始試算表', '資料來源', '原表出處']) {
    assert.doesNotMatch(html, new RegExp(hiddenText));
  }
});

test('首頁與資訊頁呈現最新旅遊摘要', async () => {
  const outputDir = await mkdtemp(join(tmpdir(), 'korean-trip-'));
  await buildSite({ outputDir });
  const home = await readFile(join(outputDir, 'index.html'), 'utf8');
  const info = await readFile(join(outputDir, 'info/index.html'), 'utf8');
  assert.match(home, /最新旅遊摘要/);
  assert.match(home, /info\/#travel-updates/);
  assert.equal((info.match(/data-travel-update/g) || []).length, 4);
  assert.match(info, /9\/24–9\/26/);
  assert.match(info, /09:00–18:00/);
  assert.match(info, /候選，尚未排入/);
  assert.equal((info.match(/class="official-link"/g) || []).length, 7);
});
