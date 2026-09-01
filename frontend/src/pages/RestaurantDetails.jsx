import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useParams, } from 'react-router-dom'

import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

import sultansDineImage from '../assets/images/landing/sultans-dine.png'


// =============================================================================
// DJANGO API
// =============================================================================

const API_BASE_URL = 'http://127.0.0.1:8000/api'


// =============================================================================
// RESERVATION TIMES
// =============================================================================
// The value is sent to Django in 24-hour format.
// The label is what the customer sees.
// =============================================================================

const availableTimes = [
    { value: '18:00', label: '6:00 PM' },
    { value: '18:30', label: '6:30 PM' },
    { value: '19:00', label: '7:00 PM' },
    { value: '19:30', label: '7:30 PM' },
    { value: '20:00', label: '8:00 PM' },
    { value: '20:30', label: '8:30 PM' },
    { value: '21:00', label: '9:00 PM' },
    { value: '21:30', label: '9:30 PM' },
]


// =============================================================================
// SEATING OPTIONS
// =============================================================================
// These values match RestaurantTable.SEATING_CHOICES in Django.
// =============================================================================

const seatingOptions = [
    {
        value: 'ANY',
        label: 'Any Seating',
    },
    {
        value: 'INDOOR',
        label: 'Indoor',
    },
    {
        value: 'OUTDOOR',
        label: 'Outdoor',
    },
    {
        value: 'WINDOW',
        label: 'Window Side',
    },
]


function getTodayDate() {

    const today = new Date()

    const year = today.getFullYear()

    const month = String(
        today.getMonth() + 1
    ).padStart(2, '0')

    const day = String(
        today.getDate()
    ).padStart(2, '0')


    return `${year}-${month}-${day}`
}


