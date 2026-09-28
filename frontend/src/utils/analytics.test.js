import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildAnalyticsCsv,
  createAnalyticsQuery,
  normalizeStatusDistribution,
} from './analytics.js'


test('createAnalyticsQuery includes dates only for a custom period', () => {
  assert.equal(
    createAnalyticsQuery({ period: '7d', startDate: '2026-01-01' }),
    'range=7d',
  )
  assert.equal(
    createAnalyticsQuery({
      period: 'custom',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    }),
    'range=custom&date_from=2026-01-01&date_to=2026-01-31',
  )
})


test('normalizeStatusDistribution accepts objects and API lists', () => {
  assert.deepEqual(
    normalizeStatusDistribution({ pending: 2, completed: 4 }),
    [
      { label: 'pending', value: 2 },
      { label: 'completed', value: 4 },
    ],
  )
  assert.deepEqual(
    normalizeStatusDistribution([{ status: 'CONFIRMED', count: 3 }]),
    [{ label: 'CONFIRMED', value: 3 }],
  )
})


test('buildAnalyticsCsv exports summaries and escapes comma-containing names', () => {
  const csv = buildAnalyticsCsv({
    period: { date_from: '2026-01-01', date_to: '2026-01-31' },
    reservations: { total: 5, guests: 12 },
    preorders: { total: 2, total_value: 1500 },
    top_items: [{ name: 'Burger, Large', quantity: 3, value: 900 }],
  }, 'Admin')

  assert.match(csv, /Reservations,5/)
  assert.match(csv, /Preorder value,1500/)
  assert.match(csv, /"Burger, Large"/)
})
