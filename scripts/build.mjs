import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { loadData, validateData } from './validate-data.mjs';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

/* ── 輸出處理：一律跳脫外部文字，連結只接受 http/https ────────── */

const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const lines = (value = '') => esc(value).replace(/\n/g, '<br>');
const safeUrl = (value) => {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? esc(url.href) : null;
  } catch {
    return null;
  }
};

/* ── 日期與時間 ─────────────────────────────────────────── */

const dateLabel = (iso) => {
  const date = new Date(`${iso}T12:00:00+09:00`);
  return `${date.getMonth() + 1}/${date.getDate()}（${weekdays[date.getDay()]}）`;
};
const shortDate = (iso) => dateLabel(iso).split('（')[0];
const checkedDateLabel = (iso) => iso.replace(/^(\d{4})-(\d{2})-(\d{2})$/, (_, year, month, day) => `${year}/${Number(month)}/${Number(day)}`);

/** 交通時刻：同一天只寫一次日期，跨日才兩邊都標。沒有時刻就說待補，不推算。 */
function routeTime(transport) {
  const [from, to] = [transport.departAt, transport.arriveAt];
  if (!from && !to) return '時間待補';
  const part = (value) => (value ? { date: value.slice(0, 10), time: value.slice(11, 16) } : null);
  const [a, b] = [part(from), part(to)];
  if (!a || !b) return `${a ? `${dateLabel(a.date)} ${a.time}` : '待補'} → ${b ? `${dateLabel(b.date)} ${b.time}` : '待補'}`;
  return a.date === b.date
    ? `${dateLabel(a.date)} ${a.time} → ${b.time}`
    : `${dateLabel(a.date)} ${a.time} → ${dateLabel(b.date)} ${b.time}`;
}

/* ── 小元件 ─────────────────────────────────────────────── */

const status = (text = '待確認') => `<span class="status">${esc(text)}</span>`;
const chips = (items = []) => items
  .filter((item) => item !== null && item !== undefined && item !== '')
  .map((item) => `<span class="chip">${esc(item)}</span>`)
  .join('');
const list = (items = []) => (items.length ? `<ul>${items.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>` : '');
const label = (text) => `<p class="detail-label">${esc(text)}</p>`;
const referenceImage = (file, alt) => (file
  ? `<a class="reference-image" href="../assets/list/${esc(file)}" target="_blank" rel="noreferrer"><img src="../assets/list/${esc(file)}" alt="${esc(alt)}參考截圖" loading="lazy" decoding="async"><span>點開查看完整截圖 ↗</span></a>`
  : '');
const icon = (type) => ({ 交通: '線', 景點: '景', 美食: '味', 購物: '買', 住宿: '宿' }[type] || '記');

/** 從行程反查某個地點被排在哪幾天，讓分類頁能連回時間軸。 */
function scheduled(data, placeId) {
  const days = data.days.filter((day) => day.events.some((event) => event.placeId === placeId));
  if (!days.length) return '';
  const dates = days.map((day) => dateLabel(day.date)).join('、');
  return `<a class="text-link" href="../itinerary/?day=${esc(days[0].id)}">已排入 ${esc(dates)} →</a>`;
}

/* ── 共用版型 ───────────────────────────────────────────── */

function nav(active, depth) {
  const base = depth ? '../' : './';
  const links = [
    ['home', '首頁', `${base}index.html`],
    ['itinerary', '行程', `${base}itinerary/`],
    ['attractions', '景點', `${base}attractions/`],
    ['food', '美食', `${base}food/`],
    ['shopping', '購物', `${base}shopping/`],
    ['info', '資訊', `${base}info/`]
  ];
  return `<nav class="site-nav" aria-label="主要導覽">${links
    .map(([id, label, url]) => `<a href="${url}"${id === active ? ' aria-current="page"' : ''}>${label}</a>`)
    .join('')}</nav>`;
}

