import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { getMyBookings } from '../api/api'


function MyBookings() {

    const navigate = useNavigate()

    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')


    useEffect(() => {

        const token = localStorage.getItem('access_token')

        if (!token) {
            navigate('/login')
            return
        }


        async function loadBookings() {

            try {

                const data = await getMyBookings()

                if (Array.isArray(data)) {

                    setBookings(data)

                } else {

                    setError(
                        'Unable to load your bookings.'
                    )

                }

            } catch (error) {

                setError(
                    'Unable to load your bookings.'
                )

            } finally {

                setLoading(false)

            }

        }


        loadBookings()

    }, [navigate])


    function formatDate(dateString) {

        if (!dateString) return '-'

        const date = new Date(
            `${dateString}T00:00:00`
        )

        return date.toLocaleDateString(
            'en-US',
            {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }
        )

    }


    function formatTime(timeString) {

        if (!timeString) return '-'

        const [hours, minutes] =
            timeString.split(':')

        const date = new Date()

        date.setHours(
            Number(hours),
            Number(minutes),
            0
        )

        return date.toLocaleTimeString(
            'en-US',
            {
                hour: 'numeric',
                minute: '2-digit',
            }
        )

    }


    function getStatusClasses(status) {

        switch (
        status?.toUpperCase()
        ) {

            case 'CONFIRMED':

                return 'bg-green-50 text-green-700 ring-green-200'


            case 'PENDING':

                return 'bg-amber-50 text-amber-700 ring-amber-200'


            case 'CANCELLED':

                return 'bg-red-50 text-red-700 ring-red-200'


            default:

                return 'bg-gray-50 text-gray-700 ring-gray-200'

        }

    }


    const confirmedBookings =
        bookings.filter(
            booking =>
                booking.status?.toUpperCase()
                === 'CONFIRMED'
        ).length


    return (

        <main className="min-h-screen bg-[#fdf8f0]">

            {/* HEADER */}

            <header className="border-b border-orange-100 bg-white">

                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">

                    <button
                        onClick={() => navigate('/')}
                        className="text-xl font-extrabold text-gray-900"
                    >
                        <span className="text-orange-500">
                            Khabo-
                        </span>
                        Koi
                    </button>


                    <div className="flex items-center gap-3">

                        <button
                            onClick={() => navigate('/restaurants')}
                            className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                        >
                            Restaurants
                        </button>


                        <button
                            onClick={() => navigate('/browse-food')}
                            className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                        >
                            Browse Food
                        </button>


                        <button
                            onClick={() => navigate('/profile')}
                            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            Profile
                        </button>

                    </div>

                </div>

            </header>


            <section className="mx-auto max-w-6xl px-6 py-12">

                {/* TITLE */}

                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

                    <div>

                        <p className="text-sm font-bold uppercase tracking-widest text-orange-500">
                            Reservations
                        </p>

                        <h1 className="mt-2 text-4xl font-extrabold text-gray-900">
                            My Bookings
                        </h1>

                        <p className="mt-2 text-gray-500">
                            View and manage all your restaurant reservations in one place.
                        </p>

                    </div>


                    <button
                        onClick={() => navigate('/restaurants')}
                        className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600"
                    >
                        + Book Another Table
                    </button>

                </div>


                {/* SUMMARY */}

                {!loading && !error && (

                    <div className="mt-8 grid gap-4 sm:grid-cols-3">

                        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">

                            <p className="text-sm font-semibold text-gray-500">
                                Total Reservations
                            </p>

                            <p className="mt-2 text-3xl font-extrabold text-gray-900">
                                {bookings.length}
                            </p>

                        </div>


                        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">

                            <p className="text-sm font-semibold text-gray-500">
                                Confirmed
                            </p>

                            <p className="mt-2 text-3xl font-extrabold text-green-600">
                                {confirmedBookings}
                            </p>

                        </div>


                        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">

                            <p className="text-sm font-semibold text-gray-500">
                                Account Activity
                            </p>

                            <p className="mt-2 text-lg font-extrabold text-orange-600">
                                Active Customer
                            </p>

                        </div>

                    </div>

                )}


                {/* LOADING */}

                {loading && (

                    <div className="mt-8 rounded-3xl bg-white p-12 text-center shadow-sm">

                        <div className="text-4xl">
                            🍽️
                        </div>

                        <p className="mt-4 font-semibold text-gray-500">
                            Loading your reservations...
                        </p>

                    </div>

                )}


                {/* ERROR */}

                {error && (

                    <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-600">
                        {error}
                    </div>

                )}


                {/* NO BOOKINGS */}

                {!loading &&
                    !error &&
                    bookings.length === 0 && (

                        <div className="mt-8 rounded-3xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-100">

                            <div className="text-6xl">
                                🍽️
                            </div>

                            <h2 className="mt-5 text-2xl font-extrabold text-gray-900">
                                No reservations yet
                            </h2>

                            <p className="mx-auto mt-2 max-w-md text-gray-500">
                                Explore restaurants, choose a table and make your first Khabo-Koi reservation.
                            </p>

                            <button
                                onClick={() =>
                                    navigate(
                                        '/restaurants'
                                    )
                                }
                                className="mt-6 rounded-xl bg-orange-500 px-6 py-3 font-bold text-white hover:bg-orange-600"
                            >
                                Browse Restaurants
                            </button>

                        </div>

                    )}


                {/* BOOKING CARDS */}

                {!loading &&
                    !error &&
                    bookings.length > 0 && (

                        <div className="mt-8 space-y-5">

                            {bookings.map(
                                booking => (

                                    <article
                                        key={booking.id}
                                        className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-md"
                                    >

                                        <div className="grid lg:grid-cols-[1.2fr_2fr]">

                                            {/* RESTAURANT SIDE */}

                                            <div className="bg-gradient-to-br from-orange-50 to-[#fff8ef] p-7">

                                                <div className="flex items-start justify-between gap-4">

                                                    <div>

                                                        <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
                                                            Restaurant
                                                        </p>

                                                        <h2 className="mt-2 text-2xl font-extrabold text-gray-900">
                                                            🍽️{' '}
                                                            {
                                                                booking.restaurant_name
                                                            }
                                                        </h2>

                                                        <p className="mt-2 text-gray-600">
                                                            📍{' '}
                                                            {
                                                                booking.branch_name
                                                            }
                                                        </p>

                                                    </div>


                                                    <span
                                                        className={`inline-flex rounded-full px-4 py-2 text-xs font-extrabold ring-1 ${getStatusClasses(
                                                            booking.status
                                                        )}`}
                                                    >
                                                        {
                                                            booking.status
                                                        }
                                                    </span>

                                                </div>


                                                {booking.id && (

                                                    <div className="mt-8">

                                                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                                            Booking Reference
                                                        </p>

                                                        <p className="mt-1 font-extrabold text-gray-900">
                                                            #{booking.id}
                                                        </p>

                                                    </div>

                                                )}

                                            </div>


                                            {/* DETAILS SIDE */}

                                            <div className="p-7">

                                                <p className="text-sm font-bold text-gray-900">
                                                    Reservation Details
                                                </p>


                                                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                                                    <div className="rounded-2xl bg-gray-50 p-4">

                                                        <div className="text-xl">
                                                            📅
                                                        </div>

                                                        <p className="mt-3 text-xs font-bold uppercase tracking-wider text-gray-400">
                                                            Date
                                                        </p>

                                                        <p className="mt-1 font-bold text-gray-900">
                                                            {formatDate(
                                                                booking.reservation_date
                                                            )}
                                                        </p>

                                                    </div>


                                                    <div className="rounded-2xl bg-gray-50 p-4">

                                                        <div className="text-xl">
                                                            🕐
                                                        </div>

                                                        <p className="mt-3 text-xs font-bold uppercase tracking-wider text-gray-400">
                                                            Time
                                                        </p>

                                                        <p className="mt-1 font-bold text-gray-900">
                                                            {formatTime(
                                                                booking.start_time
                                                            )}
                                                        </p>

                                                    </div>


                                                    <div className="rounded-2xl bg-gray-50 p-4">

                                                        <div className="text-xl">
                                                            👥
                                                        </div>

                                                        <p className="mt-3 text-xs font-bold uppercase tracking-wider text-gray-400">
                                                            Guests
                                                        </p>

                                                        <p className="mt-1 font-bold text-gray-900">
                                                            {
                                                                booking.guest_count
                                                            }{' '}
                                                            {
                                                                booking.guest_count ===
                                                                    1
                                                                    ? 'Guest'
                                                                    : 'Guests'
                                                            }
                                                        </p>

                                                    </div>


                                                    <div className="rounded-2xl bg-gray-50 p-4">

                                                        <div className="text-xl">
                                                            🪑
                                                        </div>

                                                        <p className="mt-3 text-xs font-bold uppercase tracking-wider text-gray-400">
                                                            Table
                                                        </p>

                                                        <p className="mt-1 font-bold text-gray-900">
                                                            {
                                                                booking.table_number
                                                            }
                                                        </p>

                                                    </div>

                                                </div>


                                                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-5">

                                                    <p className="text-sm text-gray-500">
                                                        Your reservation is saved in your Khabo-Koi account.
                                                    </p>


                                                    <button
                                                        onClick={() =>
                                                            navigate(
                                                                '/restaurants'
                                                            )
                                                        }
                                                        className="rounded-xl border border-orange-200 px-4 py-2 text-sm font-bold text-orange-600 transition hover:bg-orange-50"
                                                    >
                                                        Explore Restaurants
                                                    </button>

                                                </div>

                                            </div>

                                        </div>

                                    </article>

                                )
                            )}

                        </div>

                    )}

            </section>

        </main>

    )

}


export default MyBookings