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

test('原有餐廳保留來源原文與未查證狀態', async () => {
  const { restaurants } = await loadData();
  for (const item of restaurants.filter((entry) => !entry.image)) {
    assert.match(item.id, /^food-\d{3}$/);
    assert.ok(item.rawName);
    assert.ok(item.rawHours);
    assert.ok(item.sourceRefs.length > 0);
    assert.equal(item.verificationStatus, '待確認');
  }
  assert.match(restaurants.find((item) => item.id === 'food-011').rawHours, /11:300/);
});

test('截圖清單新增 6 筆美食與 11 項購物，且圖片來源完整', async () => {
  const data = await loadData();
  const screenshotFood = data.restaurants.filter((item) => item.image);
  assert.equal(screenshotFood.length, 6);
  assert.equal(data.shoppingItems.length, 11);
  assert.equal(new Set([...screenshotFood, ...data.shoppingItems].map((item) => item.image)).size, 16);
  assert.equal(data.shoppingItems.filter((item) => item.image === 'IMG_6411.PNG').length, 2);
  assert.equal(screenshotFood.find((item) => item.id === 'food-022').recommendedDishes[0], '優格系列');
  for (const item of [...screenshotFood, ...data.shoppingItems]) {
    assert.ok(item.image);
    assert.ok(item.sourceRefs.length > 0);
    assert.doesNotMatch(JSON.stringify(item), /pending|待確認/);
  }
});

test('不存在的日曆日期會被拒絕', async () => {
  const data = await loadData();
  data.days[0].date = '2026-02-31';
  assert.match(validateData(data).join('\n'), /日期無效/);
});

test('餐廳的來源類型、方位與公開備註都有明確欄位', async () => {
  const { restaurants } = await loadData();
  assert.equal(restaurants.filter((item) => item.recordType === '行程表').length, 17);
  assert.equal(restaurants.filter((item) => item.recordType === '截圖').length, 6);
  for (const item of restaurants) {
    assert.ok(['行程表', '截圖'].includes(item.recordType));
    assert.ok(item.direction === null || ['東', '西', '南', '北', '中'].includes(item.direction), `${item.id} 方位需為單一字或 null`);
    assert.ok(Array.isArray(item.publicNotes));
    assert.equal(item.recordType === '截圖', Boolean(item.image));
  }
  // 沿用上一列分組的店家要說明，不能看起來像原清單直接標示的方位。
  assert.equal(restaurants.find((item) => item.id === 'food-002').directionNote, '方位沿用原清單上一列的分組。');
  assert.equal(restaurants.find((item) => item.id === 'food-001').directionNote, null);
});

test('公開文案存在資料檔，且不外流整理用的推薦出處', async () => {
  const data = await loadData();
  for (const day of data.days) for (const event of day.events) assert.ok(event.publicNote, `${event.id} 缺少 publicNote`);
  for (const stay of data.stays) assert.ok(stay.publicNote);
  for (const store of data.stores) assert.ok(store.publicNote);
  for (const notice of data.notices) assert.ok(notice.publicTitle && notice.publicContent);
  const publicText = JSON.stringify([
    data.days.flatMap((day) => day.events.map((event) => event.publicNote)),
    data.restaurants.map((item) => item.publicNotes),
    data.stays.map((item) => item.publicNote),
    data.stores.map((item) => item.publicNote),
    data.notices.map((item) => [item.publicTitle, item.publicContent])
  ]);
  assert.doesNotMatch(publicText, /navermap|catchtable|安普賢推薦|尹男老推薦/);
});

test('購物商品的購買線索使用能說明內容的欄位名', async () => {
  const { shoppingItems } = await loadData();
  for (const item of shoppingItems) {
    assert.ok(!('area' in item), `${item.id} 不應該再用 area 存購買線索`);
    assert.ok(item.purchaseHint === null || typeof item.purchaseHint === 'string');
  }
  assert.equal(shoppingItems.find((item) => item.id === 'item-ottogi-dakhanmari').purchaseHint, '貼文提及樂天超市');
});