function layout({ title, eyebrow, active, depth = 1, body, description = '2026 首爾、全州、大田七日手機旅遊手冊' }) {
  const base = depth ? '../' : './';
  const heading = title === '首爾・全州・大田七日旅'
    ? '首爾・全州・大田<br><span class="nowrap">七日旅</span>'
    : esc(title);
  return `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8">`
    + `<meta name="viewport" content="width=device-width,initial-scale=1">`
    + `<meta name="theme-color" content="#a3312d">`
    + `<meta name="description" content="${esc(description)}">`
    + `<meta property="og:type" content="website">`
    + `<meta property="og:title" content="${esc(title)}｜韓遊帖">`
    + `<meta property="og:description" content="${esc(description)}">`
    + `<title>${esc(title)}｜韓遊帖</title>`
    + `<link rel="icon" href="${base}assets/icons/favicon-32.png" type="image/png" sizes="32x32">`
    + `<link rel="apple-touch-icon" href="${base}assets/icons/apple-touch-icon.png" sizes="180x180">`
    + `<link rel="manifest" href="${base}manifest.webmanifest">`
    + `<link rel="preconnect" href="https://fonts.googleapis.com">`
    + `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`
    + `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@500;700&family=Shippori+Mincho+B1:wght@500;700&display=swap">`
    + `<link rel="stylesheet" href="${base}assets/styles.css">`
    + `<script type="module" src="${base}assets/app.js"></script></head>`
    + `<body><a class="skip" href="#main">跳至內容</a>`
    + `<header class="masthead"><a class="brand" href="${base}index.html"><span class="seal">旅</span><span><b>韓遊帖</b><small lang="ko">한국 여행첩</small></span></a>${nav(active, depth)}</header>`
    + `<main id="main"><header class="page-head"><p class="eyebrow">${esc(eyebrow)}</p><h1>${heading}</h1><span class="brush" aria-hidden="true"></span></header>${body}</main>`
    + `<footer><p>2026 首爾・全州・大田｜資料整理於 2026/9/19</p><p>所有營業、交通及分店資訊仍須於出發前確認。</p></footer></body></html>`;
}

/* ── 首頁 ───────────────────────────────────────────────── */

function home(data) {
  const dayCards = data.days.map((day) => `<a class="day-card" href="./itinerary/?day=${esc(day.id)}">`
    + `<span>第 ${day.dayNumber} 天</span><b>${dateLabel(day.date)}</b>`
    + `<strong>${esc(day.title)}</strong><small>${esc(day.cities.join(' → '))}</small></a>`).join('');

  const reminders = data.notices.map((notice) => `<article class="notice"><span>${esc(notice.level)}</span>`
    + `<div><h3>${esc(notice.publicTitle)}</h3><p>${esc(notice.publicContent)}</p></div></article>`).join('');

  const flights = data.transport.filter((item) => item.type === '航班')
    .map((item) => `<article><b>${esc(item.from)} → ${esc(item.to)}</b>`
      + `<span>${esc(item.departAt?.slice(11, 16) || '待補')} → ${esc(item.arriveAt?.slice(11, 16) || '待補')}</span></article>`).join('');

  const stays = data.stays.map((stay) => `<article><b>${esc(stay.name)}</b>`
    + `<span>${esc(stay.dates.map(dateLabel).join('、'))}</span>`
    + `<small>${esc(stay.publicNote)}</small></article>`).join('');

  return layout({
    title: '首爾・全州・大田七日旅',
    eyebrow: '2026.09.24 — 09.30',
    active: 'home',
    depth: 0,
    body: `<section class="hero"><div><p class="hero-ko" lang="ko">가을, 한국으로</p>`
      + `<h2>把每天的路，<br>收進一冊旅帖。</h2>`
      + `<p>一份為手機準備的暫定行程，從首爾古宮、全州韓屋到大田轉行，把交通、美食與採買線索放在同一處。</p>`
      + `<div class="hero-actions"><a class="button primary" href="./itinerary/">打開每日行程</a><a class="button" href="./food/">找一間餐廳</a></div></div>`
      + `<aside class="trip-ticket"><span class="seal seal-lg">遊</span><p>7 DAYS · 3 CITIES</p>`
      + `<strong>SEOUL</strong><strong>JEONJU</strong><strong>DAEJEON</strong>`
      + `<small>${status(data.trip.status)} 行程內容仍會更新</small></aside></section>`

      + `<section><div class="section-title"><div><p class="eyebrow">일정 · Schedule</p><h2>這幾天去哪裡</h2></div>`
      + `<a href="./itinerary/">看完整時間軸 →</a></div><div class="day-grid">${dayCards}</div></section>`

      + `<section class="update-entry"><div><p class="eyebrow">2026 UPDATE · 9/19</p><h2>最新旅遊摘要</h2>`
      + `<p>秋夕交通、景福宮時段、全州步行與大田週一休館，出發前先看最新提醒。</p></div>`
      + `<a class="button primary" href="./info/#travel-updates">查看旅遊摘要 →</a></section>`

      + `<section><div class="section-title"><div><p class="eyebrow">MOVE &amp; STAY</p><h2>航班與住宿摘要</h2></div>`
      + `<a href="./info/">查看完整資訊 →</a></div>`
      + `<div class="summary-grid"><div><h3>往返航班</h3>${flights}</div><div><h3>住宿線索</h3>${stays}</div></div></section>`

      + `<section class="ink-section"><div class="section-title"><div><p class="eyebrow">꼭 확인하세요</p><h2>出發前提醒</h2></div>`
      + `<a href="./info/">所有實用資訊 →</a></div><div class="notice-list">${reminders}</div></section>`
  });
}

