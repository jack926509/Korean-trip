import test from 'node:test';
import assert from 'node:assert/strict';
import { matchesFilter } from '../src/app.js';

test('分類條件只比對卡片分類', () => {
  const card = { filters: ['首爾', '湯品', '西'] };
  assert.equal(matchesFilter(card, ''), true);
  assert.equal(matchesFilter(card, '湯品'), true);
  assert.equal(matchesFilter(card, '烤肉'), false);
});
