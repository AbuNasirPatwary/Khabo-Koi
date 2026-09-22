import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import Navbar from '../components/Navbar'
import Footer from '../components/Footer'


function formatDate(dateString) {

    if (!dateString) return '-'

    const date =
        new Date(`${dateString}T00:00:00`)

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


function BookingConfirmation() {

    const { bookingId } = useParams()
    const location = useLocation()
    const navigate = useNavigate()

    const [confirmation, setConfirmation] =
        useState(
            location.state?.confirmation ||
            null
        )


    useEffect(() => {

        if (confirmation) return


        const saved =
            sessionStorage.getItem(
                'khabo_koi_confirmation_context'
            )


        if (saved) {

            try {

                setConfirmation(
                    JSON.parse(saved)
                )

            } catch {

                setConfirmation(null)

            }

        }

    }, [confirmation])


    if (!confirmation) {

        return (

            <div className="min-h-screen bg-[#fdf8f0]">

                <Navbar />


                <main className="mx-auto max-w-3xl px-6 py-20 text-center">

                    <div className="rounded-3xl bg-white p-10 shadow-sm ring-1 ring-gray-100">

                        <h1 className="text-3xl font-extrabold text-gray-900">
                            Confirmation details unavailable
                        </h1>

                        <p className="mt-3 text-gray-500">
                            You can still view your saved reservation from My Bookings.
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                navigate('/my-bookings')
                            }
                            className="mt-7 rounded-xl bg-orange-500 px-6 py-3 font-bold text-white"
                        >
                            My Bookings
                        </button>

                    </div>

                </main>


                <Footer />

            </div>

        )

    }


    const booking =
        confirmation.booking || {}

    const preorder =
        confirmation.preorder

    const payment =
        preorder?.payment


    return (

        <div className="min-h-screen bg-[#fdf8f0]">

            <Navbar />


            <main className="mx-auto max-w-5xl px-6 py-14">

                <div className="rounded-3xl border border-green-200 bg-white p-8 shadow-sm">

                    <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">

                        <div>

                            <div className="inline-flex rounded-full bg-green-50 px-4 py-2 text-sm font-extrabold text-green-700">
                                ✓ Reservation Confirmed
                            </div>

                            <h1 className="mt-5 text-4xl font-extrabold text-gray-900">
                                Your table is booked.
                            </h1>

                            <p className="mt-2 text-gray-500">
                                Booking #{booking.id || bookingId} has been saved to your Khabo-Koi account.
                            </p>

                        </div>


                        <div className="rounded-2xl bg-orange-50 px-5 py-4 text-right">

                            <p className="text-xs font-bold uppercase tracking-wider text-orange-500">
                                Restaurant
                            </p>

                            <p className="mt-1 text-xl font-extrabold text-gray-900">
                                {confirmation.restaurant?.name}
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                                {confirmation.branch?.name}
                            </p>

                        </div>

                    </div>


                    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                        <div className="rounded-2xl bg-gray-50 p-5">

                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                Date
                            </p>

                            <p className="mt-2 font-extrabold text-gray-900">
                                {formatDate(
                                    confirmation.reservation_date
                                )}
                            </p>

                        </div>


                        <div className="rounded-2xl bg-gray-50 p-5">

                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                Time
                            </p>

                            <p className="mt-2 font-extrabold text-gray-900">
                                {formatTime(
                                    confirmation.start_time
                                )}
                            </p>

                        </div>


                        <div className="rounded-2xl bg-gray-50 p-5">

                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                Guests
                            </p>

                            <p className="mt-2 font-extrabold text-gray-900">
                                {confirmation.guest_count}
                            </p>

                        </div>


                        <div className="rounded-2xl bg-gray-50 p-5">

                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                Table
                            </p>

                            <p className="mt-2 font-extrabold text-gray-900">
                                {confirmation.table?.table_number}
                            </p>

                        </div>

                    </div>


                    {confirmation.special_request && (

                        <div className="mt-7 rounded-2xl border border-gray-200 p-5">

                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                Special Request
                            </p>

                            <p className="mt-2 text-gray-700">
                                {confirmation.special_request}
                            </p>

                        </div>

                    )}


                    <div className="mt-8 border-t border-gray-100 pt-8">

                        <div className="flex items-center justify-between gap-4">

                            <div>

                                <p className="text-sm font-bold uppercase tracking-widest text-orange-500">
                                    Food Pre-order
                                </p>

                                <h2 className="mt-1 text-2xl font-extrabold text-gray-900">
                                    {preorder
                                        ? 'Pre-order Summary'
                                        : 'No food pre-ordered'}
                                </h2>

                            </div>


                            {payment && (

                                <span className="rounded-full bg-green-50 px-4 py-2 text-sm font-extrabold text-green-700">
                                    ✓ 50% Advance Paid
                                </span>

                            )}

                        </div>


                        {preorder ? (

                            <>

                                <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200">

                                    {preorder.items.map(
                                        (item) => (

                                            <div
                                                key={item.id}
                                                className="flex items-center justify-between border-b border-gray-100 px-5 py-4 last:border-b-0"
                                            >

                                                <div>

                                                    <p className="font-bold text-gray-900">
                                                        {item.name}
                                                    </p>

                                                    <p className="mt-1 text-sm text-gray-500">
                                                        {item.quantity} × ৳{Number(item.price).toFixed(0)}
                                                    </p>

                                                </div>


                                                <p className="font-extrabold text-gray-900">
                                                    ৳{Number(item.line_total).toFixed(0)}
                                                </p>

                                            </div>

                                        )
                                    )}


                                    <div className="bg-gray-50 px-5 py-5">

                                        <div className="flex items-center justify-between">

                                            <span className="font-bold text-gray-600">
                                                Food total
                                            </span>

                                            <span className="font-extrabold text-gray-900">
                                                ৳{Number(preorder.subtotal).toFixed(0)}
                                            </span>

                                        </div>


                                        <div className="mt-3 flex items-center justify-between">

                                            <span className="font-bold text-gray-600">
                                                Advance paid
                                            </span>

                                            <span className="font-extrabold text-green-600">
                                                ৳{Number(preorder.advance_amount).toFixed(0)}
                                            </span>

                                        </div>


                                        <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3">

                                            <span className="font-extrabold text-gray-900">
                                                Remaining at restaurant
                                            </span>

                                            <span className="text-xl font-extrabold text-orange-600">
                                                ৳{Number(preorder.remaining_amount).toFixed(0)}
                                            </span>

                                        </div>

                                    </div>

                                </div>


                                {payment && (

                                    <div className="mt-5 grid gap-4 rounded-2xl border border-green-200 bg-green-50 p-5 sm:grid-cols-2">

                                        <div>

                                            <p className="text-xs font-bold uppercase tracking-wider text-green-600">
                                                Payment Method
                                            </p>

                                            <p className="mt-1 font-extrabold text-gray-900">
                                                {payment.method}
                                            </p>

                                        </div>


                                        <div>

                                            <p className="text-xs font-bold uppercase tracking-wider text-green-600">
                                                Transaction ID
                                            </p>

                                            <p className="mt-1 break-all font-extrabold text-gray-900">
                                                {payment.transaction_id}
                                            </p>

                                        </div>

                                    </div>

                                )}

                            </>

                        ) : (

                            <p className="mt-4 text-gray-500">
                                Only the table reservation was created for this booking.
                            </p>

                        )}

                    </div>


                    <div className="mt-9 flex flex-col gap-3 sm:flex-row">

                        <button
                            type="button"
                            onClick={() =>
                                navigate('/my-bookings')
                            }
                            className="flex-1 rounded-xl bg-orange-500 px-6 py-4 font-bold text-white hover:bg-orange-600"
                        >
                            View My Bookings
                        </button>


                        <button
                            type="button"
                            onClick={() =>
                                navigate('/restaurants')
                            }
                            className="flex-1 rounded-xl border border-gray-200 bg-white px-6 py-4 font-bold text-gray-800 hover:bg-gray-50"
                        >
                            Explore Restaurants
                        </button>

                    </div>

                </div>

            </main>


            <Footer />

        </div>

    )

}


export default BookingConfirmation