/* ── 每日行程 ───────────────────────────────────────────── */

function itinerary(data) {
  const foodNames = new Map(data.restaurants.map((item) => [item.id, item.nameZh]));

  // 第一天在建置時就選好，沒有 JavaScript 也不會七天同時攤開。
  const tabs = data.days.map((day, index) => `<button type="button" role="tab" id="tab-${esc(day.id)}"`
    + ` data-day-tab="${esc(day.id)}" aria-controls="panel-${esc(day.id)}"`
    + ` aria-selected="${index === 0}" tabindex="${index === 0 ? 0 : -1}">`
    + `<b>${day.dayNumber}</b><span>${shortDate(day.date)}</span></button>`).join('');

  const event = (item) => `<li><span class="timeline-mark" aria-hidden="true">${icon(item.type)}</span><article>`
    + `<div class="event-meta"><span>${item.startTime ? `${esc(item.startTime)}${item.endTime ? `–${esc(item.endTime)}` : ''}` : '時間待定'}</span>`
    + `<span>${esc(item.type)}</span></div>`
    + `<h3>${esc(item.title)}</h3><p>${esc(item.publicNote)}</p>`
    + `${item.placeId?.startsWith('food-') ? `<a class="text-link" href="../food/#${esc(item.placeId)}">查看 ${esc(foodNames.get(item.placeId) || '餐廳')}資料 →</a>` : ''}`
    + `</article></li>`;

  const panels = data.days.map((day, index) => `<section id="panel-${esc(day.id)}" role="tabpanel"`
    + ` aria-labelledby="tab-${esc(day.id)}" data-day-panel="${esc(day.id)}" class="day-panel" tabindex="0"`
    + `${index === 0 ? '' : ' hidden'}>`
    + `<header><div><p class="eyebrow">DAY ${String(day.dayNumber).padStart(2, '0')} · ${dateLabel(day.date)}</p>`
    + `<h2>${esc(day.title)}</h2><p>${esc(day.summary)}</p></div>${status('全日暫定')}</header>`
    + `<ol class="timeline">${day.events.map(event).join('')}</ol></section>`).join('');

  return layout({
    title: '每日行程',
    eyebrow: '일정 · Itinerary',
    active: 'itinerary',
    body: `<noscript><p class="no-js-note">瀏覽器未啟用 JavaScript，日期切換無法使用；改以網址的 ?day= 參數查看其他天。</p></noscript>`
      + `<div class="day-tabs" role="tablist" aria-label="選擇日期">${tabs}</div>${panels}`
  });
}

/* ── 景點 ───────────────────────────────────────────────── */

