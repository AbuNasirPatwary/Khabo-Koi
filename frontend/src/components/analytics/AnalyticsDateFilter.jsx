import { ANALYTICS_PERIODS } from '../../utils/analytics'


function AnalyticsDateFilter({ filters, onChange, onApply, isLoading }) {
  const isCustom = filters.period === 'custom'
  const customRangeInvalid = isCustom && (
    !filters.startDate
    || !filters.endDate
    || filters.startDate > filters.endDate
  )

  return (
    <form
      className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-end"
      onSubmit={(event) => {
        event.preventDefault()
        if (!customRangeInvalid) onApply()
      }}
    >
      <label className="flex-1 text-sm font-semibold text-slate-700">
        Reporting period
        <select
          value={filters.period}
          onChange={(event) => onChange({
            ...filters,
            period: event.target.value,
          })}
          className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal text-slate-800 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
        >
          {ANALYTICS_PERIODS.map((period) => (
            <option key={period.value} value={period.value}>{period.label}</option>
          ))}
        </select>
      </label>

      {isCustom && (
        <>
          <label className="flex-1 text-sm font-semibold text-slate-700">
            Start date
            <input
              type="date"
              value={filters.startDate}
              max={filters.endDate || undefined}
              onChange={(event) => onChange({
                ...filters,
                startDate: event.target.value,
              })}
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-slate-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              required
            />
          </label>
          <label className="flex-1 text-sm font-semibold text-slate-700">
            End date
            <input
              type="date"
              value={filters.endDate}
              min={filters.startDate || undefined}
              onChange={(event) => onChange({
                ...filters,
                endDate: event.target.value,
              })}
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-slate-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              required
            />
          </label>
        </>
      )}

      <button
        type="submit"
        disabled={isLoading || customRangeInvalid}
        className="rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? 'Updating…' : 'Apply period'}
      </button>
    </form>
  )
}


export default AnalyticsDateFilter
