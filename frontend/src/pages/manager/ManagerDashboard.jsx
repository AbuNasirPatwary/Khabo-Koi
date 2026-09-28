import { useEffect, useState } from 'react'

import { getManagerDashboard, getRestaurantManagerProfile } from '../../api/managerApi'
import AnalyticsDashboard from '../../components/analytics/AnalyticsDashboard'
import AnalyticsDateFilter from '../../components/analytics/AnalyticsDateFilter'
import ManagerLayout from '../../components/manager/ManagerLayout'

const defaultFilters = { period: '30d', startDate: '', endDate: '' }

function ManagerDashboard() {
  const [profile, setProfile] = useState(null)
  const [summary, setSummary] = useState(null)
  const [filters, setFilters] = useState(defaultFilters)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  async function loadDashboard(activeFilters = filters) {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const [managerProfile, dashboardSummary] = await Promise.all([
        getRestaurantManagerProfile(),
        getManagerDashboard(activeFilters),
      ])
      setProfile(managerProfile)
      setSummary(dashboardSummary)
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isCancelled = false
    Promise.all([getRestaurantManagerProfile(), getManagerDashboard(defaultFilters)])
      .then(([managerProfile, dashboardSummary]) => {
        if (!isCancelled) {
          setProfile(managerProfile)
          setSummary(dashboardSummary)
        }
      })
      .catch((error) => {
        if (!isCancelled) setErrorMessage(error.message)
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false)
      })
    return () => { isCancelled = true }
  }, [])

  const assignedRestaurants = profile?.assigned_restaurants || []

  return (
    <ManagerLayout profile={profile}>
      <header className="border-b border-slate-200 bg-white px-6 py-5 sm:px-9">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600">Restaurant performance</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Manager Dashboard</h1>
      </header>
      <main id="manager-main" tabIndex="-1" className="px-6 py-8 sm:px-9 sm:py-10">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Welcome, {profile?.username || 'Manager'}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Compare branches and monitor bookings, guests, menu demand and recorded preorder value across your assigned restaurants.
        </p>

        <div className="mt-6"><AnalyticsDateFilter filters={filters} onChange={setFilters} onApply={() => loadDashboard(filters)} isLoading={isLoading} /></div>

        {errorMessage && (
          <div role="alert" className="mt-6 flex flex-col justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center">
            <span>{errorMessage}</span>
            <button type="button" onClick={() => loadDashboard(filters)} className="font-bold underline underline-offset-4">Try again</button>
          </div>
        )}

        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Manager operational totals">
          {[
            ['Assigned restaurants', assignedRestaurants.length, 'Active Platform Admin assignments'],
            ['Active branches', summary?.branches?.active, `${summary?.branches?.total || 0} total branches`],
            ['Active tables', summary?.tables?.active, `${summary?.tables?.total || 0} total tables`],
            ['Available menu items', summary?.menu_items?.available, `${summary?.menu_items?.total || 0} total items`],
          ].map(([label, value, helper]) => (
            <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">{label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{isLoading ? '—' : value || 0}</p>
              <p className="mt-3 text-xs text-slate-400">{helper}</p>
            </article>
          ))}
        </section>

        {!errorMessage && !isLoading && <AnalyticsDashboard analytics={summary?.analytics} scope="manager" scopeLabel="Restaurant Manager" />}
        {isLoading && <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500" role="status">Loading restaurant analytics…</div>}
        {!isLoading && assignedRestaurants.length === 0 && (
          <section className="mt-7 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <h3 className="font-bold text-slate-800">No active restaurant assignment</h3>
            <p className="mt-2 text-sm text-slate-500">Ask a Platform Admin to assign this account before beginning operations.</p>
          </section>
        )}
      </main>
    </ManagerLayout>
  )
}

export default ManagerDashboard