function attractions(data) {
  const cards = data.attractions.map((item) => `<article class="catalog-card">`
    + `<div class="card-top">${chips([item.category, item.city])}${status(item.verificationStatus)}</div>`
    + `<h2 class="card-title">${esc(item.nameZh)}</h2>`
    + `${item.nameKo ? `<p class="ko" lang="ko">${esc(item.nameKo)}</p>` : ''}`
    + `<p>${esc(item.summary)}</p>${scheduled(data, item.id)}`
    + `<footer><span>${esc(item.area || '地區待補')}</span><span>${esc(item.status)}</span></footer></article>`).join('');

  return layout({
    title: '景點資料',
    eyebrow: '명소 · Places',
    active: 'attractions',
    body: `<p class="lead">先收錄行程中明確出現的景點。未確認的入口、地址與營業資訊不建立按鈕。</p>`
      + `<div class="catalog-grid">${cards}</div>`
  });
}

/* ── 美食 ───────────────────────────────────────────────── */

/** 原清單以東西南北中分組；照同樣的分組排版，長清單才找得到東西。 */
const DIRECTION_ORDER = ['中', '東', '西', '南', '北'];

function foodCard(data, item, level = 3) {
  const fromScreenshot = item.recordType === '截圖';
  const details = [
    list(item.recommendedDishes) && `${label('餐點')}${list(item.recommendedDishes)}`,
    list(item.publicNotes) && `${label('注意事項')}${list(item.publicNotes)}`,
    fromScreenshot && item.rawHours ? `<p><b>記錄中的時間：</b>${lines(item.rawHours)}</p>` : '',
    item.directionNote ? `<p class="muted">${esc(item.directionNote)}</p>` : '',
    fromScreenshot ? '' : `<p><b>確認狀態：</b>${esc(item.identityStatus)}</p>`
  ].filter(Boolean).join('');

  return `<article id="${esc(item.id)}" class="catalog-card food-card">`
    + `<div class="card-top">${chips([fromScreenshot ? null : item.direction, item.area, ...item.foodTypes.slice(0, 1)])}</div>`
    + referenceImage(item.image, item.nameZh)
    + `<h${level} class="card-title">${esc(item.nameZh)}</h${level}>`
    + `${item.nameKo ? `<p class="ko" lang="ko">${esc(item.nameKo)}</p>` : ''}`
    + scheduled(data, item.id)
    + `${fromScreenshot ? '' : `<div class="hours"><small>營業與休業提醒</small><p>${lines(item.rawHours)}</p></div>`}`
    + `<details><summary>餐點與備註</summary>${details}</details></article>`;
}

function food(data) {
  const planned = data.restaurants.filter((item) => item.recordType === '行程表');
  const screenshots = data.restaurants.filter((item) => item.recordType === '截圖');

  const directions = [...DIRECTION_ORDER, null].filter((key) => planned.some((item) => item.direction === key));
  const groups = directions.map((key) => {
    const items = planned.filter((item) => item.direction === key);
    return `<div class="group"><div class="group-head"><h3>${esc(key || '未分組')}</h3>`
      + `<span>${items.length} 間</span></div>`
      + `<div class="catalog-grid food-grid">${items.map((item) => foodCard(data, item, 4)).join('')}</div></div>`;
  }).join('');

  return layout({
    title: '美食資料庫',
    eyebrow: '맛집 · Food archive',
    active: 'food',
    body: `<p class="lead">保留原有 ${planned.length} 筆候選餐廳，另加入 ${screenshots.length} 筆截圖美食。截圖中的價格與時間是整理當下的記錄，出發前請再查看店家公告。</p>`
      + `<section><div class="section-title"><div><p class="eyebrow">RESTAURANTS</p><h2>餐廳</h2></div></div>`
      + `<p class="lead">依原清單的東西南北中分組排列，卡片上的標籤是所在地區與料理類型。</p>${groups}</section>`
      + `<section><div class="section-title"><div><p class="eyebrow">FOOD LIST</p><h2>美食清單</h2></div></div>`
      + `<div class="catalog-grid food-grid">${screenshots.map((item) => foodCard(data, item)).join('')}</div></section>`
  });
}

