import { useEffect, useMemo, useState } from 'react'

import {
  getPlatformAdminProfile,
  getPlatformAdminRestaurants,
  updatePlatformAdminRestaurantStatus,
} from '../../api/adminApi'
import AdminLayout from '../../components/admin/AdminLayout'


function AdminRestaurants() {
  const [restaurants, setRestaurants] = useState([])
  const [profile, setProfile] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [pendingRestaurant, setPendingRestaurant] = useState(null)

  async function loadRestaurants({ showLoader = true } = {}) {
    if (showLoader) {
      setIsLoading(true)
    }

    setErrorMessage('')

    try {
      const [restaurantData, adminProfile] = await Promise.all([
        getPlatformAdminRestaurants(),
        getPlatformAdminProfile(),
      ])

      setRestaurants(restaurantData)
      setProfile(adminProfile)
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      if (showLoader) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    let isCancelled = false

    Promise.all([
      getPlatformAdminRestaurants(),
      getPlatformAdminProfile(),
    ])
      .then(([restaurantData, adminProfile]) => {
        if (!isCancelled) {
          setRestaurants(restaurantData)
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

  const filteredRestaurants = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return restaurants.filter((restaurant) => {
      const matchesSearch = (
        !normalizedSearch
        || restaurant.name.toLowerCase().includes(normalizedSearch)
        || restaurant.cuisine.toLowerCase().includes(normalizedSearch)
      )
      const matchesStatus = (
        statusFilter === 'ALL'
        || (statusFilter === 'ACTIVE' && restaurant.is_active)
        || (statusFilter === 'INACTIVE' && !restaurant.is_active)
      )

      return matchesSearch && matchesStatus
    })
  }, [restaurants, searchTerm, statusFilter])

  const summary = useMemo(() => ({
    total: restaurants.length,
    active: restaurants.filter((restaurant) => restaurant.is_active).length,
    branches: restaurants.reduce(
      (total, restaurant) => total + restaurant.branch_count,
      0,
    ),
    managers: restaurants.reduce(
      (total, restaurant) => total + restaurant.active_manager_count,
      0,
    ),
  }), [restaurants])

  async function confirmStatusChange() {
    if (!pendingRestaurant) {
      return
    }

    const nextStatus = !pendingRestaurant.is_active

    setIsSaving(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      await updatePlatformAdminRestaurantStatus(
        pendingRestaurant.id,
        nextStatus,
      )
      setSuccessMessage(
        `${pendingRestaurant.name} was ${nextStatus ? 'activated' : 'deactivated'}.`,
      )
      setPendingRestaurant(null)
      await loadRestaurants({ showLoader: false })
    } catch (error) {
      setErrorMessage(error.message)
      setPendingRestaurant(null)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AdminLayout profile={profile}>
      <header className="border-b border-slate-200 bg-white px-6 py-5 sm:px-9">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600">
          Platform administration
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Restaurant Oversight
        </h1>
      </header>

      <main className="px-6 py-8 sm:px-9 sm:py-10">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Restaurant operations
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Review every registered restaurant and control whether it is
              available across the Khabo-Koi platform.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadRestaurants()}
            disabled={isLoading}
            className="self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-wait disabled:opacity-60 lg:self-auto"
          >
            {isLoading ? 'Refreshing...' : 'Refresh restaurants'}
          </button>
        </div>

        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['Registered restaurants', summary.total, 'bg-blue-50 text-blue-700'],
            ['Active restaurants', summary.active, 'bg-emerald-50 text-emerald-700'],
            ['Restaurant branches', summary.branches, 'bg-orange-50 text-orange-700'],
            ['Active Manager access', summary.managers, 'bg-violet-50 text-violet-700'],
          ].map(([label, value, accent]) => (
            <article
              key={label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${accent}`}>
                Live
              </span>
              <p className="mt-4 text-3xl font-bold text-slate-900">
                {isLoading ? '—' : value}
              </p>
              <p className="mt-1 text-sm text-slate-500">{label}</p>
            </article>
          ))}
        </section>

        {(errorMessage || successMessage) && (
          <div
            role="status"
            className={`mt-6 rounded-xl border px-4 py-3 text-sm ${errorMessage
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}
          >
            {errorMessage || successMessage}
          </div>
        )}

        <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-4 border-b border-slate-200 p-5 md:grid-cols-[1fr_200px]">
            <label>
              <span className="sr-only">Search restaurants</span>
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search restaurant or cuisine"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:bg-white"
              />
            </label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-orange-400 focus:bg-white"
            >
              <option value="ALL">All restaurants</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-sm text-slate-500">
              Loading restaurant operations...
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-semibold text-slate-800">
                No restaurants match these filters
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Try another restaurant name, cuisine, or status.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredRestaurants.map((restaurant) => (
                <article
                  key={restaurant.id}
                  className="grid gap-5 p-5 hover:bg-slate-50/60 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
                >
                  <div className="flex min-w-0 items-start gap-4">
                    {restaurant.image_url ? (
                      <img
                        src={restaurant.image_url}
                        alt=""
                        className="h-16 w-16 flex-none rounded-xl object-cover"
                      />
                    ) : (
                      <span className="flex h-16 w-16 flex-none items-center justify-center rounded-xl bg-slate-900 text-xl font-bold text-white">
                        {restaurant.name.slice(0, 1).toUpperCase()}
                      </span>
                    )}

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-lg font-bold text-slate-900">
                          {restaurant.name}
                        </h3>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${restaurant.is_active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700'
                        }`}
                        >
                          {restaurant.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {restaurant.cuisine || 'Cuisine not provided'}
                        {' · '}Rating {restaurant.rating}
                      </p>
                      <p className="mt-3 text-xs font-medium text-slate-500">
                        {restaurant.branch_count} branches
                        {' · '}{restaurant.food_item_count} food items
                        {' · '}{restaurant.active_manager_count} active Managers
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPendingRestaurant(restaurant)}
                    className={`justify-self-start rounded-xl border px-4 py-2.5 text-sm font-bold transition lg:justify-self-end ${restaurant.is_active
                      ? 'border-red-200 text-red-700 hover:bg-red-50'
                      : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    {restaurant.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <p className="mt-4 text-xs leading-5 text-slate-400">
          Deactivating a restaurant hides it from customers and disables its
          Manager assignments. Reactivation does not restore old Manager access.
        </p>
      </main>

      {pendingRestaurant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-5 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="restaurant-confirm-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
              Restaurant availability
            </p>
            <h2
              id="restaurant-confirm-title"
              className="mt-3 text-xl font-bold text-slate-900"
            >
              {pendingRestaurant.is_active
                ? 'Deactivate this restaurant?'
                : 'Activate this restaurant?'}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {pendingRestaurant.is_active
                ? `${pendingRestaurant.name} will disappear from the public catalogue, and active Manager assignments will be disabled.`
                : `${pendingRestaurant.name} will return to the public catalogue. Manager access must still be restored separately.`}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingRestaurant(null)}
                disabled={isSaving}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmStatusChange}
                disabled={isSaving}
                className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600 disabled:cursor-wait disabled:opacity-60"
              >
                {isSaving
                  ? 'Saving...'
                  : pendingRestaurant.is_active
                    ? 'Deactivate'
                    : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}


export default AdminRestaurants
