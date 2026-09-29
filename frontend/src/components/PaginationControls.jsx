import { getPageCount } from '../utils/pagination'


function PaginationControls({
  currentPage,
  itemCount,
  onPageChange,
  pageSize = 10,
  itemLabel = 'items',
}) {
  const pageCount = getPageCount(itemCount, pageSize)

  if (itemCount <= pageSize) {
    return null
  }

  const firstItem = ((currentPage - 1) * pageSize) + 1
  const lastItem = Math.min(currentPage * pageSize, itemCount)

  return (
    <nav
      aria-label={`${itemLabel} pagination`}
      className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between"
    >
      <p>
        Showing {firstItem}–{lastItem} of {itemCount} {itemLabel}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <span aria-live="polite" className="min-w-24 text-center">
          Page {currentPage} of {pageCount}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === pageCount}
          className="rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </nav>
  )
}


export default PaginationControls
