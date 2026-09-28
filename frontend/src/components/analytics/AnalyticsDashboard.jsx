import {
  buildAnalyticsCsv,
  formatMoney,
  formatNumber,
  normalizeStatusDistribution,
} from '../../utils/analytics'


function downloadCsv(analytics, scopeLabel) {
  const blob = new Blob(
    [buildAnalyticsCsv(analytics, scopeLabel)],
    { type: 'text/csv;charset=utf-8' },
  )
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `khabo-koi-${scopeLabel.toLowerCase().replaceAll(' ', '-')}-analytics.csv`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}


function MetricCard({ label, value, helper, tone = 'orange' }) {
  const toneClasses = {
    orange: 'bg-orange-100 text-orange-700',
    green: 'bg-emerald-100 text-emerald-700',
    blue: 'bg-blue-100 text-blue-700',
    violet: 'bg-violet-100 text-violet-700',
  }

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
        </div>
        <span aria-hidden="true" className={`h-3 w-3 rounded-full ${toneClasses[tone]}`} />
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-400">{helper}</p>
    </article>
  )
}


function StatusBreakdown({ distribution, total }) {
  const statuses = normalizeStatusDistribution(distribution)

  if (!statuses.length) {
    return <p className="py-10 text-center text-sm text-slate-500">No reservation statuses in this period.</p>
  }

  return (
    <div className="mt-5 space-y-4">
      {statuses.map((status) => {
        const percentage = total ? Math.round((status.value / total) * 100) : 0
        return (
          <div key={status.label}>
            <div className="mb-1.5 flex justify-between gap-3 text-sm">
              <span className="font-semibold capitalize text-slate-700">{status.label.toLowerCase()}</span>
              <span className="text-slate-500">{formatNumber(status.value)} · {percentage}%</span>
            </div>
            <div
              className="h-2.5 overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              aria-label={`${status.label} reservations`}
              aria-valuenow={percentage}
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <div className="h-full rounded-full bg-orange-500" style={{ width: `${percentage}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}


function TrendChart({ trend }) {
  if (!trend?.length) {
    return <p className="py-10 text-center text-sm text-slate-500">No trend data in this period.</p>
  }

  const maxValue = Math.max(
    ...trend.flatMap((item) => [
      Number(item.reservations || 0),
      Number(item.preorders || 0),
    ]),
    1,
  )

  return (
    <div className="mt-5 overflow-x-auto pb-2">
      <div className="mb-4 flex flex-wrap gap-4 text-xs font-semibold text-slate-600">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-orange-500" />
          Reservations
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-blue-500" />
          Preorders
        </span>
      </div>
      <div className="flex min-w-[520px] items-end gap-3" aria-label="Reservation trend chart">
        {trend.map((item) => {
          const reservations = Number(item.reservations || 0)
          const preorders = Number(item.preorders || 0)
          const reservationHeight = Math.max(
            (reservations / maxValue) * 140,
            reservations ? 8 : 2,
          )
          const preorderHeight = Math.max(
            (preorders / maxValue) * 140,
            preorders ? 8 : 2,
          )
          return (
            <div key={item.period} className="flex min-w-12 flex-1 flex-col items-center">
              <span className="mb-2 text-xs font-bold text-slate-700">
                {reservations}/{preorders}
              </span>
              <div className="flex w-full items-end justify-center gap-1">
                <div
                  className="w-2/5 rounded-t-md bg-gradient-to-t from-orange-600 to-amber-400"
                  style={{ height: `${reservationHeight}px` }}
                  title={`${item.period}: ${reservations} reservations`}
                />
                <div
                  className="w-2/5 rounded-t-md bg-gradient-to-t from-blue-600 to-sky-400"
                  style={{ height: `${preorderHeight}px` }}
                  title={`${item.period}: ${preorders} preorders`}
                />
              </div>
              <span className="mt-2 max-w-20 truncate text-[11px] text-slate-500">
                {item.period}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}


function PerformanceTable({ rows, scope }) {
  if (!rows?.length) {
    return <p className="p-10 text-center text-sm text-slate-500">No branch activity in this period.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {scope === 'admin' && <th className="px-5 py-3 font-bold">Restaurant</th>}
            <th className="px-5 py-3 font-bold">Branch</th>
            <th className="px-5 py-3 text-right font-bold">Bookings</th>
            <th className="px-5 py-3 text-right font-bold">Completed</th>
            <th className="px-5 py-3 text-right font-bold">Guests</th>
            <th className="px-5 py-3 text-right font-bold">Preorder value</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map((row, index) => (
            <tr key={row.branch_id || `${row.branch_name}-${index}`} className="hover:bg-orange-50/40">
              {scope === 'admin' && <td className="px-5 py-4 text-slate-600">{row.restaurant_name || '—'}</td>}
              <td className="px-5 py-4 font-semibold text-slate-900">{row.branch_name || row.name || '—'}</td>
              <td className="px-5 py-4 text-right text-slate-600">{formatNumber(row.reservations)}</td>
              <td className="px-5 py-4 text-right text-slate-600">{formatNumber(row.completed)}</td>
              <td className="px-5 py-4 text-right text-slate-600">{formatNumber(row.guests)}</td>
              <td className="px-5 py-4 text-right font-semibold text-slate-800">{formatMoney(row.preorder_value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}


function AnalyticsDashboard({ analytics, scope, scopeLabel }) {
  if (!analytics) {
    return (
      <section className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
        <h3 className="font-bold text-slate-800">No analytics available</h3>
        <p className="mt-2 text-sm text-slate-500">Choose another reporting period or add booking and preorder data.</p>
      </section>
    )
  }

  const reservations = analytics.reservations || {}
  const preorders = analytics.preorders || {}
  const reservationStatuses = reservations.statuses || {}
  const showBranchComparison = scope !== 'branch'

  return (
    <section className="mt-8" aria-labelledby={`${scope}-analytics-heading`}>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-600">Performance report</p>
          <h2 id={`${scope}-analytics-heading`} className="mt-1 text-2xl font-bold text-slate-900">Bookings and preorder analytics</h2>
          <p className="mt-1 text-sm text-slate-500">
            {analytics.period?.date_from && analytics.period?.date_to
              ? `${analytics.period.date_from} to ${analytics.period.date_to}`
              : 'Selected reporting period'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => downloadCsv(analytics, scopeLabel)}
          className="self-start rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-orange-400 hover:text-orange-700"
        >
          Export CSV
        </button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Reservations" value={formatNumber(reservations.total)} helper={`${formatNumber(reservations.guests)} reserved guests`} />
        <MetricCard label="Completion rate" value={`${Number(reservations.completion_rate || 0).toFixed(1)}%`} helper={`${formatNumber(reservationStatuses.COMPLETED)} completed`} tone="green" />
        <MetricCard label="Cancellation rate" value={`${Number(reservations.cancellation_rate || 0).toFixed(1)}%`} helper={`${formatNumber(reservationStatuses.CANCELLED)} cancelled`} tone="violet" />
        <MetricCard label="Preorder value" value={formatMoney(preorders.total_value)} helper={`${formatNumber(preorders.total)} food preorders`} tone="blue" />
        <MetricCard label="Amount collected" value={formatMoney(preorders.collected_amount)} helper="Recorded payments and advances, not verified gateway revenue" tone="green" />
        <MetricCard label="Outstanding" value={formatMoney(preorders.outstanding_amount)} helper="Remaining preorder amount" tone="orange" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Reservation status</h3>
          <p className="mt-1 text-sm text-slate-500">How reservations moved through the workflow.</p>
          <StatusBreakdown distribution={reservations.statuses} total={reservations.total} />
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Booking and preorder trend</h3>
          <p className="mt-1 text-sm text-slate-500">Compare both activity types across the selected period.</p>
          <TrendChart trend={analytics.trend} />
        </article>
      </div>

      {showBranchComparison && (
        <article className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-5">
            <h3 className="text-lg font-bold text-slate-900">Branch performance</h3>
            <p className="mt-1 text-sm text-slate-500">Compare bookings, guests and recorded preorder value.</p>
          </div>
          <PerformanceTable rows={analytics.branch_performance} scope={scope} />
        </article>
      )}

      <article className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-5">
          <h3 className="text-lg font-bold text-slate-900">Top-selling food items</h3>
          <p className="mt-1 text-sm text-slate-500">Ranked by ordered quantity in persisted preorders.</p>
        </div>
        {!analytics.top_items?.length ? (
          <p className="p-10 text-center text-sm text-slate-500">No preorder items in this period.</p>
        ) : (
          <ol className="divide-y divide-slate-100">
            {analytics.top_items.map((item, index) => (
              <li key={item.id || item.name || index} className="flex items-center justify-between gap-5 px-5 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">{index + 1}</span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{item.name || item.food_item_name}</p>
                    {item.category && <p className="text-xs text-slate-500">{item.category}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">{formatNumber(item.quantity)} sold</p>
                  <p className="text-xs text-slate-500">{formatMoney(item.value || item.total_value)}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </article>
    </section>
  )
}


export default AnalyticsDashboard
