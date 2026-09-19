import test from 'node:test';
import assert from 'node:assert/strict';
import { loadData, validateData } from '../scripts/validate-data.mjs';

test('正式資料包含完整 7 天與 17 筆餐廳', async () => {
  const data = await loadData();
  assert.equal(data.days.length, 7);
  assert.deepEqual(data.days.map((day) => day.date), [
    '2026-09-24', '2026-09-25', '2026-09-26', '2026-09-27',
    '2026-09-28', '2026-09-29', '2026-09-30'
  ]);
  assert.ok(data.restaurants.length >= 17);
  assert.equal(data.restaurants.filter((item) => item.nameKo === '산청숯불가든 을지로').length, 2);
});

test('購物商品是可擴充陣列且關聯識別碼都有效', async () => {
  const data = await loadData();
  assert.ok(Array.isArray(data.shoppingItems));
  assert.deepEqual(validateData(data), []);
  const linkedFood = data.days.flatMap((day) => day.events).filter((event) => event.placeId?.startsWith('food-'));
  assert.deepEqual(linkedFood.map((event) => event.placeId).sort(), ['food-002', 'food-015']);
});

test('每筆餐廳保留來源原文與未查證狀態', async () => {
  const { restaurants } = await loadData();
  for (const item of restaurants) {
    assert.match(item.id, /^food-\d{3}$/);
    assert.ok(item.rawName);
    assert.ok(item.rawHours);
    assert.ok(item.sourceRefs.length > 0);
    assert.equal(item.verificationStatus, '待確認');
  }
  assert.match(restaurants.find((item) => item.id === 'food-011').rawHours, /11:300/);
});

test('不存在的日曆日期會被拒絕', async () => {
  const data = await loadData();
  data.days[0].date = '2026-02-31';
  assert.match(validateData(data).join('\n'), /日期無效/);
});
