import { useEffect, useState } from 'react'

import { getRestaurantManagerProfile } from '../../api/managerApi'
import ManagerLayout from '../../components/manager/ManagerLayout'


function ManagerDashboard() {
  const [profile, setProfile] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  async function loadProfile() {
    setIsLoading(true)
    setErrorMessage('')

    try {
      setProfile(await getRestaurantManagerProfile())
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isCancelled = false

    getRestaurantManagerProfile()
      .then((managerProfile) => {
        if (!isCancelled) {
          setProfile(managerProfile)
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

  const assignedRestaurants = profile?.assigned_restaurants || []

  return (
    <ManagerLayout profile={profile}>
      <header className="border-b border-slate-200 bg-white px-6 py-5 sm:px-9">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600">
          Restaurant management
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Manager Dashboard
        </h1>
      </header>

      <main
        id="manager-main"
        tabIndex="-1"
        className="px-6 py-8 sm:px-9 sm:py-10"
      >
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Welcome, {profile?.username || 'Manager'}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              This workspace displays only restaurants currently assigned to
              your authenticated Manager account.
            </p>
          </div>
          <button
            type="button"
            onClick={loadProfile}
            disabled={isLoading}
            className="self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-wait disabled:opacity-60"
          >
            {isLoading ? 'Refreshing...' : 'Refresh access'}
          </button>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {errorMessage}
          </div>
        )}

        <section className="mt-7 grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Active restaurant assignments
            </p>
            <p className="mt-3 text-4xl font-bold text-slate-900">
              {isLoading ? '—' : errorMessage ? 'Unavailable' : assignedRestaurants.length}
            </p>
            <p className="mt-4 text-xs leading-5 text-slate-400">
              Access is controlled by Platform Admin assignments.
            </p>
          </article>

          <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
              Verified identity
            </p>
            <p className="mt-3 text-lg font-bold text-slate-900">
              Restaurant Manager
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Customer and Platform Admin accounts cannot enter this portal.
            </p>
          </article>
        </section>

        <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h3 className="text-lg font-bold text-slate-900">
              Your assigned restaurants
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Restaurant operations will be enabled here as their real APIs
              become available.
            </p>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-sm text-slate-500">
              Loading assigned restaurants...
            </div>
          ) : assignedRestaurants.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-semibold text-slate-800">
                No active restaurant assignment
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Ask a Platform Admin to assign this Manager account to a
                restaurant before beginning operations.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 p-6 sm:grid-cols-2 xl:grid-cols-3">
              {assignedRestaurants.map((restaurant) => (
                <article
                  key={restaurant.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-5"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 font-bold text-orange-700">
                    {restaurant.name.slice(0, 1).toUpperCase()}
                  </span>
                  <h4 className="mt-4 font-bold text-slate-900">
                    {restaurant.name}
                  </h4>
                  <p className="mt-1 text-xs text-slate-500">
                    Restaurant ID #{restaurant.id}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </ManagerLayout>
  )
}


export default ManagerDashboard
