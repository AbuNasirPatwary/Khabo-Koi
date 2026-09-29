import { useEffect, useState } from 'react'


const INITIAL_FILTERS = {
  target_type: '',
  status: '',
  search: '',
  from_date: '',
  to_date: '',
}


function humanize(value) {
  if (!value) return 'Unknown'
  return value.toLowerCase().replaceAll('_', ' ').replace(/^./, (letter) => (
    letter.toUpperCase()
  ))
}


function StatusBadge({ children }) {
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 ring-1 ring-inset ring-slate-200">
      {humanize(children)}
    </span>
  )
}


function StatusHistoryPage({ eyebrow, title, description, loadHistory }) {
  const [draftFilters, setDraftFilters] = useState(INITIAL_FILTERS)
  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [page, setPage] = useState(1)
  const [refreshKey, setRefreshKey] = useState(0)
  const [data, setData] = useState({ count: 0, results: [], next: null, previous: null })
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let isCancelled = false

    loadHistory({ ...filters, page, page_size: 20 })
      .then((history) => {
        if (!isCancelled) setData(history)
      })
      .catch((error) => {
        if (!isCancelled) setErrorMessage(error.message)
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false)
      })

    return () => {
      isCancelled = true
    }
  }, [filters, loadHistory, page, refreshKey])

  function updateDraft(event) {
    setDraftFilters((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  function applyFilters(event) {
    event.preventDefault()
    setIsLoading(true)
    setErrorMessage('')
    setPage(1)
    setFilters(draftFilters)
    setRefreshKey((current) => current + 1)
  }

  function clearFilters() {
    setIsLoading(true)
    setErrorMessage('')
    setDraftFilters(INITIAL_FILTERS)
    setFilters(INITIAL_FILTERS)
    setPage(1)
    setRefreshKey((current) => current + 1)
  }

  return (
    <>
      <header className="border-b border-slate-200 bg-white px-6 py-5 sm:px-9">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600">
          {eyebrow}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{title}</h1>
      </header>

      <main className="px-6 py-8 sm:px-9 sm:py-10">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Status change audit
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              {description}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsLoading(true)
              setErrorMessage('')
              setRefreshKey((current) => current + 1)
            }}
            disabled={isLoading}
            className="self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:border-orange-300 hover:text-orange-600 disabled:opacity-60"
          >
            {isLoading ? 'Refreshing…' : 'Refresh history'}
          </button>
        </div>

        <form
          onSubmit={applyFilters}
          className="mt-7 grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2 xl:grid-cols-5"
        >
          <input
            name="search"
            value={draftFilters.search}
            onChange={updateDraft}
            placeholder="Customer, staff, restaurant…"
            aria-label="Search status history"
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm xl:col-span-2"
          />
          <select
            name="target_type"
            value={draftFilters.target_type}
            onChange={updateDraft}
            aria-label="Operation type"
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          >
            <option value="">All operations</option>
            <option value="BOOKING">Reservations</option>
            <option value="PREORDER">Food pre-orders</option>
          </select>
          <input
            name="from_date"
            type="date"
            value={draftFilters.from_date}
            onChange={updateDraft}
            aria-label="Changes from date"
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          />
          <input
            name="to_date"
            type="date"
            value={draftFilters.to_date}
            onChange={updateDraft}
            aria-label="Changes to date"
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          />
          <div className="flex gap-2 md:col-span-2 xl:col-span-5">
            <button className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600">
              Apply filters
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:border-slate-300"
            >
              Clear
            </button>
          </div>
        </form>

        {errorMessage && (
          <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4 text-sm font-semibold text-slate-600">
            {data.count} recorded {data.count === 1 ? 'change' : 'changes'}
          </div>
          {isLoading ? (
            <p className="p-8 text-center text-sm text-slate-500">Loading history…</p>
          ) : data.results.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">
              No status changes match these filters.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.results.map((row) => (
                <article key={row.id} className="grid gap-3 p-5 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {row.target_type === 'BOOKING' ? 'Reservation' : 'Food pre-order'} #{row.target_id}
                      </span>
                      <StatusBadge>{row.old_status}</StatusBadge>
                      <span aria-hidden="true" className="text-slate-400">→</span>
                      <StatusBadge>{row.new_status}</StatusBadge>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      {row.restaurant_name} · {row.branch_name}
                      {row.customer_name ? ` · ${row.customer_name}` : ''}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Changed by {row.actor_username || 'Deleted user'}
                      {row.actor_email ? ` (${row.actor_email})` : ''}
                    </p>
                  </div>
                  <time className="text-xs font-medium text-slate-500" dateTime={row.created_at}>
                    {new Intl.DateTimeFormat('en-GB', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(new Date(row.created_at))}
                  </time>
                </article>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
            <button
              type="button"
              disabled={!data.previous || isLoading}
              onClick={() => {
                setIsLoading(true)
                setErrorMessage('')
                setPage((current) => Math.max(1, current - 1))
              }}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-slate-500">Page {page}</span>
            <button
              type="button"
              disabled={!data.next || isLoading}
              onClick={() => {
                setIsLoading(true)
                setErrorMessage('')
                setPage((current) => current + 1)
              }}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </section>
      </main>
    </>
  )
}


export default StatusHistoryPage