/* ── 購物 ───────────────────────────────────────────────── */

function productCard(item) {
  const details = [
    item.purchaseHint ? `<p><b>購買線索：</b>${esc(item.purchaseHint)}</p>` : '',
    item.priceNote ? `<p class="muted">${esc(item.priceNote)}</p>` : '',
    list(item.notes) && `${label('備註')}${list(item.notes)}`
  ].filter(Boolean).join('');

  return `<article id="${esc(item.id)}" class="catalog-card product-card">`
    + referenceImage(item.image, item.name)
    + `${item.brand ? `<p class="product-brand">${esc(item.brand)}</p>` : ''}`
    + `<h3 class="card-title">${esc(item.name)}</h3>`
    + `${item.variant ? `<p class="product-spec">${esc(item.variant)}</p>` : ''}`
    + `${item.referencePrice ? `<p class="product-price">${esc(item.referencePrice)}</p>` : ''}`
    + `${details ? `<details><summary>購買線索與備註</summary>${details}</details>` : ''}`
    + `</article>`;
}

function shopping(data) {
  const stores = data.stores.map((item) => `<article class="catalog-card">`
    + `<div class="card-top">${chips([item.category, item.area || '地區待補'])}${status(item.verificationStatus)}</div>`
    + `<h3 class="card-title">${esc(item.nameZh)}</h3>`
    + `${item.nameKo ? `<p class="ko" lang="ko">${esc(item.nameKo)}</p>` : ''}`
    + `<p>${esc(item.publicNote)}</p>${scheduled(data, item.id)}</article>`).join('');

  const products = data.shoppingItems.length
    ? `<div class="catalog-grid product-grid">${data.shoppingItems.map(productCard).join('')}</div>`
    : `<div class="empty-state product-empty"><span class="seal">待</span><h2>購物清單待補</h2>`
      + `<p>之後會加入商品、規格與購買地點。目前沒有虛構商品、價格或庫存。</p></div>`;

  return layout({
    title: '購物與商店',
    eyebrow: '쇼핑 · Shopping',
    active: 'shopping',
    body: `<section class="shopping-intro">`
      + `<div><p class="eyebrow">LIST 01</p><h2>去哪裡逛</h2><p>這些是行程裡已有的商店線索，分店未明時不猜地址。</p></div>`
      + `<div><p class="eyebrow">LIST 02</p><h2>要買什麼</h2><p>已依你提供的截圖整理 ${data.shoppingItems.length} 項商品，點圖片可查看原始截圖。</p></div></section>`
      + `<div class="catalog-grid">${stores}</div>`
      + `<section><div class="section-title"><div><p class="eyebrow">BUY LIST</p><h2>購物清單</h2></div></div>${products}</section>`
  });
}

/* ── 實用資訊 ───────────────────────────────────────────── */

