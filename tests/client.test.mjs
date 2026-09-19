import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveDayId } from '../src/app.js';

test('日期網址只接受存在的 day id，否則回到第一天', () => {
  const ids = ['day-01', 'day-02', 'day-03'];
  assert.equal(resolveDayId(ids, 'day-02'), 'day-02');
  assert.equal(resolveDayId(ids, 'day-99'), 'day-01');
  assert.equal(resolveDayId(ids, null), 'day-01');
});
