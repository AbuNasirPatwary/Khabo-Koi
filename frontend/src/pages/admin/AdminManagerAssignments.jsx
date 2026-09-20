import { useEffect, useMemo, useState } from 'react'

import {
  createPlatformAdminManagerAssignment,
  getPlatformAdminManagerAssignments,
  getPlatformAdminProfile,
  getPlatformAdminUsers,
  getRestaurantsForAdminAssignment,
  updatePlatformAdminManagerAssignment,
} from '../../api/adminApi'
import AdminConfirmDialog from '../../components/admin/AdminConfirmDialog'
import AdminLayout from '../../components/admin/AdminLayout'


function AdminManagerAssignments() {
  const [assignments, setAssignments] = useState([])
  const [users, setUsers] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [profile, setProfile] = useState(null)
  const [selectedManagerId, setSelectedManagerId] = useState('')
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [pendingAssignment, setPendingAssignment] = useState(null)
  const hasInitialLoadError = Boolean(errorMessage && assignments.length === 0)

  async function loadPageData({ showLoader = true } = {}) {
    if (showLoader) {
      setIsLoading(true)
    }

    setErrorMessage('')

    try {
      const [
        assignmentData,
        userData,
        restaurantData,
        adminProfile,
      ] = await Promise.all([
        getPlatformAdminManagerAssignments(),
        getPlatformAdminUsers(),
        getRestaurantsForAdminAssignment(),
        getPlatformAdminProfile(),
      ])

      setAssignments(assignmentData)
      setUsers(userData)
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

    // Load every selection source together. An assignment should never be
    // offered for a stale Manager or restaurant that the Admin cannot see.
    Promise.all([
      getPlatformAdminManagerAssignments(),
      getPlatformAdminUsers(),
      getRestaurantsForAdminAssignment(),
      getPlatformAdminProfile(),
    ])
      .then(([
        assignmentData,
        userData,
        restaurantData,
        adminProfile,
      ]) => {
        if (!isCancelled) {
          setAssignments(assignmentData)
          setUsers(userData)
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

  const availableManagers = useMemo(() => (
    users.filter((user) => (
      user.role === 'RESTAURANT_MANAGER'
      && user.is_active
    ))
  ), [users])

  const filteredAssignments = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return assignments.filter((assignment) => {
      const matchesSearch = (
        !normalizedSearch
        || assignment.user.username.toLowerCase().includes(normalizedSearch)
        || assignment.user.email.toLowerCase().includes(normalizedSearch)
        || assignment.restaurant.name.toLowerCase().includes(normalizedSearch)
      )
      const matchesStatus = (
        statusFilter === 'ALL'
        || (statusFilter === 'ACTIVE' && assignment.is_active)
        || (statusFilter === 'INACTIVE' && !assignment.is_active)
      )

      return matchesSearch && matchesStatus
    })
  }, [assignments, searchTerm, statusFilter])

  const summary = useMemo(() => ({
    total: assignments.length,
    active: assignments.filter((assignment) => assignment.is_active).length,
    managers: new Set(
      assignments
        .filter((assignment) => assignment.is_active)
        .map((assignment) => assignment.user.id),
    ).size,
    restaurants: new Set(
      assignments
        .filter((assignment) => assignment.is_active)
        .map((assignment) => assignment.restaurant.id),
    ).size,
  }), [assignments])

  async function handleCreateAssignment(event) {
    event.preventDefault()

    if (!selectedManagerId || !selectedRestaurantId) {
      setErrorMessage('Choose both a Restaurant Manager and a restaurant.')
      return
    }

    setIsSaving(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      await createPlatformAdminManagerAssignment(
        Number(selectedManagerId),
        Number(selectedRestaurantId),
      )
      setSelectedManagerId('')
      setSelectedRestaurantId('')
      setSuccessMessage('Restaurant access was assigned successfully.')
      await loadPageData({ showLoader: false })
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  async function confirmStatusChange() {
    if (!pendingAssignment) {
      return
    }

    setIsSaving(true)
    setErrorMessage('')
    setSuccessMessage('')

    const nextStatus = !pendingAssignment.is_active

    try {
      await updatePlatformAdminManagerAssignment(
        pendingAssignment.id,
        nextStatus,
      )
      setSuccessMessage(
        `Manager access was ${nextStatus ? 'reactivated' : 'deactivated'}.`,
      )
      setPendingAssignment(null)
      await loadPageData({ showLoader: false })
    } catch (error) {
      setErrorMessage(error.message)
      setPendingAssignment(null)
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
          Manager Access
        </h1>
      </header>

      <main className="px-6 py-8 sm:px-9 sm:py-10">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Restaurant assignments
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Give active Restaurant Managers access to the restaurants they
              operate. Deactivated records remain visible as access history.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadPageData()}
            disabled={isLoading}
            className="self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-wait disabled:opacity-60 lg:self-auto"
          >
            {isLoading ? 'Refreshing...' : 'Refresh access'}
          </button>
        </div>

        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['Assignment records', summary.total],
            ['Active assignments', summary.active],
            ['Assigned Managers', summary.managers],
            ['Managed restaurants', summary.restaurants],
          ].map(([label, value]) => (
            <article
              key={label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <span className="inline-flex rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-700">
                Live
              </span>
              <p className="mt-4 text-3xl font-bold text-slate-900">
                {isLoading ? '—' : hasInitialLoadError ? 'Unavailable' : value}
              </p>
              <p className="mt-1 text-sm text-slate-500">{label}</p>
            </article>
          ))}
        </section>

        {(errorMessage || successMessage) && (
          <div
            role={errorMessage ? 'alert' : 'status'}
            className={`mt-6 rounded-xl border px-4 py-3 text-sm ${errorMessage
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}
          >
            {errorMessage || successMessage}
          </div>
        )}

        <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-600">
              New access
            </p>
            <h3 className="mt-2 text-xl font-bold text-slate-900">
              Assign a Manager
            </h3>
          </div>

          <form
            onSubmit={handleCreateAssignment}
            className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-end"
          >
            <label className="min-w-0 grid gap-2 text-sm font-semibold text-slate-700">
              Restaurant Manager
              <select
                value={selectedManagerId}
                onChange={(event) => setSelectedManagerId(event.target.value)}
                disabled={isLoading || availableManagers.length === 0}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none focus:border-orange-400 focus:bg-white"
              >
                <option value="">
                  {availableManagers.length > 0
                    ? 'Choose a Manager'
                    : 'No active Restaurant Managers'}
                </option>
                {availableManagers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.username} — {manager.email || 'no email'}
                  </option>
                ))}
              </select>
            </label>

            <label className="min-w-0 grid gap-2 text-sm font-semibold text-slate-700">
              Restaurant
              <select
                value={selectedRestaurantId}
                onChange={(event) => setSelectedRestaurantId(event.target.value)}
                disabled={isLoading || restaurants.length === 0}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none focus:border-orange-400 focus:bg-white"
              >
                <option value="">
                  {restaurants.length > 0
                    ? 'Choose a restaurant'
                    : 'No restaurants available'}
                </option>
                {restaurants.map((restaurant) => (
                  <option key={restaurant.id} value={restaurant.id}>
                    {restaurant.name}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              disabled={isSaving || isLoading}
              className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? 'Assigning...' : 'Assign access'}
            </button>
          </form>
        </section>

        <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-4 border-b border-slate-200 p-5 md:grid-cols-[1fr_200px]">
            <label>
              <span className="sr-only">Search assignments</span>
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search Manager, email, or restaurant"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:bg-white"
              />
            </label>
            <select
              aria-label="Filter Manager assignments by status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-orange-400 focus:bg-white"
            >
              <option value="ALL">All access</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-sm text-slate-500">
              Loading Manager assignments...
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-semibold text-slate-800">
                {hasInitialLoadError
                  ? 'Manager access data is unavailable'
                  : 'No Manager assignments found'}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {hasInitialLoadError
                  ? 'Use Refresh access to try loading the records again.'
                  : 'Create an assignment above or change the current filters.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Manager</th>
                    <th className="px-5 py-4 font-semibold">Restaurant</th>
                    <th className="px-5 py-4 font-semibold">Assigned by</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAssignments.map((assignment) => (
                    <tr key={assignment.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {assignment.user.username}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {assignment.user.email || 'No email provided'}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-slate-700">
                        {assignment.restaurant.name}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500">
                        {assignment.assigned_by?.username || 'System'}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${assignment.is_active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                        }`}
                        >
                          {assignment.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setPendingAssignment(assignment)}
                          disabled={(
                            !assignment.is_active
                            && !assignment.restaurant.is_active
                          )}
                          title={(
                            !assignment.is_active
                            && !assignment.restaurant.is_active
                          )
                            ? 'Activate the restaurant before restoring Manager access.'
                            : undefined}
                          className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${assignment.is_active
                            ? 'border-red-200 text-red-700 hover:bg-red-50'
                            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400'
                          }`}
                        >
                          {assignment.is_active
                            ? 'Deactivate'
                            : assignment.restaurant.is_active
                              ? 'Reactivate'
                              : 'Restaurant inactive'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {pendingAssignment && (
        <AdminConfirmDialog
          eyebrow="Restaurant access"
          title={pendingAssignment.is_active
            ? 'Deactivate Manager access?'
            : 'Reactivate Manager access?'}
          description={`${pendingAssignment.user.username} will ${pendingAssignment.is_active
            ? 'lose'
            : 'regain'} access to ${pendingAssignment.restaurant.name}.`}
          confirmLabel={pendingAssignment.is_active
            ? 'Deactivate'
            : 'Reactivate'}
          isSaving={isSaving}
          onCancel={() => setPendingAssignment(null)}
          onConfirm={confirmStatusChange}
        />
      )}
    </AdminLayout>
  )
}


export default AdminManagerAssignments