function info(data) {
  const transports = data.transport.map((item) => `<article class="info-row">`
    + `<span class="seal" aria-hidden="true">${item.type === '航班' ? '飛' : '行'}</span>`
    + `<div><p class="eyebrow">${esc(item.type)} · ${esc(item.status)}</p>`
    + `<h3>${esc(item.from)} → ${esc(item.to)}</h3>`
    + `<p class="route-time">${esc(routeTime(item))}</p>`
    + `<small>${esc(item.note)}</small></div></article>`).join('');

  const stays = data.stays.map((item) => `<article class="catalog-card">`
    + `<div class="card-top">${chips([item.city, '住宿'])}${status(item.status)}</div>`
    + `<h3 class="card-title">${esc(item.name)}</h3><p>${esc(item.publicNote)}</p></article>`).join('');

  const notices = data.notices.map((item) => `<article class="notice"><span>${esc(item.level)}</span>`
    + `<div><h3>${esc(item.publicTitle)}</h3><p>${esc(item.publicContent)}</p></div></article>`).join('');

  const updates = data.travelUpdates.map((item) => `<article class="update-card" data-travel-update>`
    + `<div class="card-top">${chips([item.label])}${status(item.status)}</div>`
    + `<h3>${esc(item.title)}</h3><p>${esc(item.summary)}</p>`
    + `<small>${esc(item.timeZoneNote)}｜${esc(checkedDateLabel(item.checkedAt))} 更新（台北）</small>`
    + `<div class="official-links">${item.links.map((link) => {
      const url = safeUrl(link.url);
      return url ? `<a class="official-link" href="${url}" target="_blank" rel="noreferrer">官方｜${esc(link.label)} ↗</a>` : '';
    }).join('')}</div></article>`).join('');

  return layout({
    title: '實用資訊',
    eyebrow: '안내 · Travel notes',
    active: 'info',
    body: `<section id="travel-updates"><div class="section-title"><div><p class="eyebrow">2026 UPDATE · 9/19</p><h2>最新旅遊摘要</h2></div>${status('官方資訊已查閱')}</div>`
      + `<p class="lead">新增內容是出發前參考；標示為候選的景點與餐點尚未加入每日行程。</p>`
      + `<div class="update-grid">${updates}</div></section>`
      + `<section><div class="section-title"><div><p class="eyebrow">MOVE</p><h2>交通筆記</h2></div>${status('票券待核對')}</div>`
      + `<div class="info-list">${transports}</div></section>`
      + `<section><div class="section-title"><div><p class="eyebrow">STAY</p><h2>住宿線索</h2></div></div>`
      + `<div class="catalog-grid">${stays}</div></section>`
      + `<section class="ink-section"><div class="section-title"><div><p class="eyebrow">NOTICE</p><h2>重要提醒</h2></div></div>`
      + `<div class="notice-list">${notices}</div></section>`
  });
}

/* ── 建置 ───────────────────────────────────────────────── */

export async function buildSite({ outputDir = join(rootDir, 'dist') } = {}) {
  const data = await loadData(rootDir);
  const errors = validateData(data);
  if (errors.length) throw new Error(errors.join('\n'));

  const styles = await readFile(join(rootDir, 'src', 'styles.css'), 'utf8');
  const stylesFile = `styles.${createHash('sha256').update(styles).digest('hex').slice(0, 12)}.css`;

  await rm(outputDir, { recursive: true, force: true });
  await mkdir(join(outputDir, 'assets'), { recursive: true });

  const pages = [
    ['index.html', home(data)],
    ['itinerary/index.html', itinerary(data)],
    ['attractions/index.html', attractions(data)],
    ['food/index.html', food(data)],
    ['shopping/index.html', shopping(data)],
    ['info/index.html', info(data)]
  ];
  for (const [file, html] of pages) {
    await mkdir(dirname(join(outputDir, file)), { recursive: true });
    await writeFile(join(outputDir, file), html.replace('assets/styles.css', `assets/${stylesFile}`));
  }

  await writeFile(join(outputDir, 'assets', stylesFile), styles);
  await Promise.all(['styles.css', 'app.js', 'favicon.svg']
    .map(async (file) => writeFile(join(outputDir, 'assets', file), await readFile(join(rootDir, 'src', file), 'utf8'))));
  await copyFile(join(rootDir, 'src', 'manifest.webmanifest'), join(outputDir, 'manifest.webmanifest'));

  await mkdir(join(outputDir, 'assets', 'icons'), { recursive: true });
  await Promise.all(['icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'favicon-32.png']
    .map((file) => copyFile(join(rootDir, 'src', 'icons', file), join(outputDir, 'assets', 'icons', file))));

  const referenceImages = [...new Set([...data.restaurants, ...data.shoppingItems].map((item) => item.image).filter(Boolean))];
  await mkdir(join(outputDir, 'assets', 'list'), { recursive: true });
  await Promise.all(referenceImages.map((file) => copyFile(join(rootDir, '美食與購物清單', file), join(outputDir, 'assets', 'list', file))));

  console.log(`建置完成：${relative(rootDir, outputDir)}（${pages.length} 個頁面）`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await buildSite();
