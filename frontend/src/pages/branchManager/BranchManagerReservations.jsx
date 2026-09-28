
import { useEffect, useState } from 'react'
import {
  getBranchManagerReservations,
  updateBranchManagerReservationStatus,
} from '../../api/branchManagerApi'
import BranchManagerLayout from '../../components/branchManager/BranchManagerLayout'
import useBranchManagerShell from '../../components/branchManager/useBranchManagerShell'

const transitions = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
}

function BranchManagerReservations() {
  const { profile, branch } = useBranchManagerShell()
  const [rows, setRows] = useState([])
  const [filters, setFilters] = useState({ status: '', scope: '', search: '' })
  const [message, setMessage] = useState('')

  async function load(next = filters) {
    try {
      setRows(await getBranchManagerReservations(next))
      setMessage('')
    } catch (err) {
      setMessage(err.message)
    }
  }

  useEffect(() => {
    let isCancelled = false

    getBranchManagerReservations({})
      .then((reservations) => {
        if (!isCancelled) setRows(reservations)
      })
      .catch((err) => {
        if (!isCancelled) setMessage(err.message)
      })

    return () => {
      isCancelled = true
    }
  }, [])

  async function changeStatus(row, next) {
    try {
      const updated = await updateBranchManagerReservationStatus(row.id, next)
      setRows((current) => current.map((item) => item.id === updated.id ? updated : item))
    } catch (err) {
      setMessage(err.message)
    }
  }

  return (
    <BranchManagerLayout profile={profile} branch={branch}>
      <header className="border-b border-slate-200 bg-white px-6 py-5 sm:px-9">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600">Branch operations</p>
        <h1 className="mt-1 text-2xl font-bold">Reservations</h1>
      </header>
      <main className="px-6 py-8 sm:px-9">
        <form onSubmit={(e) => { e.preventDefault(); load() }} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-4">
          <input placeholder="Customer or phone" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
            <option value="">All statuses</option><option value="PENDING">Pending</option><option value="CONFIRMED">Confirmed</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option>
          </select>
          <select value={filters.scope} onChange={(e) => setFilters({ ...filters, scope: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
            <option value="">All dates</option><option value="today">Today</option><option value="upcoming">Upcoming</option><option value="history">History</option>
          </select>
          <button className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white">Apply filters</button>
        </form>
        {message && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>}
        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Schedule</th><th className="px-5 py-3">Table</th><th className="px-5 py-3">Guests</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Actions</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-5 py-4"><p className="font-semibold">{row.customer_name}</p><p className="text-xs text-slate-500">{row.customer_phone}</p></td>
                    <td className="px-5 py-4">{row.reservation_date}<p className="text-xs text-slate-500">{row.start_time}–{row.end_time}</p></td>
                    <td className="px-5 py-4">{row.table_number}</td>
                    <td className="px-5 py-4">{row.guest_count}</td>
                    <td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{row.status}</span></td>
                    <td className="px-5 py-4"><div className="flex gap-2">{(transitions[row.status] || []).map((next) => <button key={next} type="button" onClick={() => changeStatus(row, next)} className="rounded-lg border border-orange-200 px-3 py-2 text-xs font-semibold text-orange-700">{next}</button>)}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length === 0 && <p className="p-12 text-center text-sm text-slate-500">No reservations match the current filters.</p>}
        </section>
      </main>
    </BranchManagerLayout>
  )
}

export default BranchManagerReservations
