import assert from 'node:assert/strict'
import test from 'node:test'

import { clampPage, getPageCount, paginateItems } from './pagination.js'


test('getPageCount keeps empty lists on a stable first page', () => {
  assert.equal(getPageCount(0, 10), 1)
  assert.equal(getPageCount(21, 10), 3)
})


test('clampPage keeps requested pages inside the available range', () => {
  assert.equal(clampPage(0, 30, 10), 1)
  assert.equal(clampPage(9, 30, 10), 3)
})


test('paginateItems returns only records for the selected page', () => {
  assert.deepEqual(paginateItems([1, 2, 3, 4, 5], 2, 2), [3, 4])
  assert.deepEqual(paginateItems([1, 2, 3], 99, 2), [3])
})
