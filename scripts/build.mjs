import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadData, validateData } from './validate-data.mjs';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const weekdays = ['日','一','二','三','四','五','六'];
const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const lines = (value = '') => esc(value).replace(/\n/g, '<br>');
const safeUrl = (value) => { try { const url = new URL(value); return ['http:','https:'].includes(url.protocol) ? esc(url.href) : null; } catch { return null; } };
const dateLabel = (iso) => { const d = new Date(`${iso}T12:00:00+09:00`); return `${d.getMonth()+1}/${d.getDate()}（${weekdays[d.getDay()]}）`; };
const status = (text='待確認') => `<span class="status">${esc(text)}</span>`;
const chips = (items=[]) => items.map((item)=>`<span class="chip">${esc(item)}</span>`).join('');
const icon = (type) => ({交通:'線',景點:'景',美食:'味',購物:'買',住宿:'宿'}[type] || '記');

function nav(active, depth) {
  const p = depth ? '../' : './';
  const links = [['home','首頁',`${p}index.html`],['itinerary','行程',`${p}itinerary/`],['attractions','景點',`${p}attractions/`],['food','美食',`${p}food/`],['shopping','購物',`${p}shopping/`],['info','資訊',`${p}info/`]];
  return `<nav class="site-nav" aria-label="主要導覽">${links.map(([id,label,url])=>`<a href="${url}" ${id===active?'aria-current="page"':''}>${label}</a>`).join('')}</nav>`;
}

function layout({ title, eyebrow, active, depth=1, body }) {
  const p = depth ? '../' : './';
  const heading=title==='首爾・全州・大田七日旅'?'首爾・全州・大田<br><span class="nowrap">七日旅</span>':esc(title);
  return `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#a3312d"><meta name="description" content="2026 首爾、全州、大田七日手機旅遊手冊"><title>${esc(title)}｜韓遊帖</title><link rel="icon" href="${p}assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="${p}assets/styles.css"><script type="module" src="${p}assets/app.js"></script></head><body><a class="skip" href="#main">跳至內容</a><header class="masthead"><a class="brand" href="${p}index.html"><span class="seal">旅</span><span><b>韓遊帖</b><small lang="ko">한국 여행첩</small></span></a>${nav(active,depth)}</header><main id="main"><header class="page-head"><p class="eyebrow">${esc(eyebrow)}</p><h1>${heading}</h1><span class="brush" aria-hidden="true"></span></header>${body}</main><footer><p>2026 首爾・全州・大田｜資料整理於 2026/9/19</p><p>所有營業、交通及分店資訊仍須於出發前確認。</p></footer></body></html>`;
}

function home(data) {
  const dayCards = data.days.map((day)=>`<a class="day-card" href="./itinerary/?day=${day.id}"><span>第 ${day.dayNumber} 天</span><b>${dateLabel(day.date)}</b><strong>${esc(day.title)}</strong><small>${esc(day.cities.join(' → '))}</small></a>`).join('');
  const reminders = data.notices.map((n)=>`<article class="notice"><span>${esc(n.level)}</span><div><h3>${esc(n.title)}</h3><p>${esc(n.content)}</p></div></article>`).join('');
  const sourceUrl=safeUrl(data.trip.sourceUrl);
  const transportSummary=data.transport.filter(x=>x.type==='航班').map(x=>`<article><b>${esc(x.from)} → ${esc(x.to)}</b><span>${esc(x.departAt?.slice(11,16)||'待補')} → ${esc(x.arriveAt?.slice(11,16)||'待補')}</span></article>`).join('');
  const staySummary=data.stays.map(x=>`<article><b>${esc(x.name)}</b><span>${esc(x.dates.map(dateLabel).join('、'))}</span><small>${esc(x.note)}</small></article>`).join('');
  return layout({title:'首爾・全州・大田七日旅',eyebrow:'2026.09.24 — 09.30',active:'home',depth:0,body:`<section class="hero"><div><p class="hero-ko" lang="ko">가을, 한국으로</p><h2>把每天的路，<br>收進一冊旅帖。</h2><p>一份為手機準備的暫定行程，從首爾古宮、全州韓屋到大田轉行，把交通、美食與採買線索放在同一處。</p><div class="hero-actions"><a class="button primary" href="./itinerary/">打開每日行程</a><a class="button" href="./food/">找一間餐廳</a></div></div><aside class="trip-ticket"><span class="seal seal-lg">遊</span><p>7 DAYS · 3 CITIES</p><strong>SEOUL</strong><strong>JEONJU</strong><strong>DAEJEON</strong><small>${status(data.trip.status)} 行程內容仍會更新</small></aside></section><section><div class="section-title"><div><p class="eyebrow">일정 · Schedule</p><h2>這幾天去哪裡</h2></div><a href="./itinerary/">看完整時間軸 →</a></div><div class="day-grid">${dayCards}</div></section><section><div class="section-title"><div><p class="eyebrow">MOVE & STAY</p><h2>航班與住宿摘要</h2></div><a href="./info/">查看完整資訊 →</a></div><div class="summary-grid"><div><h3>往返航班</h3>${transportSummary}</div><div><h3>住宿線索</h3>${staySummary}</div></div></section><section class="ink-section"><div class="section-title"><div><p class="eyebrow">꼭 확인하세요</p><h2>出發前提醒</h2></div><a href="./info/">所有實用資訊 →</a></div><div class="notice-list">${reminders}</div></section><section class="source-strip"><div><p class="eyebrow">Source note</p><h2>資料保留原貌</h2></div><p>行程與 17 筆餐廳來自原始試算表。未確認的店名、分店、營業與休假會明確標示，不用推測補齊。</p>${sourceUrl?`<a class="button" href="${sourceUrl}" target="_blank" rel="noreferrer">查看原始試算表</a>`:''}</section>`});
}

