import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildSite } from '../scripts/build.mjs';

test('建置器產生六頁與共用資產', async () => {
  const outputDir = await mkdtemp(join(tmpdir(), 'korean-trip-'));
  await buildSite({ outputDir });
  for (const page of ['index.html', 'itinerary/index.html', 'attractions/index.html', 'food/index.html', 'shopping/index.html', 'info/index.html']) {
    const html = await readFile(join(outputDir, page), 'utf8');
    assert.match(html, /lang="zh-Hant"/);
    assert.match(html, /韓遊帖/);
  }
  await readFile(join(outputDir, 'assets/styles.css'), 'utf8');
  await readFile(join(outputDir, 'assets/app.js'), 'utf8');
});

test('輸出完整的行程、餐廳與購物空狀態', async () => {
  const outputDir = await mkdtemp(join(tmpdir(), 'korean-trip-'));
  await buildSite({ outputDir });
  const itinerary = await readFile(join(outputDir, 'itinerary/index.html'), 'utf8');
  const attractions = await readFile(join(outputDir, 'attractions/index.html'), 'utf8');
  const food = await readFile(join(outputDir, 'food/index.html'), 'utf8');
  const shopping = await readFile(join(outputDir, 'shopping/index.html'), 'utf8');
  assert.equal((itinerary.match(/data-day-tab/g) || []).length, 7);
  assert.ok((food.match(/data-card="food"/g) || []).length >= 17);
  assert.match(shopping, /購物清單待補/);
  assert.doesNotMatch(shopping, /示範商品/);
  for (const html of [itinerary, attractions, food, shopping]) {
    assert.doesNotMatch(html, /data-search(?:-text)?=/);
    assert.doesNotMatch(html, /type="search"/);
  }
});
