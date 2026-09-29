
import { useEffect, useMemo, useState } from 'react'
import {
  createPlatformAdminBranchManagerAssignment,
  getPlatformAdminBranchManagerAssignments,
  getPlatformAdminProfile,
  getPlatformAdminUsers,
  getRestaurantsForAdminAssignment,
  updatePlatformAdminBranchManagerAssignment,
} from '../../api/adminApi'
import ConfirmDialog from '../../components/ConfirmDialog'
import AdminLayout from '../../components/admin/AdminLayout'
import PaginationControls from '../../components/PaginationControls'
import { clampPage, paginateItems } from '../../utils/pagination'

function AdminBranchManagerAssignments() {
  const [profile, setProfile] = useState(null)
  const [users, setUsers] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [assignments, setAssignments] = useState([])
  const [userId, setUserId] = useState('')
  const [branchId, setBranchId] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [pendingAssignment, setPendingAssignment] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  async function load() {
    try {
      const [p, u, r, a] = await Promise.all([
        getPlatformAdminProfile(),
        getPlatformAdminUsers(),
        getRestaurantsForAdminAssignment(),
        getPlatformAdminBranchManagerAssignments(),
      ])
      setProfile(p)
      setUsers(u)
      setRestaurants(r)
      setAssignments(a)
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    }
  }

  useEffect(() => {
    let isCancelled = false

    Promise.all([
      getPlatformAdminProfile(),
      getPlatformAdminUsers(),
      getRestaurantsForAdminAssignment(),
      getPlatformAdminBranchManagerAssignments(),
    ])
      .then(([p, u, r, a]) => {
        if (!isCancelled) {
          setProfile(p)
          setUsers(u)
          setRestaurants(r)
          setAssignments(a)
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setMessage({ type: 'error', text: err.message })
        }
      })

    return () => {
      isCancelled = true
    }
  }, [])

  const managers = users.filter(
    (user) => user.role === 'BRANCH_MANAGER' && user.is_active,
  )

  const branches = useMemo(
    () => restaurants.flatMap((restaurant) => (
      (restaurant.branches || [])
        .filter((branch) => branch.is_active)
        .map((branch) => ({
          ...branch,
          restaurant_name: restaurant.name,
        }))
    )),
    [restaurants],
  )
  const filteredAssignments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return assignments.filter((assignment) => {
      const matchesSearch = !query || [
        assignment.user.username,
        assignment.user.email,
        assignment.branch.restaurant_name,
        assignment.branch.name,
      ].some((value) => value?.toLowerCase().includes(query))
      const matchesStatus = statusFilter === 'ALL'
        || (statusFilter === 'ACTIVE' && assignment.is_active)
        || (statusFilter === 'INACTIVE' && !assignment.is_active)

      return matchesSearch && matchesStatus
    })
  }, [assignments, searchTerm, statusFilter])
  const safePage = clampPage(currentPage, filteredAssignments.length)
  const visibleAssignments = paginateItems(filteredAssignments, safePage)

  async function create(event) {
    event.preventDefault()
    try {
      await createPlatformAdminBranchManagerAssignment(
        Number(userId),
        Number(branchId),
      )
      setUserId('')
      setBranchId('')
      setMessage({ type: 'success', text: 'Branch access assigned.' })
      await load()
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    }
  }

  async function toggle() {
    if (!pendingAssignment) return

    setIsSaving(true)
    try {
      await updatePlatformAdminBranchManagerAssignment(
        pendingAssignment.id,
        !pendingAssignment.is_active,
      )
      setMessage({
        type: 'success',
        text: `Branch access ${pendingAssignment.is_active ? 'deactivated' : 'reactivated'}.`,
      })
      setPendingAssignment(null)
      await load()
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AdminLayout profile={profile}>
      <header className="border-b border-slate-200 bg-white px-6 py-5 sm:px-9">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600">Platform administration</p>
        <h1 className="mt-1 text-2xl font-bold">Branch Manager Access</h1>
      </header>

      <main className="px-6 py-8 sm:px-9">
        {message.text && (
          <div className={`mb-5 rounded-xl border px-4 py-3 text-sm ${message.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={create} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[1fr_1fr_auto] lg:items-end">
          <label className="text-sm font-semibold">
            Branch Manager
            <select value={userId} onChange={(e) => setUserId(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal" required>
              <option value="">Choose user</option>
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>{manager.username} · {manager.email}</option>
              ))}
            </select>
          </label>

          <label className="text-sm font-semibold">
            Branch
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal" required>
              <option value="">Choose branch</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.restaurant_name} · {branch.name}</option>
              ))}
            </select>
          </label>

          <button className="rounded-xl bg-orange-500 px-5 py-3 font-bold text-white">Assign branch</button>
        </form>

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-3 border-b border-slate-200 p-5 md:grid-cols-[1fr_180px]">
            <label>
              <span className="sr-only">Search Branch Manager assignments</span>
              <input value={searchTerm} onChange={(event) => { setSearchTerm(event.target.value); setCurrentPage(1) }} placeholder="Search manager, restaurant, or branch" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
            </label>
            <select aria-label="Filter Branch Manager assignments by status" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setCurrentPage(1) }} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Manager</th><th className="px-5 py-3">Restaurant / Branch</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Action</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {visibleAssignments.map((assignment) => (
                <tr key={assignment.id}>
                  <td className="px-5 py-4"><p className="font-semibold">{assignment.user.username}</p><p className="text-xs text-slate-500">{assignment.user.email}</p></td>
                  <td className="px-5 py-4">{assignment.branch.restaurant_name}<p className="text-xs text-slate-500">{assignment.branch.name}</p></td>
                  <td className="px-5 py-4">{assignment.is_active ? 'Active' : 'Inactive'}</td>
                  <td className="px-5 py-4"><button type="button" onClick={() => setPendingAssignment(assignment)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold">{assignment.is_active ? 'Deactivate' : 'Reactivate'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {filteredAssignments.length === 0 && <p className="p-10 text-center text-sm text-slate-500">No Branch Manager assignments match these filters.</p>}
          <PaginationControls currentPage={safePage} itemCount={filteredAssignments.length} onPageChange={setCurrentPage} itemLabel="assignments" />
        </section>
      </main>
      {pendingAssignment && (
        <ConfirmDialog
          eyebrow="Branch access"
          title={`${pendingAssignment.is_active ? 'Deactivate' : 'Reactivate'} this assignment?`}
          description={`${pendingAssignment.user.username} will ${pendingAssignment.is_active ? 'lose' : 'regain'} access to ${pendingAssignment.branch.name}.`}
          confirmLabel={pendingAssignment.is_active ? 'Deactivate' : 'Reactivate'}
          tone={pendingAssignment.is_active ? 'danger' : 'neutral'}
          isSaving={isSaving}
          onCancel={() => setPendingAssignment(null)}
          onConfirm={toggle}
        />
      )}
    </AdminLayout>
  )
}

export default AdminBranchManagerAssignments