function itinerary(data) {
  const foodMap = new Map(data.restaurants.map(x=>[x.id,x]));
  const tabs=data.days.map((d)=>`<button role="tab" data-day-tab="${d.id}" aria-controls="panel-${d.id}"><b>${d.dayNumber}</b><span>${dateLabel(d.date).split('（')[0]}</span></button>`).join('');
  const panels=data.days.map((d)=>`<section id="panel-${d.id}" role="tabpanel" data-day-panel="${d.id}" class="day-panel"><header><div><p class="eyebrow">DAY ${String(d.dayNumber).padStart(2,'0')} · ${dateLabel(d.date)}</p><h2>${esc(d.title)}</h2><p>${esc(d.summary)}</p></div>${status('全日暫定')}</header><ol class="timeline">${d.events.map((e)=>`<li><span class="timeline-mark">${icon(e.type)}</span><article><div class="event-meta"><span>${e.startTime?`${esc(e.startTime)}${e.endTime?`–${esc(e.endTime)}`:''}`:'時間待定'}</span><span>${esc(e.type)}</span></div><h3>${esc(e.title)}</h3><p>${esc(e.note)}</p>${e.placeId?.startsWith('food-')?`<a class="text-link" href="../food/#${e.placeId}">查看 ${esc(foodMap.get(e.placeId)?.nameZh || '餐廳')} 資料 →</a>`:''}</article></li>`).join('')}</ol></section>`).join('');
  return layout({title:'每日行程',eyebrow:'일정 · Itinerary',active:'itinerary',body:`<div class="day-tabs" role="tablist" aria-label="選擇日期">${tabs}</div>${panels}`});
}

function filters({placeholder,options}) { return `<div class="filter-bar"><label><span>搜尋</span><input type="search" data-search placeholder="${esc(placeholder)}"></label><label><span>分類</span><select data-filter><option value="">全部分類</option>${options.map(x=>`<option>${esc(x)}</option>`).join('')}</select></label><button class="button" type="button" data-clear>清除篩選</button><output data-result-count></output></div>`; }
function empty() { return `<div class="empty-state" data-empty hidden><span class="seal">空</span><h2>沒有符合條件的資料</h2><p>換一個關鍵字，或清除篩選後再看看。</p><button class="button" type="button" data-clear>清除篩選</button></div>`; }
function scheduledDates(data, id) { return data.days.filter(day=>day.events.some(event=>event.placeId===id)).map(day=>dateLabel(day.date)); }

