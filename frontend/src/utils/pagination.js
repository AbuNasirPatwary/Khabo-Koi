export const DEFAULT_PAGE_SIZE = 10


export function getPageCount(itemCount, pageSize = DEFAULT_PAGE_SIZE) {
  if (!Number.isFinite(itemCount) || itemCount <= 0) {
    return 1
  }

  return Math.max(1, Math.ceil(itemCount / pageSize))
}


export function clampPage(page, itemCount, pageSize = DEFAULT_PAGE_SIZE) {
  return Math.min(Math.max(1, page), getPageCount(itemCount, pageSize))
}


export function paginateItems(items, page, pageSize = DEFAULT_PAGE_SIZE) {
  const safePage = clampPage(page, items.length, pageSize)
  const start = (safePage - 1) * pageSize

  return items.slice(start, start + pageSize)
}