function RestaurantDetails() {

    const { id } = useParams()
    const location = useLocation()
    // Used by the Reserve button to scroll directly
    // to the table reservation section.
    const reservationSectionRef = useRef(null)


    // =========================================================================
    // RESTAURANT DATA
    // =========================================================================

    const [restaurant, setRestaurant] =
        useState(null)

    const [loading, setLoading] =
        useState(true)

    const [error, setError] =
        useState('')


    // =========================================================================
    // RESERVATION FORM
    // =========================================================================

    const [selectedBranchId, setSelectedBranchId] =
        useState('')

    const [bookingDate, setBookingDate] =
        useState('')

    const [selectedTime, setSelectedTime] =
        useState('')

    const [guests, setGuests] =
        useState(2)

    const [selectedSeating, setSelectedSeating] =
        useState('ANY')


    // =========================================================================
    // CUSTOMER INFORMATION
    // =========================================================================
    // TEMPORARY:
    //
    // Later, when JWT authentication is implemented, the logged-in customer
    // account will provide most of this information.
    // =========================================================================

    const [customerName, setCustomerName] =
        useState('')

    const [customerPhone, setCustomerPhone] =
        useState('')


    // =========================================================================
    // AVAILABILITY
    // =========================================================================

    const [availableTables, setAvailableTables] =
        useState([])

    const [selectedTable, setSelectedTable] =
        useState(null)

    const [checkingAvailability, setCheckingAvailability] =
        useState(false)

    const [availabilityChecked, setAvailabilityChecked] =
        useState(false)

    const [availabilityError, setAvailabilityError] =
        useState('')


    // =========================================================================
    // BOOKING
    // =========================================================================

    const [creatingBooking, setCreatingBooking] =
        useState(false)

    const [bookingError, setBookingError] =
        useState('')

    const [bookingSuccess, setBookingSuccess] =
        useState(null)



    // =========================================================================
    // LOAD RESTAURANT FROM DJANGO
    // =========================================================================
    //
    // React
    //   ↓
    // GET /api/restaurants/:id/
    //   ↓
    // Django
    //   ↓
    // PostgreSQL
    // =========================================================================

    useEffect(() => {

        const controller =
            new AbortController()


        async function loadRestaurant() {

            try {

                setLoading(true)
                setError('')


                const response = await fetch(
                    `${API_BASE_URL}/restaurants/${id}/`,
                    {
                        signal: controller.signal,
                    }
                )


                if (!response.ok) {

                    if (response.status === 404) {

                        throw new Error(
                            'Restaurant not found.'
                        )

                    }

                    throw new Error(
                        'Could not load restaurant.'
                    )

                }


                const data =
                    await response.json()


                setRestaurant(data)


                const firstActiveBranch =
                    data.branches?.find(
                        (branch) =>
                            branch.is_active
                    )


                if (firstActiveBranch) {

                    setSelectedBranchId(
                        String(firstActiveBranch.id)
                    )

                }

            }

            catch (requestError) {

                if (
                    requestError.name !==
                    'AbortError'
                ) {

                    console.error(
                        requestError
                    )

                    setError(
                        requestError.message
                    )

                }

            }

            finally {

                setLoading(false)

            }

        }


        loadRestaurant()


        return () => {

            controller.abort()

        }

    }, [id])

    // =========================================================================
    // PAGE / RESERVATION SCROLLING
    // =========================================================================
    //
    // View Restaurant:
    // /restaurants/1
    // → open from the top.
    //
    // Reserve:
    // /restaurants/1#reservation
    // → automatically scroll to the reservation section.
    // =========================================================================

    // =========================================================================
    // RESTAURANT PAGE SCROLLING
    // =========================================================================
    //
    // View Restaurant:
    // /restaurants/3
    // → opens the Restaurant Details page from the top.
    //
    // Reserve:
    // /restaurants/3#reservation
    // → opens the same page and automatically scrolls
    //   to the reservation section.
    // =========================================================================

    useEffect(() => {

        // Wait until the restaurant has finished loading.
        if (loading || !restaurant) {
            return
        }


        // RESERVE BUTTON
        if (location.hash === '#reservation') {

            const timer = setTimeout(() => {

                reservationSectionRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                })

            }, 150)


            return () => {
                clearTimeout(timer)
            }

        }


        // VIEW RESTAURANT BUTTON
        // No hash = start from top.
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'auto',
        })

    }, [
        location.hash,
        loading,
        restaurant,
    ])

    // useEffect(() => {

    //     // Wait until restaurant data has finished loading.
    //     if (loading) {
    //         return
    //     }


    //     if (location.hash === '#reservation') {

    //         // Small delay allows React to finish rendering
    //         // the Restaurant Details page first.
    //         setTimeout(() => {

    //             const reservationSection =
    //                 document.getElementById(
    //                     'reservation'
    //                 )


    //             if (reservationSection) {

    //                 reservationSection.scrollIntoView({
    //                     behavior: 'smooth',
    //                     block: 'start',
    //                 })

    //             }

    //         }, 100)

    //     }

    //     else {

    //         // View Restaurant should begin at the top.
    //         window.scrollTo({
    //             top: 0,
    //             behavior: 'smooth',
    //         })

    //     }

    // }, [
    //     location.hash,
    //     loading,
    // ])



    // =========================================================================
    // SELECTED BRANCH
    // =========================================================================

    const selectedBranch = useMemo(() => {

        if (!restaurant) {
            return null
        }


        return restaurant.branches?.find(
            (branch) =>
                branch.id ===
                Number(selectedBranchId)
        ) || null

    }, [
        restaurant,
        selectedBranchId,
    ])



    // =========================================================================
    // RESET AVAILABILITY
    // =========================================================================
    // If the customer changes the date/time/branch/etc,
    // old availability results are no longer valid.
    // =========================================================================

    function resetAvailability() {

        setAvailableTables([])
        setSelectedTable(null)
        setAvailabilityChecked(false)
        setAvailabilityError('')
        setBookingError('')
        setBookingSuccess(null)

    }



    // =========================================================================
    // CHECK REAL TABLE AVAILABILITY
    // =========================================================================
    //
    // POST /api/availability/
    //
    // Django checks:
    //
    // RestaurantTable
    //      +
    // Existing Booking records
    //      +
    // Date / Start / End
    //
    // and returns only free tables.
    // =========================================================================

    async function handleCheckAvailability(
        event
    ) {

        event.preventDefault()


        setAvailabilityError('')
        setBookingError('')
        setBookingSuccess(null)
        setSelectedTable(null)


        if (
            !selectedBranchId ||
            !bookingDate ||
            !selectedTime
        ) {

            setAvailabilityError(
                'Please select branch, date and time.'
            )

            return

        }


        try {

            setCheckingAvailability(true)


            const response = await fetch(
                `${API_BASE_URL}/availability/`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json',
                    },

                    body: JSON.stringify({
                        branch_id:
                            Number(selectedBranchId),

                        reservation_date:
                            bookingDate,

                        start_time:
                            selectedTime,

                        guest_count:
                            Number(guests),

                        seating_type:
                            selectedSeating,
                    }),
                }
            )


            const data =
                await response.json()


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    'Could not check availability.'
                )

            }


            setAvailableTables(
                data.available_tables || []
            )

            setAvailabilityChecked(true)

        }

        catch (requestError) {

            console.error(
                requestError
            )


            setAvailabilityError(
                requestError.message
            )


            setAvailabilityChecked(true)

        }

        finally {

            setCheckingAvailability(false)

        }

    }



    // =========================================================================
    // CREATE REAL BOOKING
    // =========================================================================
    //
    // POST /api/bookings/
    //
    // Django checks availability AGAIN before saving.
    //
    // If another customer booked the same table:
    //
    // HTTP 409 Conflict
    //
    // Otherwise:
    //
    // Booking → PostgreSQL
    // =========================================================================

    async function handleCreateBooking() {

        setBookingError('')
        setBookingSuccess(null)


        if (!selectedTable) {

            setBookingError(
                'Please select a table first.'
            )

            return

        }


        if (!customerName.trim()) {

            setBookingError(
                'Please enter your name.'
            )

            return

        }


        if (!customerPhone.trim()) {

            setBookingError(
                'Please enter your phone number.'
            )

            return

        }


        try {

            setCreatingBooking(true)


            const response = await fetch(
                `${API_BASE_URL}/bookings/`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json',

                        'Authorization':
                            `Bearer ${localStorage.getItem('access_token')}`,
                    },

                    body: JSON.stringify({
                        branch_id:
                            Number(selectedBranchId),

                        table_id:
                            selectedTable.id,

                        reservation_date:
                            bookingDate,

                        start_time:
                            selectedTime,

                        guest_count:
                            Number(guests),

                        customer_name:
                            customerName.trim(),

                        customer_phone:
                            customerPhone.trim(),
                    }),
                }
            )


            const data =
                await response.json()


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    'Could not create booking.'
                )

            }


            setBookingSuccess(data)


            // Remove the newly-booked table
            // from the availability list.
            setAvailableTables(
                (currentTables) =>
                    currentTables.filter(
                        (table) =>
                            table.id !==
                            selectedTable.id
                    )
            )


            setSelectedTable(null)

        }

        catch (requestError) {

            console.error(
                requestError
            )


            setBookingError(
                requestError.message
            )

        }

        finally {

            setCreatingBooking(false)

        }

    }



    // =========================================================================
    // LOADING
    // =========================================================================

    if (loading) {

        return (

            <div className="min-h-screen bg-[#fdf8f0]">

                <Navbar />


                <div className="mx-auto max-w-7xl px-6 py-24 text-center">

                    <p className="text-lg font-semibold text-gray-700">
                        Loading restaurant...
                    </p>

                    <p className="mt-2 text-sm text-gray-500">
                        Getting data from Khabo-Koi.
                    </p>

                </div>


                <Footer />

            </div>

        )

    }



    // =========================================================================
    // ERROR / NOT FOUND
    // =========================================================================

    if (error || !restaurant) {

        return (

            <div className="min-h-screen bg-[#fdf8f0]">

                <Navbar />


                <div className="mx-auto max-w-7xl px-6 py-24 text-center">

                    <div className="text-5xl">
                        🍽️
                    </div>


                    <h1 className="mt-5 text-3xl font-bold text-gray-900">
                        Restaurant not found
                    </h1>


                    <p className="mt-3 text-gray-500">
                        {error}
                    </p>


                    <Link
                        to="/restaurants"
                        className="mt-7 inline-block rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white hover:bg-orange-600"
                    >
                        Back to Restaurants
                    </Link>

                </div>


                <Footer />

            </div>

        )

    }



    return (

        <div className="min-h-screen bg-[#fdf8f0]">


            <Navbar />



            {/* ================================================================
                RESTAURANT INFORMATION
            ================================================================= */}

            <section className="bg-white">


                <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 lg:grid-cols-2 lg:items-center">


                    {/* IMAGE */}

                    <div className="h-[420px] overflow-hidden rounded-3xl">


                        <img
                            src={
                                restaurant.image_url ||
                                sultansDineImage
                            }
                            alt={restaurant.name}
                            className="h-full w-full object-cover"
                        />


                    </div>



                    {/* DETAILS */}

                    <div>


                        <p className="text-sm font-semibold uppercase tracking-wider text-orange-500">
                            Restaurant
                        </p>


                        <h1 className="mt-3 text-4xl font-bold text-gray-900 md:text-5xl">
                            {restaurant.name}
                        </h1>


                        <p className="mt-3 text-lg text-gray-500">
                            {restaurant.cuisine}
                        </p>



                        <div className="mt-5 flex flex-wrap gap-3">


                            <span className="rounded-full bg-yellow-50 px-4 py-2 text-sm font-semibold text-gray-700">
                                ★ {restaurant.rating}
                            </span>


                            <span className="rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
                                ● Active
                            </span>


                            <span className="rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-600">

                                {restaurant.branches?.length || 0}{' '}

                                {restaurant.branches?.length === 1
                                    ? 'Branch'
                                    : 'Branches'}

                            </span>


                        </div>



                        <p className="mt-7 max-w-xl leading-7 text-gray-600">
                            {restaurant.description}
                        </p>



                        <div className="mt-8">


                            <p className="font-semibold text-gray-900">
                                Available branches
                            </p>


                            <div className="mt-3 flex flex-wrap gap-2">


                                {restaurant.branches
                                    ?.filter(
                                        (branch) =>
                                            branch.is_active
                                    )
                                    .map(
                                        (branch) => (

                                            <span
                                                key={branch.id}
                                                className="rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-600"
                                            >
                                                📍 {branch.name}
                                            </span>

                                        )
                                    )}


                            </div>


                        </div>


                    </div>


                </div>


            </section>



            {/* ================================================================
                RESERVATION
            ================================================================= */}

            <section id="reservation" ref={reservationSectionRef} className="py-16">


                <div className="mx-auto max-w-7xl px-6">


                    <div>


                        <p className="text-sm font-semibold uppercase tracking-wider text-orange-500">
                            Smart Table Booking
                        </p>


                        <h2 className="mt-2 text-3xl font-bold text-gray-900">
                            Reserve your table
                        </h2>


                        <p className="mt-3 text-gray-500">
                            Select your branch, date, time,
                            party size and seating preference.
                        </p>


                    </div>



                    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">


                        {/* ====================================================
                            RESERVATION FORM
                        ===================================================== */}

                        <div className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">


                            <form
                                onSubmit={
                                    handleCheckAvailability
                                }
                            >


                                <div className="grid gap-5 md:grid-cols-2">


                                    {/* BRANCH */}

                                    <div>


                                        <label className="text-sm font-semibold text-gray-700">
                                            Branch
                                        </label>


                                        <select
                                            value={
                                                selectedBranchId
                                            }
                                            onChange={
                                                (event) => {

                                                    setSelectedBranchId(
                                                        event.target.value
                                                    )

                                                    resetAvailability()

                                                }
                                            }
                                            className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm outline-none focus:border-orange-400"
                                        >


                                            {restaurant.branches
                                                ?.filter(
                                                    (branch) =>
                                                        branch.is_active
                                                )
                                                .map(
                                                    (branch) => (

                                                        <option
                                                            key={
                                                                branch.id
                                                            }
                                                            value={
                                                                branch.id
                                                            }
                                                        >
                                                            {branch.name}
                                                        </option>

                                                    )
                                                )}


                                        </select>


                                    </div>



                                    {/* DATE */}

                                    <div>


                                        <label className="text-sm font-semibold text-gray-700">
                                            Reservation Date
                                        </label>


                                        <input
                                            type="date"
                                            min={getTodayDate()}
                                            value={bookingDate}
                                            onChange={
                                                (event) => {

                                                    setBookingDate(
                                                        event.target.value
                                                    )

                                                    resetAvailability()

                                                }
                                            }
                                            className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3.5 text-sm outline-none focus:border-orange-400"
                                        />


                                    </div>



                                    {/* TIME */}

                                    <div>


                                        <label className="text-sm font-semibold text-gray-700">
                                            Arrival Time
                                        </label>


                                        <select
                                            value={
                                                selectedTime
                                            }
                                            onChange={
                                                (event) => {

                                                    setSelectedTime(
                                                        event.target.value
                                                    )

                                                    resetAvailability()

                                                }
                                            }
                                            className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm outline-none focus:border-orange-400"
                                        >


                                            <option value="">
                                                Select Time
                                            </option>


                                            {availableTimes.map(
                                                (time) => (

                                                    <option
                                                        key={
                                                            time.value
                                                        }
                                                        value={
                                                            time.value
                                                        }
                                                    >
                                                        {time.label}
                                                    </option>

                                                )
                                            )}


                                        </select>


                                    </div>



                                    {/* GUEST COUNT */}

                                    <div>


                                        <label className="text-sm font-semibold text-gray-700">
                                            Number of Guests
                                        </label>


                                        <select
                                            value={guests}
                                            onChange={
                                                (event) => {

                                                    setGuests(
                                                        Number(
                                                            event.target.value
                                                        )
                                                    )

                                                    resetAvailability()

                                                }
                                            }
                                            className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm outline-none focus:border-orange-400"
                                        >


                                            {[
                                                1,
                                                2,
                                                3,
                                                4,
                                                5,
                                                6,
                                                7,
                                                8,
                                            ].map(
                                                (number) => (

                                                    <option
                                                        key={
                                                            number
                                                        }
                                                        value={
                                                            number
                                                        }
                                                    >
                                                        {number}{' '}

                                                        {number === 1
                                                            ? 'Guest'
                                                            : 'Guests'}

                                                    </option>

                                                )
                                            )}


                                        </select>


                                    </div>


                                </div>



                                {/* SEATING */}

                                <div className="mt-6">


                                    <label className="text-sm font-semibold text-gray-700">
                                        Seating Preference
                                    </label>


                                    <div className="mt-3 flex flex-wrap gap-3">


                                        {seatingOptions.map(
                                            (option) => (

                                                <button
                                                    key={
                                                        option.value
                                                    }
                                                    type="button"
                                                    onClick={
                                                        () => {

                                                            setSelectedSeating(
                                                                option.value
                                                            )

                                                            resetAvailability()

                                                        }
                                                    }
                                                    className={`rounded-full border px-5 py-2.5 text-sm font-medium transition ${selectedSeating === option.value
                                                        ? 'border-orange-500 bg-orange-500 text-white'
                                                        : 'border-gray-200 text-gray-600 hover:border-orange-400'
                                                        }`}
                                                >
                                                    {option.label}
                                                </button>

                                            )
                                        )}


                                    </div>


                                </div>



                                {/* CUSTOMER INFORMATION */}

                                <div className="mt-7 border-t border-gray-100 pt-6">


                                    <h3 className="font-bold text-gray-900">
                                        Customer Information
                                    </h3>


                                    <p className="mt-1 text-xs text-gray-500">
                                        Login-based customer information will replace this later.
                                    </p>



                                    <div className="mt-4 grid gap-4 md:grid-cols-2">


                                        <input
                                            type="text"
                                            value={
                                                customerName
                                            }
                                            onChange={
                                                (event) =>
                                                    setCustomerName(
                                                        event.target.value
                                                    )
                                            }
                                            placeholder="Your name"
                                            className="rounded-xl border border-gray-200 px-4 py-3.5 text-sm outline-none focus:border-orange-400"
                                        />


                                        <input
                                            type="tel"
                                            value={
                                                customerPhone
                                            }
                                            onChange={
                                                (event) =>
                                                    setCustomerPhone(
                                                        event.target.value
                                                    )
                                            }
                                            placeholder="Phone number"
                                            className="rounded-xl border border-gray-200 px-4 py-3.5 text-sm outline-none focus:border-orange-400"
                                        />


                                    </div>


                                </div>



                                {/* ERROR */}

                                {availabilityError && (

                                    <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                                        {availabilityError}
                                    </div>

                                )}



                                <button
                                    type="submit"
                                    disabled={
                                        checkingAvailability
                                    }
                                    className="mt-7 w-full rounded-xl bg-orange-500 px-6 py-4 font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                                >

                                    {checkingAvailability
                                        ? 'Checking Availability...'
                                        : 'Check Table Availability'}

                                </button>


                            </form>


                        </div>



                        {/* ====================================================
                            SUMMARY
                        ===================================================== */}

                        <aside className="h-fit rounded-3xl bg-[#1a5c38] p-7 text-white">


                            <p className="text-sm font-semibold text-white/60">
                                Your Reservation
                            </p>


                            <h3 className="mt-2 text-2xl font-bold">
                                {restaurant.name}
                            </h3>



                            <div className="mt-7 space-y-4 text-sm">


                                <div className="flex justify-between border-b border-white/10 pb-3">

                                    <span className="text-white/60">
                                        Branch
                                    </span>

                                    <span className="font-semibold">
                                        {selectedBranch?.name || '-'}
                                    </span>

                                </div>



                                <div className="flex justify-between border-b border-white/10 pb-3">

                                    <span className="text-white/60">
                                        Date
                                    </span>

                                    <span className="font-semibold">
                                        {bookingDate || '-'}
                                    </span>

                                </div>



                                <div className="flex justify-between border-b border-white/10 pb-3">

                                    <span className="text-white/60">
                                        Time
                                    </span>

                                    <span className="font-semibold">

                                        {
                                            availableTimes.find(
                                                (time) =>
                                                    time.value ===
                                                    selectedTime
                                            )?.label || '-'
                                        }

                                    </span>

                                </div>



                                <div className="flex justify-between border-b border-white/10 pb-3">

                                    <span className="text-white/60">
                                        Guests
                                    </span>

                                    <span className="font-semibold">
                                        {guests}
                                    </span>

                                </div>



                                <div className="flex justify-between">

                                    <span className="text-white/60">
                                        Seating
                                    </span>

                                    <span className="font-semibold">

                                        {
                                            seatingOptions.find(
                                                (option) =>
                                                    option.value ===
                                                    selectedSeating
                                            )?.label
                                        }

                                    </span>

                                </div>


                            </div>



                            {selectedTable && (

                                <div className="mt-7 rounded-2xl bg-white/10 p-4">


                                    <p className="text-xs text-white/60">
                                        Selected Table
                                    </p>


                                    <p className="mt-1 text-lg font-bold">
                                        {selectedTable.table_number}
                                    </p>


                                    <p className="mt-1 text-sm text-white/70">

                                        {selectedTable.capacity} seats

                                        {' • '}

                                        {selectedTable.seating_type}

                                    </p>


                                </div>

                            )}


                        </aside>


                    </div>



                    {/* ========================================================
                        AVAILABLE TABLES
                    ========================================================= */}

                    {availabilityChecked && (

                        <div className="mt-10">


                            <h3 className="text-2xl font-bold text-gray-900">
                                Available Tables
                            </h3>


                            <p className="mt-2 text-sm text-gray-500">
                                These results were checked against existing bookings in PostgreSQL.
                            </p>



                            {availableTables.length > 0 ? (

                                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">


                                    {availableTables.map(
                                        (table) => (

                                            <button
                                                key={
                                                    table.id
                                                }
                                                type="button"
                                                onClick={
                                                    () => {

                                                        setSelectedTable(
                                                            table
                                                        )

                                                        setBookingError('')
                                                        setBookingSuccess(null)

                                                    }
                                                }
                                                className={`rounded-2xl border p-6 text-left transition ${selectedTable?.id === table.id
                                                    ? 'border-orange-500 bg-orange-50'
                                                    : 'border-gray-200 bg-white hover:border-orange-300'
                                                    }`}
                                            >


                                                <div className="flex items-center justify-between">


                                                    <h4 className="text-lg font-bold text-gray-900">
                                                        {table.table_number}
                                                    </h4>


                                                    {selectedTable?.id === table.id && (

                                                        <span className="font-bold text-orange-500">
                                                            ✓
                                                        </span>

                                                    )}


                                                </div>



                                                <p className="mt-3 text-sm text-gray-500">
                                                    👥 Up to {table.capacity} guests
                                                </p>


                                                <p className="mt-2 text-sm text-gray-500">
                                                    🪑 {table.seating_type}
                                                </p>


                                                <p className="mt-4 text-xs font-semibold text-green-600">
                                                    ● Available
                                                </p>


                                            </button>

                                        )
                                    )}


                                </div>

                            ) : (

                                <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">


                                    <div className="text-4xl">
                                        🪑
                                    </div>


                                    <h4 className="mt-4 font-bold text-gray-900">
                                        No suitable tables available
                                    </h4>


                                    <p className="mt-2 text-sm text-gray-500">
                                        Try another time, guest count or seating preference.
                                    </p>


                                </div>

                            )}



                            {/* BOOKING ERROR */}

                            {bookingError && (

                                <div className="mt-7 rounded-xl bg-red-50 px-5 py-4 text-sm font-medium text-red-600">
                                    {bookingError}
                                </div>

                            )}



                            {/* BOOKING SUCCESS */}

                            {bookingSuccess && (

                                <div className="mt-7 rounded-2xl border border-green-200 bg-green-50 p-6">


                                    <p className="text-sm font-semibold text-green-600">
                                        ✓ Reservation Confirmed
                                    </p>


                                    <h4 className="mt-2 text-xl font-bold text-gray-900">
                                        Booking #{bookingSuccess.id}
                                    </h4>


                                    <div className="mt-4 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">


                                        <p>
                                            Restaurant:{' '}
                                            <strong>
                                                {bookingSuccess.restaurant_name}
                                            </strong>
                                        </p>


                                        <p>
                                            Branch:{' '}
                                            <strong>
                                                {bookingSuccess.branch_name}
                                            </strong>
                                        </p>


                                        <p>
                                            Table:{' '}
                                            <strong>
                                                {bookingSuccess.table_number}
                                            </strong>
                                        </p>


                                        <p>
                                            Guests:{' '}
                                            <strong>
                                                {bookingSuccess.guest_count}
                                            </strong>
                                        </p>


                                        <p>
                                            Date:{' '}
                                            <strong>
                                                {bookingSuccess.reservation_date}
                                            </strong>
                                        </p>


                                        <p>
                                            Status:{' '}
                                            <strong>
                                                {bookingSuccess.status}
                                            </strong>
                                        </p>


                                    </div>


                                </div>

                            )}



                            {/* RESERVE BUTTON */}

                            {selectedTable && (

                                <div className="mt-8 flex justify-end">


                                    <button
                                        type="button"
                                        disabled={
                                            creatingBooking
                                        }
                                        onClick={
                                            handleCreateBooking
                                        }
                                        className="rounded-xl bg-orange-500 px-8 py-4 font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                                    >

                                        {creatingBooking
                                            ? 'Creating Reservation...'
                                            : `Reserve ${selectedTable.table_number}`}

                                    </button>


                                </div>

                            )}


                        </div>

                    )}


                </div>


            </section>



            <Footer />


        </div>

    )

}


export default RestaurantDetails