function attractions(data) {
  const cards=data.attractions.map((x)=>{const dates=scheduledDates(data,x.id);return `<article class="catalog-card" data-card="attraction" data-search-text="${esc([x.nameZh,x.nameKo,x.city,x.area,x.category].join(' '))}" data-filters="${esc([x.city,x.category].join('|'))}"><div class="card-top">${chips([x.category,x.city])}${status(x.verificationStatus)}</div><h2>${esc(x.nameZh)}</h2>${x.nameKo?`<p class="ko" lang="ko">${esc(x.nameKo)}</p>`:''}<p>${esc(x.summary)}</p>${dates.length?`<a class="text-link" href="../itinerary/?day=${esc(data.days.find(day=>day.events.some(e=>e.placeId===x.id)).id)}">已排入 ${esc(dates.join('、'))} →</a>`:''}<footer><span>${esc(x.area || '地區待補')}</span><span>${esc(x.status)}</span></footer></article>`}).join('');
  return layout({title:'景點資料',eyebrow:'명소 · Places',active:'attractions',body:`<p class="lead">先收錄行程中明確出現的景點。未確認的入口、地址與營業資訊不建立按鈕。</p><section data-filter-scope>${filters({placeholder:'搜尋中韓文名稱或地區',options:['首爾','古蹟','河岸','街區']})}<div class="catalog-grid">${cards}</div>${empty()}</section>`});
}

function food(data) {
  const cards=data.restaurants.map((x)=>{const src=safeUrl(x.sourceNote);const dates=scheduledDates(data,x.id);const direction=x.direction.slice(0,1); return `<article id="${x.id}" class="catalog-card food-card" data-card="food" data-search-text="${esc([x.nameZh,x.nameKo,x.rawName,x.city,x.area,...x.foodTypes].join(' '))}" data-filters="${esc([x.city,x.area,direction,...x.foodTypes].join('|'))}"><div class="card-top">${chips([direction,x.area,...x.foodTypes.slice(0,1)])}${status(x.verificationStatus)}</div><h2>${esc(x.nameZh)}</h2>${x.nameKo?`<p class="ko" lang="ko">${esc(x.nameKo)}</p>`:''}${dates.length?`<a class="text-link scheduled" href="../itinerary/?day=${esc(data.days.find(day=>day.events.some(e=>e.placeId===x.id)).id)}">已排入 ${esc(dates.join('、'))} →</a>`:''}<div class="hours"><small>原表時間／休業筆記</small><p>${lines(x.rawHours)}</p></div><details><summary>餐點、備註與來源</summary>${x.recommendedDishes.length?`<h3>餐點原文</h3><ul>${x.recommendedDishes.map(i=>`<li>${esc(i)}</li>`).join('')}</ul>`:''}${x.notes.length?`<h3>整理備註</h3><ul>${x.notes.map(i=>`<li>${esc(i)}</li>`).join('')}</ul>`:''}<p><b>辨識狀態：</b>${esc(x.identityStatus)}</p><p><b>來源：</b>「吃吃喝喝」${esc(data.sources.find(s=>s.id===x.sourceRefs[0])?.range || '')}</p>${x.sourceNote&&!src?`<p><b>原表出處：</b>${esc(x.sourceNote)}</p>`:''}${src?`<a class="text-link" href="${src}" target="_blank" rel="noreferrer">開啟原表提供的出處 ↗</a>`:''}</details></article>`}).join('');
  const opts=[...new Set(data.restaurants.flatMap(x=>[x.city,x.area,x.direction.slice(0,1),...x.foodTypes]))];
  return layout({title:'美食資料庫',eyebrow:'맛집 · Food archive',active:'food',body:`<p class="lead">共 17 筆候選餐廳。營業、價格與中秋異動皆是原表筆記，尚未完成官方查證。</p><section data-filter-scope>${filters({placeholder:'搜尋中文、韓文、車站或餐點',options:opts})}<div class="catalog-grid food-grid">${cards}</div>${empty()}</section>`});
}

