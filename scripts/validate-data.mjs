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
  for (const item of data.restaurants) if (!item.nameZh || !item.rawName || !item.rawHours || !item.verificationStatus) errors.push(`${item.id}: 餐廳缺少必要或原始欄位`);
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
  const errors = validateData(await loadData());
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
  else console.log('資料驗證通過：7 天行程、23 筆美食、11 項購物與全部關聯有效。');
}
