import { useEffect, useState } from 'react'

import {
  getPlatformAdminDashboard,
  getPlatformAdminProfile,
} from '../../api/adminApi'
import AdminLayout from '../../components/admin/AdminLayout'


const metricDefinitions = [
  {
    key: 'total_restaurants',
    label: 'Total Restaurants',
    symbol: 'R',
    accent: 'bg-orange-100 text-orange-700',
    helper: 'All registered restaurant records',
  },
  {
    key: 'active_restaurants',
    label: 'Active Restaurants',
    symbol: 'A',
    accent: 'bg-emerald-100 text-emerald-700',
    helper: 'Currently visible and active',
  },
  {
    key: 'total_users',
    label: 'Total Users',
    symbol: 'U',
    accent: 'bg-blue-100 text-blue-700',
    helper: 'All platform identities',
  },
  {
    key: 'active_users',
    label: 'Active Users',
    symbol: '✓',
    accent: 'bg-teal-100 text-teal-700',
    helper: 'Accounts permitted to sign in',
  },
  {
    key: 'total_bookings',
    label: 'Total Bookings',
    symbol: 'B',
    accent: 'bg-violet-100 text-violet-700',
    helper: 'Reservations stored in PostgreSQL',
  },
  {
    key: 'pending_bookings',
    label: 'Pending Bookings',
    symbol: 'P',
    accent: 'bg-amber-100 text-amber-700',
    helper: 'Reservations awaiting action',
  },
]


function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null)
  const [profile, setProfile] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const hasInitialLoadError = Boolean(errorMessage && !dashboardData)

  async function handleRefresh() {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const [metrics, adminProfile] = await Promise.all([
        getPlatformAdminDashboard(),
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

    Promise.all([
      getPlatformAdminDashboard(),
      getPlatformAdminProfile(),
    ])
      .then(([metrics, adminProfile]) => {
        if (!isCancelled) {
          setDashboardData(metrics)
          setProfile(adminProfile)
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          setErrorMessage(error.message)
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [])

  return (
    <AdminLayout profile={profile}>
      <header className="border-b border-slate-200 bg-white px-6 py-5 sm:px-9">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600">
              Platform overview
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              Admin Dashboard
            </h1>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-600">
            Signed in as{' '}
            <strong className="text-slate-900">
              {profile?.username || 'Platform Admin'}
            </strong>
          </div>
        </div>
      </header>

      <main className="px-6 py-8 sm:px-9 sm:py-10">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Platform at a glance
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              These values come directly from the Khabo-Koi database and
              update whenever the page is refreshed.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-wait disabled:opacity-60 md:self-auto"
          >
            {isLoading ? 'Refreshing...' : 'Refresh metrics'}
          </button>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mt-7 flex flex-col justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 sm:flex-row sm:items-center"
          >
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={handleRefresh}
              className="font-bold text-red-800 underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        )}

        <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {metricDefinitions.map((metric) => (
            <article
              key={metric.key}
              className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    {metric.label}
                  </p>
                  <p className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
                    {isLoading
                      ? '—'
                      : hasInitialLoadError
                        ? 'Unavailable'
                        : dashboardData[metric.key].toLocaleString()}
                  </p>
                </div>

                <span className={`flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold ${metric.accent}`}>
                  {metric.symbol}
                </span>
              </div>

              <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-400">
                {metric.helper}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <article className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Administration progress
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Backend capabilities currently connected to real data.
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                Secure
              </span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                'Role-based Admin authorization',
                'User role management',
                'Account suspension and reactivation',
                'Restaurant Manager assignments',
              ].map((capability) => (
                <div
                  key={capability}
                  className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700"
                >
                  <span className="text-emerald-600">✓</span>
                  {capability}
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-orange-200 bg-orange-50 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-700">
              Data integrity
            </p>
            <h3 className="mt-3 text-lg font-bold text-slate-900">
              Prototype-only metrics stay hidden
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Payment volume and restaurant approvals will appear only after
              their backend models and business rules are implemented.
            </p>
          </article>
        </section>
      </main>
    </AdminLayout>
  )
}


export default AdminDashboard
