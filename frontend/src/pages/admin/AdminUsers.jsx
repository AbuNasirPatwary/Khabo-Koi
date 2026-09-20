import { useEffect, useMemo, useState } from 'react'

import {
  getPlatformAdminProfile,
  getPlatformAdminUsers,
  updatePlatformAdminAccountStatus,
  updatePlatformAdminUserRole,
} from '../../api/adminApi'
import AdminLayout from '../../components/admin/AdminLayout'


// These values deliberately mirror UserProfile.Role in Django. The readable
// labels are presentation-only; the API always receives the stable value.
const roleOptions = [
  {
    value: 'CUSTOMER',
    label: 'Customer',
  },
  {
    value: 'RESTAURANT_MANAGER',
    label: 'Restaurant Manager',
  },
  {
    value: 'BRANCH_MANAGER',
    label: 'Branch Manager',
  },
  {
    value: 'ADMIN',
    label: 'Platform Admin',
  },
]


function getRoleLabel(role) {
  return (
    roleOptions.find((option) => option.value === role)?.label
    || role
    || 'Unassigned'
  )
}


function AdminUsers() {
  const [users, setUsers] = useState([])
  const [profile, setProfile] = useState(null)
  const [draftRoles, setDraftRoles] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [pendingAction, setPendingAction] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  async function loadUsers() {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const [userData, adminProfile] = await Promise.all([
        getPlatformAdminUsers(),
        getPlatformAdminProfile(),
      ])

      setUsers(userData)
      setProfile(adminProfile)
      setDraftRoles(
        Object.fromEntries(
          userData.map((user) => [
            user.id,
            user.role,
          ]),
        ),
      )
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isCancelled = false

    // Fetch identity and user data together so the table can immediately
    // identify the signed-in Admin and disable unsafe self-management actions.
    Promise.all([
      getPlatformAdminUsers(),
      getPlatformAdminProfile(),
    ])
      .then(([userData, adminProfile]) => {
        if (!isCancelled) {
          setUsers(userData)
          setProfile(adminProfile)
          setDraftRoles(
            Object.fromEntries(
              userData.map((user) => [
                user.id,
                user.role,
              ]),
            ),
          )
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

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return users.filter((user) => {
      const matchesSearch = (
        !normalizedSearch
        || user.username.toLowerCase().includes(normalizedSearch)
        || user.email.toLowerCase().includes(normalizedSearch)
      )

      const matchesRole = (
        roleFilter === 'ALL'
        || user.role === roleFilter
      )

      const matchesStatus = (
        statusFilter === 'ALL'
        || (
          statusFilter === 'ACTIVE'
          && user.is_active
        )
        || (
          statusFilter === 'INACTIVE'
          && !user.is_active
        )
      )

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [
    roleFilter,
    searchTerm,
    statusFilter,
    users,
  ])

  const summary = useMemo(() => ({
    total: users.length,
    managers: users.filter(
      (user) => user.role === 'RESTAURANT_MANAGER',
    ).length,
    admins: users.filter(
      (user) => user.role === 'ADMIN',
    ).length,
    inactive: users.filter(
      (user) => !user.is_active,
    ).length,
  }), [users])

  function requestRoleChange(user) {
    const nextRole = draftRoles[user.id]

    if (nextRole === user.role) {
      return
    }

    setPendingAction({
      type: 'role',
      user,
      nextRole,
      title: 'Confirm role change',
      description: (
        `Change ${user.username} from ${getRoleLabel(user.role)} `
        + `to ${getRoleLabel(nextRole)}? This changes their authorization.`
      ),
      confirmLabel: 'Change role',
    })
  }

  function requestStatusChange(user) {
    const nextStatus = !user.is_active

    setPendingAction({
      type: 'status',
      user,
      nextStatus,
      title: nextStatus ? 'Reactivate account' : 'Suspend account',
      description: nextStatus
        ? `Reactivate ${user.username}? Previous restaurant assignments will remain inactive.`
        : `Suspend ${user.username}? Active restaurant assignments will also be deactivated.`,
      confirmLabel: nextStatus ? 'Reactivate' : 'Suspend',
    })
  }

  async function confirmAction() {
    if (!pendingAction) {
      return
    }

    setIsSaving(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      if (pendingAction.type === 'role') {
        await updatePlatformAdminUserRole(
          pendingAction.user.id,
          pendingAction.nextRole,
        )

        setSuccessMessage(
          `${pendingAction.user.username}'s role was updated.`,
        )
      } else {
        await updatePlatformAdminAccountStatus(
          pendingAction.user.id,
          pendingAction.nextStatus,
        )

        setSuccessMessage(
          `${pendingAction.user.username}'s account was ${pendingAction.nextStatus ? 'reactivated' : 'suspended'}.`,
        )
      }

      setPendingAction(null)
      await loadUsers()
    } catch (error) {
      setErrorMessage(error.message)
      setPendingAction(null)
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
          User Management
        </h1>
      </header>

      <main className="px-6 py-8 sm:px-9 sm:py-10">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Users and access
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Search accounts, manage product roles, and suspend or reactivate
              access. Every change is validated again by Django.
            </p>
          </div>

          <button
            type="button"
            onClick={loadUsers}
            disabled={isLoading}
            className="self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-wait disabled:opacity-60 lg:self-auto"
          >
            {isLoading ? 'Refreshing...' : 'Refresh users'}
          </button>
        </div>

        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['Total users', summary.total, 'bg-blue-100 text-blue-700'],
            ['Restaurant Managers', summary.managers, 'bg-orange-100 text-orange-700'],
            ['Platform Admins', summary.admins, 'bg-violet-100 text-violet-700'],
            ['Suspended accounts', summary.inactive, 'bg-red-100 text-red-700'],
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
              <p className="mt-1 text-sm text-slate-500">
                {label}
              </p>
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

        <section className="mt-7 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-4 border-b border-slate-200 p-5 md:grid-cols-[1fr_220px_180px]">
            <label className="relative">
              <span className="sr-only">Search users</span>
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by username or email"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
              />
            </label>

            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-orange-400 focus:bg-white"
            >
              <option value="ALL">All roles</option>
              {roleOptions.map((role) => (
                <option
                  key={role.value}
                  value={role.value}
                >
                  {role.label}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-orange-400 focus:bg-white"
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Suspended</option>
            </select>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-sm text-slate-500">
              Loading platform users...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-semibold text-slate-800">
                No users match these filters
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Try a different username, role, or account status.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[940px] w-full text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">User</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold">Product role</th>
                    <th className="px-5 py-4 font-semibold">Joined</th>
                    <th className="px-5 py-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((user) => {
                    const isCurrentAdmin = user.id === profile?.id
                    const hasRoleChange = draftRoles[user.id] !== user.role

                    return (
                      <tr
                        key={user.id}
                        className="align-middle hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold uppercase text-white">
                              {user.username.slice(0, 1)}
                            </span>
                            <div>
                              <p className="font-semibold text-slate-900">
                                {user.username}
                                {isCurrentAdmin && (
                                  <span className="ml-2 text-xs font-medium text-orange-600">
                                    You
                                  </span>
                                )}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-500">
                                {user.email || 'No email provided'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${user.is_active
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-700'
                          }`}
                          >
                            {user.is_active ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <select
                              value={draftRoles[user.id] || user.role}
                              onChange={(event) => {
                                setDraftRoles((currentRoles) => ({
                                  ...currentRoles,
                                  [user.id]: event.target.value,
                                }))
                              }}
                              disabled={isCurrentAdmin}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                            >
                              {roleOptions.map((role) => (
                                <option
                                  key={role.value}
                                  value={role.value}
                                >
                                  {role.label}
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              onClick={() => requestRoleChange(user)}
                              disabled={!hasRoleChange || isCurrentAdmin}
                              className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                            >
                              Save
                            </button>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-500">
                          {new Date(user.date_joined).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => requestStatusChange(user)}
                            disabled={isCurrentAdmin}
                            className={`rounded-lg border px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${user.is_active
                              ? 'border-red-200 text-red-700 hover:bg-red-50'
                              : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            {user.is_active ? 'Suspend' : 'Reactivate'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="mt-4 text-xs leading-5 text-slate-400">
          Changing a Manager to another role deactivates their restaurant
          assignments. Reactivating an account does not restore old access.
        </p>
      </main>

      {pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-5 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-confirm-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
              Authorization change
            </p>
            <h2
              id="admin-confirm-title"
              className="mt-3 text-xl font-bold text-slate-900"
            >
              {pendingAction.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {pendingAction.description}
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                disabled={isSaving}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAction}
                disabled={isSaving}
                className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600 disabled:cursor-wait disabled:opacity-60"
              >
                {isSaving ? 'Saving...' : pendingAction.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}


export default AdminUsers
