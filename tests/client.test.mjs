import test from 'node:test';
import assert from 'node:assert/strict';
import { matchesCard } from '../src/app.js';

test('搜尋忽略大小寫與空白並支援中韓文', () => {
  const card = { search: '北韓蔘雞湯 無垢屋 무구옥 安國站', filters: ['首爾', '湯品'] };
  assert.equal(matchesCard(card, { query: ' 무 구 옥 ', filter: '' }), true);
  assert.equal(matchesCard(card, { query: '無垢屋', filter: '' }), true);
  assert.equal(matchesCard(card, { query: '新村', filter: '' }), false);
});

test('分類條件與文字條件同時生效', () => {
  const card = { search: '新村豆腐鍋 맛있는순두부', filters: ['首爾', '湯品', '西'] };
  assert.equal(matchesCard(card, { query: '두부', filter: '湯品' }), true);
  assert.equal(matchesCard(card, { query: '두부', filter: '烤肉' }), false);
});
