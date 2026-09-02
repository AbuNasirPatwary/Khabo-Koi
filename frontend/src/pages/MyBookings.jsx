import { useEffect, useState } from "react"
import { getMyBookings } from "../api/api"


function MyBookings() {

    const [bookings, setBookings] = useState([])


    useEffect(() => {

        async function loadBookings() {

            const data = await getMyBookings()

            setBookings(data)

        }

        loadBookings()

    }, [])



    return (

        <main className="min-h-screen bg-[#fdf8f0] px-6 py-10">


            <div className="mx-auto max-w-5xl">


                <h1 className="text-4xl font-bold text-gray-900">
                    My Bookings
                </h1>


                <p className="mt-2 text-gray-500">
                    Manage your upcoming restaurant reservations.
                </p>



                <div className="mt-8 grid gap-6 md:grid-cols-2">


                    {
                        bookings.length === 0 ? (

                            <div className="rounded-2xl bg-white p-8 shadow-sm">

                                <p className="text-gray-500">
                                    No bookings found.
                                </p>

                            </div>


                        ) : (


                            bookings.map((booking) => (


                                <div
                                    key={booking.id}
                                    className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md"
                                >


                                    <div className="flex items-start justify-between">


                                        <div>

                                            <h2 className="text-xl font-bold text-gray-900">
                                                🍽 {booking.restaurant_name}
                                            </h2>


                                            <p className="mt-1 text-gray-600">
                                                📍 {booking.branch_name}
                                            </p>

                                        </div>



                                        <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">

                                            {booking.status}

                                        </span>


                                    </div>



                                    <div className="mt-5 space-y-2 text-gray-700">


                                        <p>
                                            🪑 Table:
                                            <span className="font-semibold">
                                                {" "}{booking.table_number}
                                            </span>
                                        </p>


                                        <p>
                                            📅 Date:
                                            <span className="font-semibold">
                                                {" "}{booking.reservation_date}
                                            </span>
                                        </p>


                                        <p>
                                            🕒 Time:
                                            <span className="font-semibold">
                                                {" "}{booking.start_time}
                                            </span>
                                        </p>


                                        <p>
                                            👥 Guests:
                                            <span className="font-semibold">
                                                {" "}{booking.guest_count}
                                            </span>
                                        </p>


                                    </div>



                                </div>


                            ))

                        )
                    }


                </div>


            </div>


        </main>

    )
}


export default MyBookings