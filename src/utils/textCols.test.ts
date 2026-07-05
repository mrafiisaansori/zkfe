import { test } from 'node:test';
import assert from 'node:assert/strict';
import { truncate, center, twoCol, dashes } from './textCols.ts';

test('twoCol pads to exact width and right-aligns', () => {
  const line = twoCol('Subtotal', 'Rp 10.000', 32);
  assert.equal(line.length, 32);
  assert.equal(line.endsWith('Rp 10.000'), true);
  assert.equal(line.startsWith('Subtotal'), true);
});

test('twoCol truncates left when combined text overflows width', () => {
  const line = twoCol('Nama Produk Sangat Panjang Sekali Sekali', 'Rp 1.000.000', 32);
  assert.equal(line.length, 32);
  assert.equal(line.endsWith('Rp 1.000.000'), true);
});

test('center pads evenly and never exceeds width', () => {
  assert.equal(center('TOKO', 10).length, 10);
  assert.equal(center('X'.repeat(20), 10).length, 10); // truncated, not overflowing
});

test('dashes fills exact width', () => {
  assert.equal(dashes(32), '-'.repeat(32));
});

test('truncate is a no-op under length', () => {
  assert.equal(truncate('abc', 10), 'abc');
});
