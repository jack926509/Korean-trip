import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const files = {
  trip: 'trip.json', days: 'days.json', attractions: 'attractions.json',
  restaurants: 'restaurants.json', stores: 'stores.json', shoppingItems: 'shopping-items.json',
  transport: 'transport.json', stays: 'stays.json', notices: 'notices.json', travelUpdates: 'travel-updates.json', sources: 'sources.json'
};

export async function loadData(baseDir = rootDir) {
  const entries = await Promise.all(Object.entries(files).map(async ([key, file]) => [key, JSON.parse(await readFile(join(baseDir, 'data', file), 'utf8'))]));
  return Object.fromEntries(entries);
}

export function validateData(data) {
  const errors = [];
  const collections = ['days', 'attractions', 'restaurants', 'stores', 'shoppingItems', 'transport', 'stays', 'notices', 'travelUpdates', 'sources'];
  const idSets = Object.fromEntries(collections.map((name) => [name, new Set()]));
  for (const name of collections) for (const item of data[name]) {
    if (!item.id) errors.push(`${name}: 缺少 id`);
    else if (idSets[name].has(item.id)) errors.push(`${name}: 重複 id ${item.id}`);
    else idSets[name].add(item.id);
  }
  const sourceIds = idSets.sources;
  for (const name of collections.filter((name) => !['sources', 'travelUpdates'].includes(name))) for (const item of data[name]) {
    if (!item.sourceRefs?.length) errors.push(`${name}/${item.id}: 缺少 sourceRefs`);
    for (const ref of item.sourceRefs || []) if (!sourceIds.has(ref)) errors.push(`${name}/${item.id}: 找不到來源 ${ref}`);
  }
  const eventIds = new Set();
  const places = new Set([...idSets.attractions, ...idSets.restaurants, ...idSets.stores]);
  for (const day of data.days) {
    const parsedDate = new Date(`${day.date}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day.date) || Number.isNaN(parsedDate.valueOf()) || parsedDate.toISOString().slice(0,10)!==day.date) errors.push(`${day.id}: 日期無效 ${day.date}`);
    if (!day.title || !day.events?.length) errors.push(`${day.id}: 缺少標題或活動`);
    if (day.stayId && !idSets.stays.has(day.stayId)) errors.push(`${day.id}: 找不到住宿 ${day.stayId}`);
    for (const event of day.events) {
      if (!event.id || !event.title || !event.type || !event.status) errors.push(`${day.id}: 活動缺少必要欄位`);
      if (eventIds.has(event.id)) errors.push(`${day.id}: 重複活動 id ${event.id}`); else eventIds.add(event.id);
      if (event.placeId && !places.has(event.placeId)) errors.push(`${day.id}/${event.id}: 找不到地點 ${event.placeId}`);
      if (event.transportId && !idSets.transport.has(event.transportId)) errors.push(`${day.id}/${event.id}: 找不到交通 ${event.transportId}`);
    }
  }
  // 餐廳分兩種來源：行程表整理的必須保留原始營業時間，截圖整理的可以沒有時間資料。
  const recordTypes = new Set(['行程表', '截圖']);
  const directions = new Set(['東', '西', '南', '北', '中']);
  for (const item of data.restaurants) {
    if (!item.nameZh || !item.rawName || !item.verificationStatus) errors.push(`${item.id}: 餐廳缺少必要或原始欄位`);
    if (!recordTypes.has(item.recordType)) errors.push(`${item.id}: recordType 必須是行程表或截圖`);
    if (item.recordType === '行程表' && !item.rawHours) errors.push(`${item.id}: 行程表餐廳必須保留原始營業時間`);
    if (item.recordType === '截圖' && !item.image) errors.push(`${item.id}: 截圖餐廳必須保留原圖檔名`);
    if (item.direction !== null && !directions.has(item.direction)) errors.push(`${item.id}: direction 只能是東西南北中或 null`);
    if (!Array.isArray(item.publicNotes)) errors.push(`${item.id}: publicNotes 必須是陣列`);
  }

  // 公開頁面顯示的文案一律來自資料檔，缺欄位就不該建置出去。
  for (const day of data.days) for (const event of day.events) {
    if (typeof event.publicNote !== 'string' || !event.publicNote) errors.push(`${day.id}/${event.id}: 缺少 publicNote`);
  }
  for (const stay of data.stays) if (!stay.publicNote) errors.push(`${stay.id}: 缺少 publicNote`);
  for (const store of data.stores) if (!store.publicNote) errors.push(`${store.id}: 缺少 publicNote`);
  for (const notice of data.notices) if (!notice.publicTitle || !notice.publicContent) errors.push(`${notice.id}: 缺少公開標題或內容`);
  for (const item of data.travelUpdates) {
    if (!item.title || !item.summary || !item.status || !item.checkedAt || !item.links?.length) errors.push(`${item.id}: 旅遊摘要缺少必要欄位`);
    for (const link of item.links || []) if (!/^https:\/\//.test(link.url)) errors.push(`${item.id}: 官方旅遊資訊必須使用 HTTPS`);
  }
  for (const source of data.sources.filter((item) => item.sheet === '吃吃喝喝' && item.range !== 'A1:Z80')) {
    if (!source.parentSourceRef || !source.recordRef || !source.rawSummary) errors.push(`${source.id}: 餐廳來源缺少父來源、原始記錄關聯或摘要`);
    if (!idSets.restaurants.has(source.recordRef)) errors.push(`${source.id}: 找不到原始餐廳記錄 ${source.recordRef}`);
  }
  for (const item of data.shoppingItems) for (const storeId of item.candidateStoreIds || []) if (!idSets.stores.has(storeId)) errors.push(`${item.id}: 找不到商店 ${storeId}`);
  return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const data = await loadData();
  const errors = validateData(data);
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
  else console.log(`資料驗證通過：${data.days.length} 天行程、${data.restaurants.length} 筆美食、${data.shoppingItems.length} 項購物與全部關聯有效。`);
}
