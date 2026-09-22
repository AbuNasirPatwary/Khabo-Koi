import { useEffect, useState } from 'react'

import {
  getManagerReservations,
  getRestaurantManagerProfile,
  updateManagerReservationStatus,
} from '../../api/managerApi'
import ManagerLayout from '../../components/manager/ManagerLayout'


const statusOptions = ['', 'PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']

const nextStatuses = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED'],
  CANCELLED: [],
  COMPLETED: [],
}


function ManagerReservations() {
  const [profile, setProfile] = useState(null)
  const [reservations, setReservations] = useState([])
  const [filters, setFilters] = useState({ status: '', scope: '', search: '', date: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })

  async function loadReservations(nextFilters = filters) {
    setIsLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const [managerProfile, bookingData] = await Promise.all([
        getRestaurantManagerProfile(),
        getManagerReservations(nextFilters),
      ])
      setProfile(managerProfile)
      setReservations(bookingData)
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isCancelled = false

    async function loadInitialData() {
      try {
        const [managerProfile, bookingData] = await Promise.all([
          getRestaurantManagerProfile(), getManagerReservations(),
        ])
        if (isCancelled) return
        setProfile(managerProfile)
        setReservations(bookingData)
      } catch (error) {
        if (!isCancelled) setMessage({ type: 'error', text: error.message })
      } finally {
        if (!isCancelled) setIsLoading(false)
      }
    }

    loadInitialData()
    return () => { isCancelled = true }
  }, [])

  function handleFilterChange(event) {
    setFilters((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  async function handleStatusChange(reservation, newStatus) {
    if (!window.confirm(`Change reservation #${reservation.id} to ${newStatus}?`)) {
      return
    }

    setBusyId(reservation.id)
    setMessage({ type: '', text: '' })

    try {
      const updated = await updateManagerReservationStatus(
        reservation.id,
        newStatus,
      )
      setReservations((current) => current.map((item) => (
        item.id === updated.id ? updated : item
      )))
      setMessage({ type: 'success', text: `Reservation #${updated.id} updated.` })
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <ManagerLayout profile={profile}>
      <header className="border-b border-slate-200 bg-white px-6 py-5 sm:px-9">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600">Restaurant management</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Reservations</h1>
      </header>

      <main id="manager-main" tabIndex="-1" className="px-6 py-8 sm:px-9">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Reservation queue</h2>
          <p className="mt-2 text-sm text-slate-500">Review bookings for assigned restaurants and move them through the approved status workflow.</p>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            loadReservations()
          }}
          className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-5"
        >
          <input name="search" value={filters.search} onChange={handleFilterChange} placeholder="Customer or phone" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          <select name="status" value={filters.status} onChange={handleFilterChange} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
            {statusOptions.map((value) => <option key={value || 'all'} value={value}>{value || 'All statuses'}</option>)}
          </select>
          <select name="scope" value={filters.scope} onChange={handleFilterChange} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
            <option value="">All dates</option>
            <option value="today">Today</option>
            <option value="upcoming">Upcoming</option>
            <option value="history">History</option>
          </select>
          <input name="date" type="date" value={filters.date} onChange={handleFilterChange} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          <button disabled={isLoading} className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{isLoading ? 'Loading...' : 'Apply filters'}</button>
        </form>

        {message.text && <div role={message.type === 'error' ? 'alert' : 'status'} className={`mt-5 rounded-xl border px-4 py-3 text-sm ${message.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{message.text}</div>}

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {isLoading ? (
            <p className="p-12 text-center text-sm text-slate-500">Loading reservations...</p>
          ) : reservations.length === 0 ? (
            <p className="p-12 text-center text-sm text-slate-500">No reservations match these filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Location</th><th className="px-5 py-3">Schedule</th><th className="px-5 py-3">Guests</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Actions</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {reservations.map((reservation) => (
                    <tr key={reservation.id}>
                      <td className="px-5 py-4"><p className="font-semibold text-slate-900">{reservation.customer_name}</p><p className="text-xs text-slate-500">{reservation.customer_phone}</p></td>
                      <td className="px-5 py-4"><p>{reservation.restaurant_name}</p><p className="text-xs text-slate-500">{reservation.branch_name} · Table {reservation.table_number}</p></td>
                      <td className="px-5 py-4"><p>{reservation.reservation_date}</p><p className="text-xs text-slate-500">{reservation.start_time}–{reservation.end_time}</p></td>
                      <td className="px-5 py-4">{reservation.guest_count}</td>
                      <td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{reservation.status}</span></td>
                      <td className="px-5 py-4"><div className="flex flex-wrap gap-2">{nextStatuses[reservation.status].map((nextStatus) => <button key={nextStatus} type="button" disabled={busyId === reservation.id} onClick={() => handleStatusChange(reservation, nextStatus)} className="rounded-lg border border-orange-200 px-2.5 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-50 disabled:opacity-50">{nextStatus}</button>)}{nextStatuses[reservation.status].length === 0 && <span className="text-xs text-slate-400">Final</span>}</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </ManagerLayout>
  )
}


export default ManagerReservations
