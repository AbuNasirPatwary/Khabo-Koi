import { useEffect, useMemo, useState } from 'react'

import {
  getPlatformAdminBookings,
  getPlatformAdminProfile,
} from '../../api/adminApi'
import AdminLayout from '../../components/admin/AdminLayout'


const STATUS_STYLES = {
  PENDING: 'bg-amber-50 text-amber-700 ring-amber-200',
  CONFIRMED: 'bg-blue-50 text-blue-700 ring-blue-200',
  CANCELLED: 'bg-red-50 text-red-700 ring-red-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
}


function formatDate(value) {
  if (!value) {
    return 'Not recorded'
  }

  // Adding a local noon avoids a date-only value shifting a day because of
  // the browser's timezone conversion.
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T12:00:00`))
}


function formatTime(value) {
  if (!value) {
    return '—'
  }

  const [hour, minute] = value.split(':').map(Number)

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(2000, 0, 1, hour, minute))
}


function formatStatus(status) {
  if (!status) {
    return 'Unknown'
  }

  return status.charAt(0) + status.slice(1).toLowerCase()
}


function AdminBookings() {
  const [bookings, setBookings] = useState([])
  const [profile, setProfile] = useState(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [restaurantFilter, setRestaurantFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  async function loadBookings({ showLoader = true } = {}) {
    if (showLoader) {
      setIsLoading(true)
    }

    setErrorMessage('')

    try {
      const [bookingData, adminProfile] = await Promise.all([
        getPlatformAdminBookings(),
        getPlatformAdminProfile(),
      ])

      setBookings(bookingData)
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

    // Fetch the profile and oversight data together so the page never relies
    // on cached identity or fabricated booking records.
    Promise.all([
      getPlatformAdminBookings(),
      getPlatformAdminProfile(),
    ])
      .then(([bookingData, adminProfile]) => {
        if (!isCancelled) {
          setBookings(bookingData)
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

  const restaurants = useMemo(() => {
    const uniqueRestaurants = new Map()

    bookings.forEach((booking) => {
      if (booking.restaurant) {
        uniqueRestaurants.set(
          String(booking.restaurant.id),
          booking.restaurant.name,
        )
      }
    })

    return Array.from(uniqueRestaurants.entries())
      .sort((first, second) => first[1].localeCompare(second[1]))
  }, [bookings])

  const filteredBookings = useMemo(() => {
    const normalizedSearch = customerSearch.trim().toLowerCase()

    return bookings.filter((booking) => {
      const customerFields = [
        booking.customer_name,
        booking.customer_phone,
        booking.user?.username,
        booking.user?.email,
      ]
      const matchesCustomer = (
        !normalizedSearch
        || customerFields.some((value) => (
          value?.toLowerCase().includes(normalizedSearch)
        ))
      )
      const matchesRestaurant = (
        restaurantFilter === 'ALL'
        || String(booking.restaurant?.id) === restaurantFilter
      )
      const matchesStatus = (
        statusFilter === 'ALL'
        || booking.status === statusFilter
      )

      return matchesCustomer && matchesRestaurant && matchesStatus
    })
  }, [bookings, customerSearch, restaurantFilter, statusFilter])

  const summary = useMemo(() => ({
    total: bookings.length,
    pending: bookings.filter((booking) => booking.status === 'PENDING').length,
    confirmed: bookings.filter((booking) => booking.status === 'CONFIRMED').length,
    guests: bookings.reduce(
      (total, booking) => total + booking.guest_count,
      0,
    ),
  }), [bookings])

  return (
    <AdminLayout profile={profile}>
      <header className="border-b border-slate-200 bg-white px-6 py-5 sm:px-9">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600">
          Platform administration
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Booking Oversight
        </h1>
      </header>

      <main className="px-6 py-8 sm:px-9 sm:py-10">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Platform bookings
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Monitor reservations across every restaurant. This view is
              read-only; Restaurant Managers remain responsible for booking
              operations and status changes.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadBookings()}
            disabled={isLoading}
            className="self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-wait disabled:opacity-60 lg:self-auto"
          >
            {isLoading ? 'Refreshing...' : 'Refresh bookings'}
          </button>
        </div>

        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['Total bookings', summary.total, 'bg-blue-50 text-blue-700'],
            ['Pending review', summary.pending, 'bg-amber-50 text-amber-700'],
            ['Confirmed', summary.confirmed, 'bg-emerald-50 text-emerald-700'],
            ['Reserved guests', summary.guests, 'bg-violet-50 text-violet-700'],
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

        <aside className="mt-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800">
          <strong>Payment data is unavailable.</strong>{' '}
          Khabo-Koi does not currently have a payment model or transaction
          records, so this page does not display estimated or placeholder
          payment information.
        </aside>

        {errorMessage && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {errorMessage}
          </div>
        )}

        <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-4 border-b border-slate-200 p-5 lg:grid-cols-[minmax(240px,1fr)_220px_190px]">
            <label>
              <span className="sr-only">Search customers</span>
              <input
                value={customerSearch}
                onChange={(event) => setCustomerSearch(event.target.value)}
                placeholder="Search customer, email, or phone"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:bg-white"
              />
            </label>
            <label>
              <span className="sr-only">Filter by restaurant</span>
              <select
                value={restaurantFilter}
                onChange={(event) => setRestaurantFilter(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-orange-400 focus:bg-white"
              >
                <option value="ALL">All restaurants</option>
                {restaurants.map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="sr-only">Filter by status</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-orange-400 focus:bg-white"
              >
                <option value="ALL">All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </label>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-sm text-slate-500">
              Loading platform bookings...
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-semibold text-slate-800">
                {bookings.length === 0
                  ? 'No bookings have been created yet'
                  : 'No bookings match these filters'}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {bookings.length === 0
                  ? 'New customer reservations will appear here automatically.'
                  : 'Try another customer, restaurant, or booking status.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredBookings.map((booking) => (
                <article
                  key={booking.id}
                  className="grid gap-5 p-5 xl:grid-cols-[minmax(190px,1.15fr)_minmax(190px,1fr)_minmax(210px,1.15fr)_130px] xl:items-center"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-slate-900">
                        {booking.customer_name || booking.user?.username || 'Guest customer'}
                      </p>
                      {!booking.user && (
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                          Legacy guest
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {booking.user?.email || 'No account email'}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {booking.customer_phone || 'No phone recorded'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Restaurant
                    </p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {booking.restaurant?.name || 'Unknown restaurant'}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {booking.branch?.name || 'Unknown branch'} · Table{' '}
                      {booking.table?.table_number || '—'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Reservation
                    </p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {formatDate(booking.reservation_date)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {formatTime(booking.start_time)}–{formatTime(booking.end_time)} ·{' '}
                      {booking.guest_count} {booking.guest_count === 1 ? 'guest' : 'guests'}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {booking.table?.seating_type
                        ? `${formatStatus(booking.table.seating_type)} seating`
                        : 'Seating type not recorded'}
                    </p>
                  </div>

                  <div className="xl:text-right">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${STATUS_STYLES[booking.status] || 'bg-slate-50 text-slate-700 ring-slate-200'}`}>
                      {formatStatus(booking.status)}
                    </span>
                    <p className="mt-3 text-xs text-slate-400">
                      Booking #{booking.id}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </AdminLayout>
  )
}


export default AdminBookings