function shopping(data) {
  const stores=data.stores.map((x)=>{const dates=scheduledDates(data,x.id);return `<article class="catalog-card" data-card="store" data-search-text="${esc([x.nameZh,x.nameKo,x.city,x.area,x.category].join(' '))}" data-filters="${esc([x.city,x.area,x.category].join('|'))}"><div class="card-top">${chips([x.category,x.area||'地區待補'])}${status(x.verificationStatus)}</div><h2>${esc(x.nameZh)}</h2>${x.nameKo?`<p class="ko">${esc(x.nameKo)}</p>`:''}<p>${esc(x.note)}</p>${dates.length?`<a class="text-link" href="../itinerary/?day=${esc(data.days.find(day=>day.events.some(e=>e.placeId===x.id)).id)}">已排入 ${esc(dates.join('、'))} →</a>`:''}</article>`}).join('');
  const products=data.shoppingItems.length?`<div class="catalog-grid">${data.shoppingItems.map(x=>`<article class="catalog-card"><div class="card-top">${chips([x.category||'未分類',x.brand||'品牌待補'])}</div><h3>${esc(x.name)}</h3><p>${esc([x.variant,x.quantity?`數量 ${x.quantity}`:''].filter(Boolean).join(' · ')||'規格與數量待補')}</p></article>`).join('')}</div>`:`<div class="empty-state product-empty"><span class="seal">待</span><h2>購物清單待補</h2><p>之後會加入商品、規格與購買地點。目前沒有虛構商品、價格或庫存。</p></div>`;
  return layout({title:'購物與商店',eyebrow:'쇼핑 · Shopping',active:'shopping',body:`<section class="shopping-intro"><div><p class="eyebrow">LIST 01</p><h2>去哪裡逛</h2><p>這些是行程裡已有的商店線索，分店未明時不猜地址。</p></div><div><p class="eyebrow">LIST 02</p><h2>要買什麼</h2><p>商品、規格與數量會在你提供清單後加入。</p></div></section><section data-filter-scope>${filters({placeholder:'搜尋商店、地區或分類',options:[...new Set(data.stores.flatMap(x=>[x.area,x.category]).filter(Boolean))]})}<div class="catalog-grid">${stores}</div>${empty()}</section><section><div class="section-title"><div><p class="eyebrow">BUY LIST</p><h2>商品清單</h2></div></div>${products}</section>`});
}

function info(data) {
  const transports=data.transport.map(x=>`<article class="info-row"><span class="seal">${x.type==='航班'?'飛':'行'}</span><div><p class="eyebrow">${esc(x.type)} · ${esc(x.status)}</p><h3>${esc(x.from)} → ${esc(x.to)}</h3><p>${esc(x.departAt?.slice(0,16).replace('T',' ') || '時間待補')} → ${esc(x.arriveAt?.slice(0,16).replace('T',' ') || '時間待補')}</p><small>${esc(x.note)}</small></div></article>`).join('');
  const stays=data.stays.map(x=>`<article class="catalog-card"><div class="card-top">${chips([x.city,'住宿'])}${status(x.status)}</div><h3>${esc(x.name)}</h3><p>${esc(x.note)}</p></article>`).join('');
  const notes=data.notices.map(x=>`<article class="notice"><span>${esc(x.level)}</span><div><h3>${esc(x.title)}</h3><p>${esc(x.content)}</p></div></article>`).join('');
  return layout({title:'實用資訊',eyebrow:'안내 · Travel notes',active:'info',body:`<section><div class="section-title"><div><p class="eyebrow">MOVE</p><h2>交通筆記</h2></div>${status('票券待核對')}</div><div class="info-list">${transports}</div></section><section><div class="section-title"><div><p class="eyebrow">STAY</p><h2>住宿線索</h2></div></div><div class="catalog-grid">${stays}</div></section><section class="ink-section"><div class="section-title"><div><p class="eyebrow">NOTICE</p><h2>重要提醒</h2></div></div><div class="notice-list">${notes}</div></section>`});
}

export async function buildSite({ outputDir=join(rootDir,'dist') }={}) {
  const data=await loadData(rootDir); const errors=validateData(data); if(errors.length) throw new Error(errors.join('\n'));
  await rm(outputDir,{recursive:true,force:true}); await mkdir(join(outputDir,'assets'),{recursive:true});
  const pages=[['index.html',home(data)],['itinerary/index.html',itinerary(data)],['attractions/index.html',attractions(data)],['food/index.html',food(data)],['shopping/index.html',shopping(data)],['info/index.html',info(data)]];
  for(const [file,html] of pages){await mkdir(dirname(join(outputDir,file)),{recursive:true});await writeFile(join(outputDir,file),html);}
  await Promise.all(['styles.css','app.js','favicon.svg'].map(async file=>writeFile(join(outputDir,'assets',file),await readFile(join(rootDir,'src',file),'utf8'))));
  console.log(`建置完成：${relative(rootDir,outputDir)}（6 個頁面）`);
}

if(process.argv[1]===fileURLToPath(import.meta.url)) await buildSite();
