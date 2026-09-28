import { useEffect, useState } from 'react'

import { getPlatformAdminDashboard, getPlatformAdminProfile } from '../../api/adminApi'
import AdminLayout from '../../components/admin/AdminLayout'
import AnalyticsDashboard from '../../components/analytics/AnalyticsDashboard'
import AnalyticsDateFilter from '../../components/analytics/AnalyticsDateFilter'

const defaultFilters = { period: '30d', startDate: '', endDate: '' }
const metricDefinitions = [
  ['total_restaurants', 'Total restaurants', 'All registered restaurants'],
  ['active_restaurants', 'Active restaurants', 'Currently active on the platform'],
  ['total_users', 'Total users', 'All customer and staff accounts'],
  ['active_users', 'Active users', 'Accounts currently permitted to sign in'],
]

function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null)
  const [profile, setProfile] = useState(null)
  const [filters, setFilters] = useState(defaultFilters)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  async function loadDashboard(activeFilters = filters) {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const [metrics, adminProfile] = await Promise.all([
        getPlatformAdminDashboard(activeFilters),
        getPlatformAdminProfile(),
      ])
      setDashboardData(metrics)
      setProfile(adminProfile)
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isCancelled = false
    Promise.all([getPlatformAdminDashboard(defaultFilters), getPlatformAdminProfile()])
      .then(([metrics, adminProfile]) => {
        if (!isCancelled) {
          setDashboardData(metrics)
          setProfile(adminProfile)
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

  return (
    <AdminLayout profile={profile}>
      <header className="border-b border-slate-200 bg-white px-6 py-5 sm:px-9">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600">Platform intelligence</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-600">
            Signed in as <strong className="text-slate-900">{profile?.username || 'Platform Admin'}</strong>
          </div>
        </div>
      </header>

      <main className="px-6 py-8 sm:px-9 sm:py-10">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Platform at a glance</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Monitor platform growth, compare restaurants and branches, and review persisted booking and preorder activity.
        </p>

        <div className="mt-6">
          <AnalyticsDateFilter filters={filters} onChange={setFilters} onApply={() => loadDashboard(filters)} isLoading={isLoading} />
        </div>

        {errorMessage && (
          <div role="alert" className="mt-6 flex flex-col justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 sm:flex-row sm:items-center">
            <span>{errorMessage}</span>
            <button type="button" onClick={() => loadDashboard(filters)} className="font-bold underline underline-offset-4">Try again</button>
          </div>
        )}

        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Platform totals">
          {metricDefinitions.map(([key, label, helper]) => (
            <article key={key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">{label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{isLoading ? '—' : Number(dashboardData?.[key] || 0).toLocaleString()}</p>
              <p className="mt-3 text-xs text-slate-400">{helper}</p>
            </article>
          ))}
        </section>

        {!errorMessage && !isLoading && <AnalyticsDashboard analytics={dashboardData?.analytics} scope="admin" scopeLabel="Platform Admin" />}
        {isLoading && <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500" role="status">Loading platform analytics…</div>}
      </main>
    </AdminLayout>
  )
}

export default AdminDashboard
