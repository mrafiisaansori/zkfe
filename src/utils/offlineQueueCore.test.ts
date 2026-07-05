import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isNetworkError, computeDraftTotals } from './offlineQueueCore.ts';

test('isNetworkError: true saat request dikirim tapi gak ada response (putus koneksi)', () => {
  assert.equal(isNetworkError({ request: {} }), true);
});

test('isNetworkError: false saat server sempat merespon (mis. validasi/stok ditolak)', () => {
  assert.equal(isNetworkError({ request: {}, response: { status: 400 } }), false);
});

test('isNetworkError: false untuk error biasa tanpa request axios sama sekali', () => {
  assert.equal(isNetworkError(new Error('lainnya')), false);
});

test('computeDraftTotals: plan FREE tidak kena pajak walau tax setting aktif', () => {
  const r = computeDraftTotals({ subtotal: 100000, diskon: 0, plan: 'FREE', tax: { PPN_ENABLED: true, PPN_PERSEN: 10, SERVICE_ENABLED: true, SERVICE_PERSEN: 5 } as never });
  assert.equal(r.ppn, 0);
  assert.equal(r.service, 0);
  assert.equal(r.total, 100000);
});

test('computeDraftTotals: plan PRO kena PPN + service sesuai persen, dihitung dari (subtotal - diskon)', () => {
  const r = computeDraftTotals({ subtotal: 100000, diskon: 10000, plan: 'PRO', tax: { PPN_ENABLED: true, PPN_PERSEN: 10, SERVICE_ENABLED: true, SERVICE_PERSEN: 5 } as never });
  assert.equal(r.dpp, 90000);
  assert.equal(r.ppn, 9000);
  assert.equal(r.service, 4500);
  assert.equal(r.total, 103500);
});

test('computeDraftTotals: diskon tidak boleh bikin dpp negatif', () => {
  const r = computeDraftTotals({ subtotal: 10000, diskon: 50000, plan: 'PRO', tax: null });
  assert.equal(r.dpp, 0);
  assert.equal(r.total, 0);
});
