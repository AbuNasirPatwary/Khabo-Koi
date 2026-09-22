import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

import kacchiImage from '../assets/images/landing/kacchi.png'
import burgerImage from '../assets/images/landing/burger.png'
import pizzaImage from '../assets/images/landing/pizza.png'
import chineseImage from '../assets/images/landing/chinese.png'
import seafoodImage from '../assets/images/landing/seafood.png'
import dessertsImage from '../assets/images/landing/desserts.png'


const API_BASE_URL = 'http://127.0.0.1:8000/api'


const categoryImages = {
    Kacchi: kacchiImage,
    Burger: burgerImage,
    Pizza: pizzaImage,
    Chinese: chineseImage,
    Seafood: seafoodImage,
    Desserts: dessertsImage,
}


function formatDate(dateString) {

    if (!dateString) return '-'

    const date = new Date(`${dateString}T00:00:00`)

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

    const [hours, minutes] = timeString.split(':')

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


function FoodPreorderPayment() {

    const { bookingId } = useParams()
    const location = useLocation()
    const navigate = useNavigate()

    const [context, setContext] = useState(null)
    const [foods, setFoods] = useState([])
    const [quantities, setQuantities] = useState({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')

    const [showPaymentModal, setShowPaymentModal] =
        useState(false)

    const [paymentMethod, setPaymentMethod] =
        useState('BKASH')

    const [demoPaymentValue, setDemoPaymentValue] =
        useState('01700000000')

    const [paymentData, setPaymentData] =
        useState(null)

    const [processingPayment, setProcessingPayment] =
        useState(false)


    useEffect(() => {

        const stateContext =
            location.state?.preorderContext

        if (stateContext) {

            setContext(stateContext)

            sessionStorage.setItem(
                'khabo_koi_preorder_context',
                JSON.stringify(stateContext)
            )

            return
        }


        const savedContext =
            sessionStorage.getItem(
                'khabo_koi_preorder_context'
            )


        if (savedContext) {

            try {

                setContext(
                    JSON.parse(savedContext)
                )

            } catch {

                setContext(null)

            }

        }

    }, [location.state])


    useEffect(() => {

        async function loadFoods() {

            try {

                setLoading(true)
                setError('')


                const response = await fetch(
                    `${API_BASE_URL}/foods/`
                )


                if (!response.ok) {

                    throw new Error(
                        'Could not load the restaurant menu.'
                    )

                }


                const data = await response.json()

                setFoods(
                    Array.isArray(data)
                        ? data
                        : []
                )

            } catch (requestError) {

                console.error(requestError)

                setError(
                    requestError.message
                )

            } finally {

                setLoading(false)

            }

        }


        loadFoods()

    }, [])


    const restaurantFoods = useMemo(() => {

        if (!context?.restaurant?.id) {
            return []
        }


        return foods.filter(
            (food) =>
                food.is_available &&
                Number(food.restaurant) ===
                Number(context.restaurant.id)
        )

    }, [foods, context])


    const selectedItems = useMemo(() => {

        return restaurantFoods
            .filter(
                (food) =>
                    Number(
                        quantities[food.id] || 0
                    ) > 0
            )
            .map(
                (food) => {

                    const quantity =
                        Number(
                            quantities[food.id]
                        )

                    const price =
                        Number(food.price)

                    return {
                        ...food,
                        quantity,
                        line_total:
                            price * quantity,
                    }

                }
            )

    }, [restaurantFoods, quantities])


    const subtotal = useMemo(() => {

        return selectedItems.reduce(
            (total, item) =>
                total + item.line_total,
            0
        )

    }, [selectedItems])


    const advanceAmount =
        Number((subtotal * 0.5).toFixed(2))

    const remainingAmount =
        Number((subtotal - advanceAmount).toFixed(2))


    function resetPayment() {

        setPaymentData(null)
        setShowPaymentModal(false)

    }


    function changeQuantity(foodId, amount) {

        setMessage('')
        resetPayment()

        setQuantities(
            (current) => {

                const next =
                    Math.max(
                        0,
                        Number(
                            current[foodId] || 0
                        ) + amount
                    )

                return {
                    ...current,
                    [foodId]: next,
                }

            }
        )

    }


    function openPaymentModal() {

        setMessage('')

        if (selectedItems.length === 0) {

            setMessage(
                'Please add at least one food item before making an advance payment.'
            )

            return
        }

        setShowPaymentModal(true)

    }


    function confirmDemoPayment(event) {

        event.preventDefault()

        if (!demoPaymentValue.trim()) {
            return
        }


        setProcessingPayment(true)


        setTimeout(() => {

            const transactionId =
                `KK-PAY-${bookingId}-${Date.now()
                    .toString()
                    .slice(-6)}`


            setPaymentData({
                status: 'PAID',
                method: paymentMethod,
                transaction_id:
                    transactionId,
                paid_amount:
                    advanceAmount,
                remaining_amount:
                    remainingAmount,
                paid_at:
                    new Date().toISOString(),
            })


            setProcessingPayment(false)
            setShowPaymentModal(false)

        }, 650)

    }


    function continueToConfirmation() {

        if (selectedItems.length === 0) {

            setMessage(
                'Please add at least one food item, or choose Skip Food Pre-order.'
            )

            return

        }


        if (!paymentData) {

            setMessage(
                'Please complete the 50% demo advance payment before confirming the food pre-order.'
            )

            return

        }


        const preorder = {
            booking_id:
                context?.booking?.id ||
                Number(bookingId),

            restaurant:
                context?.restaurant,

            branch:
                context?.branch,

            items:
                selectedItems.map(
                    (item) => ({
                        id: item.id,
                        name: item.name,
                        price: Number(item.price),
                        quantity: item.quantity,
                        line_total: item.line_total,
                    })
                ),

            subtotal,
            advance_amount:
                advanceAmount,
            remaining_amount:
                remainingAmount,

            payment:
                paymentData,

            special_request:
                context?.special_request || '',
        }


        sessionStorage.setItem(
            `khabo_koi_preorder_${bookingId}`,
            JSON.stringify(preorder)
        )


        const confirmation = {
            ...context,
            preorder,
        }


        sessionStorage.setItem(
            'khabo_koi_confirmation_context',
            JSON.stringify(confirmation)
        )


        navigate(
            `/booking/${bookingId}/confirmation`,
            {
                state: {
                    confirmation,
                },
            }
        )

    }


    function skipFoodPreorder() {

        const confirmation = {
            ...context,
            preorder: null,
        }


        sessionStorage.setItem(
            'khabo_koi_confirmation_context',
            JSON.stringify(confirmation)
        )


        navigate(
            `/booking/${bookingId}/confirmation`,
            {
                state: {
                    confirmation,
                },
            }
        )

    }


    if (!context) {

        return (

            <div className="min-h-screen bg-[#fdf8f0]">

                <Navbar />


                <main className="mx-auto max-w-4xl px-6 py-20 text-center">

                    <div className="rounded-3xl bg-white p-10 shadow-sm ring-1 ring-gray-100">

                        <div className="text-5xl">
                            🍽️
                        </div>


                        <h1 className="mt-5 text-3xl font-extrabold text-gray-900">
                            Booking information is missing
                        </h1>


                        <p className="mt-3 text-gray-500">
                            Start from a restaurant booking so Khabo-Koi can connect your food pre-order to the correct reservation.
                        </p>


                        <button
                            type="button"
                            onClick={() =>
                                navigate('/restaurants')
                            }
                            className="mt-7 rounded-xl bg-orange-500 px-6 py-3 font-bold text-white hover:bg-orange-600"
                        >
                            Browse Restaurants
                        </button>

                    </div>

                </main>


                <Footer />

            </div>

        )

    }


    return (

        <div className="min-h-screen bg-[#fdf8f0]">

            <Navbar />


            <main className="mx-auto max-w-7xl px-6 py-12">

                {/* PAGE HEADER */}

                <div className="mb-8">

                    <p className="text-sm font-bold uppercase tracking-widest text-orange-500">
                        Food Pre-order
                    </p>


                    <h1 className="mt-2 text-4xl font-extrabold text-gray-900">
                        Add food to your reservation
                    </h1>


                    <p className="mt-2 max-w-2xl text-gray-500">
                        Choose food from {context.restaurant?.name}. Your table reservation has already been created.
                    </p>

                </div>


                {/* BOOKING INFORMATION */}

                <section className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">

                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                        <div>

                            <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
                                Booking #{context.booking?.id || bookingId}
                            </p>

                            <h2 className="mt-2 text-2xl font-extrabold text-gray-900">
                                {context.restaurant?.name}
                            </h2>

                            <p className="mt-1 text-gray-500">
                                📍 {context.branch?.name}
                            </p>

                        </div>


                        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:max-w-3xl lg:grid-cols-4">

                            <div className="rounded-2xl bg-gray-50 p-4">

                                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                    Date
                                </p>

                                <p className="mt-1 font-bold text-gray-900">
                                    {formatDate(
                                        context.reservation_date
                                    )}
                                </p>

                            </div>


                            <div className="rounded-2xl bg-gray-50 p-4">

                                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                    Time
                                </p>

                                <p className="mt-1 font-bold text-gray-900">
                                    {formatTime(
                                        context.start_time
                                    )}
                                </p>

                            </div>


                            <div className="rounded-2xl bg-gray-50 p-4">

                                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                    Guests
                                </p>

                                <p className="mt-1 font-bold text-gray-900">
                                    {context.guest_count}
                                </p>

                            </div>


                            <div className="rounded-2xl bg-gray-50 p-4">

                                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                    Table
                                </p>

                                <p className="mt-1 font-bold text-gray-900">
                                    {context.table?.table_number}
                                </p>

                            </div>

                        </div>

                    </div>

                </section>


                <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">

                    {/* MENU */}

                    <section>

                        <div className="mb-5">

                            <h2 className="text-2xl font-extrabold text-gray-900">
                                Restaurant Menu
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Only currently available food items from this restaurant are shown.
                            </p>

                        </div>


                        {loading && (

                            <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-100">
                                Loading menu...
                            </div>

                        )}


                        {error && (

                            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-600">
                                {error}
                            </div>

                        )}


                        {!loading &&
                            !error &&
                            restaurantFoods.length === 0 && (

                                <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center">

                                    <div className="text-5xl">
                                        🍽️
                                    </div>

                                    <h3 className="mt-4 text-xl font-bold text-gray-900">
                                        No preorder items available
                                    </h3>

                                    <p className="mt-2 text-sm text-gray-500">
                                        This restaurant does not currently have an available food item in the menu API.
                                    </p>

                                </div>

                            )}


                        {!loading &&
                            !error &&
                            restaurantFoods.length > 0 && (

                                <div className="grid gap-5 md:grid-cols-2">

                                    {restaurantFoods.map(
                                        (food) => {

                                            const quantity =
                                                Number(
                                                    quantities[food.id] || 0
                                                )

                                            const image =
                                                food.image_url ||
                                                categoryImages[food.category] ||
                                                kacchiImage


                                            return (

                                                <article
                                                    key={food.id}
                                                    className={`overflow-hidden rounded-3xl border bg-white shadow-sm transition ${quantity > 0
                                                            ? 'border-orange-400 ring-2 ring-orange-100'
                                                            : 'border-gray-200'
                                                        }`}
                                                >

                                                    <div className="h-48 overflow-hidden">

                                                        <img
                                                            src={image}
                                                            alt={food.name}
                                                            className="h-full w-full object-cover"
                                                        />

                                                    </div>


                                                    <div className="p-5">

                                                        <div className="flex items-start justify-between gap-4">

                                                            <div>

                                                                <p className="text-xs font-bold uppercase tracking-wider text-orange-500">
                                                                    {food.category}
                                                                </p>

                                                                <h3 className="mt-1 text-lg font-extrabold text-gray-900">
                                                                    {food.name}
                                                                </h3>

                                                            </div>


                                                            <span className="whitespace-nowrap text-lg font-extrabold text-orange-600">
                                                                ৳{Number(food.price).toFixed(0)}
                                                            </span>

                                                        </div>


                                                        {food.description && (

                                                            <p className="mt-3 text-sm leading-6 text-gray-500">
                                                                {food.description}
                                                            </p>

                                                        )}


                                                        <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">

                                                            <span className="text-sm font-semibold text-gray-500">
                                                                ★ {food.rating}
                                                            </span>


                                                            <div className="flex items-center gap-3">

                                                                <button
                                                                    type="button"
                                                                    disabled={quantity === 0}
                                                                    onClick={() =>
                                                                        changeQuantity(
                                                                            food.id,
                                                                            -1
                                                                        )
                                                                    }
                                                                    className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 font-bold text-gray-700 disabled:opacity-30"
                                                                >
                                                                    −
                                                                </button>


                                                                <span className="min-w-6 text-center font-extrabold text-gray-900">
                                                                    {quantity}
                                                                </span>


                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        changeQuantity(
                                                                            food.id,
                                                                            1
                                                                        )
                                                                    }
                                                                    className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 font-bold text-white hover:bg-orange-600"
                                                                >
                                                                    +
                                                                </button>

                                                            </div>

                                                        </div>

                                                    </div>

                                                </article>

                                            )

                                        }
                                    )}

                                </div>

                            )}

                    </section>


                    {/* ORDER SUMMARY */}

                    <aside className="h-fit rounded-3xl bg-white p-7 shadow-sm ring-1 ring-gray-100 lg:sticky lg:top-6">

                        <p className="text-sm font-bold uppercase tracking-widest text-orange-500">
                            Your Order
                        </p>


                        <h2 className="mt-2 text-2xl font-extrabold text-gray-900">
                            Pre-order Summary
                        </h2>


                        <div className="mt-6 space-y-4">

                            {selectedItems.length === 0 ? (

                                <div className="rounded-2xl bg-gray-50 p-5 text-sm text-gray-500">
                                    No food added yet.
                                </div>

                            ) : (

                                selectedItems.map(
                                    (item) => (

                                        <div
                                            key={item.id}
                                            className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4"
                                        >

                                            <div>

                                                <p className="font-bold text-gray-900">
                                                    {item.name}
                                                </p>

                                                <p className="mt-1 text-xs text-gray-500">
                                                    {item.quantity} × ৳{Number(item.price).toFixed(0)}
                                                </p>

                                            </div>


                                            <p className="font-extrabold text-gray-900">
                                                ৳{item.line_total.toFixed(0)}
                                            </p>

                                        </div>

                                    )
                                )

                            )}

                        </div>


                        <div className="mt-6 space-y-3 border-t border-gray-100 pt-5">

                            <div className="flex justify-between text-sm text-gray-500">

                                <span>
                                    Table reservation
                                </span>

                                <span>
                                    ৳0
                                </span>

                            </div>


                            <div className="flex justify-between text-sm text-gray-500">

                                <span>
                                    Food subtotal
                                </span>

                                <span>
                                    ৳{subtotal.toFixed(0)}
                                </span>

                            </div>


                            <div className="flex justify-between border-t border-gray-100 pt-4 text-lg font-extrabold text-gray-900">

                                <span>
                                    Order total
                                </span>

                                <span>
                                    ৳{subtotal.toFixed(0)}
                                </span>

                            </div>

                        </div>


                        {/* ADVANCE PAYMENT */}

                        <div className="mt-6 rounded-2xl border border-orange-100 bg-orange-50 p-5">

                            <div className="flex items-start justify-between gap-4">

                                <div>

                                    <p className="text-sm font-bold text-orange-600">
                                        Advance Payment
                                    </p>

                                    <h3 className="mt-1 text-lg font-extrabold text-gray-900">
                                        50% required for food pre-order
                                    </h3>

                                </div>


                                {paymentData && (

                                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-extrabold text-green-700">
                                        PAID
                                    </span>

                                )}

                            </div>


                            <div className="mt-5 space-y-3 border-t border-orange-100 pt-4">

                                <div className="flex justify-between text-sm">

                                    <span className="text-gray-500">
                                        Food preorder total
                                    </span>

                                    <span className="font-bold text-gray-900">
                                        ৳{subtotal.toFixed(0)}
                                    </span>

                                </div>


                                <div className="flex justify-between text-sm">

                                    <span className="text-gray-500">
                                        Pay now (50%)
                                    </span>

                                    <span className="font-extrabold text-orange-600">
                                        ৳{advanceAmount.toFixed(0)}
                                    </span>

                                </div>


                                <div className="flex justify-between text-sm">

                                    <span className="text-gray-500">
                                        Remaining at restaurant
                                    </span>

                                    <span className="font-bold text-gray-900">
                                        ৳{remainingAmount.toFixed(0)}
                                    </span>

                                </div>

                            </div>


                            {paymentData ? (

                                <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">

                                    <p className="font-extrabold text-green-700">
                                        ✓ Advance payment successful
                                    </p>

                                    <p className="mt-2 text-xs text-green-700">
                                        Method: {paymentData.method}
                                    </p>

                                    <p className="mt-1 break-all text-xs text-green-700">
                                        Transaction: {paymentData.transaction_id}
                                    </p>

                                </div>

                            ) : (

                                <button
                                    type="button"
                                    disabled={subtotal === 0}
                                    onClick={openPaymentModal}
                                    className="mt-5 w-full rounded-xl bg-orange-500 px-5 py-3.5 font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Pay ৳{advanceAmount.toFixed(0)} Advance
                                </button>

                            )}


                            <p className="mt-4 text-xs leading-5 text-gray-500">
                                Pay 50% now to confirm your food pre-order. The remaining amount will be paid at the restaurant.
                            </p>

                        </div>


                        {context.special_request && (

                            <div className="mt-5 rounded-2xl bg-gray-50 p-5">

                                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                    Special Request
                                </p>

                                <p className="mt-2 text-sm leading-6 text-gray-700">
                                    {context.special_request}
                                </p>

                            </div>

                        )}


                        {message && (

                            <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                                {message}
                            </div>

                        )}


                        <button
                            type="button"
                            onClick={continueToConfirmation}
                            className="mt-6 w-full rounded-xl bg-orange-500 px-5 py-4 font-bold text-white transition hover:bg-orange-600"
                        >
                            Confirm Food Pre-order
                        </button>


                        <button
                            type="button"
                            onClick={skipFoodPreorder}
                            className="mt-3 w-full rounded-xl border border-gray-200 bg-white px-5 py-4 font-bold text-gray-800 transition hover:bg-gray-50"
                        >
                            Skip Food Pre-order
                        </button>


                        <p className="mt-5 text-center text-xs leading-5 text-gray-400">
                            Your table reservation is already confirmed.
                        </p>

                    </aside>

                </div>

            </main>


            <Footer />


            {/* SECURE PAYMENT MODAL */}

            {showPaymentModal && (

                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">

                    <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">

                        <div className="flex items-start justify-between gap-4">

                            <div>

                                <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
                                    Secure Payment
                                </p>

                                <h2 className="mt-2 text-2xl font-extrabold text-gray-900">
                                    Pay ৳{advanceAmount.toFixed(0)} Advance
                                </h2>

                                <p className="mt-2 text-sm text-gray-500">
                                    Complete the 50% advance payment required for your food pre-order.
                                </p>

                            </div>


                            <button
                                type="button"
                                onClick={() =>
                                    setShowPaymentModal(false)
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-lg font-bold text-gray-600"
                            >
                                ×
                            </button>

                        </div>


                        <form
                            onSubmit={confirmDemoPayment}
                            className="mt-6"
                        >

                            <label className="text-sm font-bold text-gray-700">
                                Payment Method
                            </label>


                            <div className="mt-3 grid grid-cols-3 gap-2">

                                {[
                                    ['BKASH', 'bKash'],
                                    ['NAGAD', 'Nagad'],
                                    ['CARD', 'Card'],
                                ].map(
                                    ([value, label]) => (

                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => {
                                                setPaymentMethod(value)

                                                setDemoPaymentValue(
                                                    value === 'CARD'
                                                        ? '4111 1111 1111 1111'
                                                        : '01700000000'
                                                )
                                            }}
                                            className={`rounded-xl border px-3 py-3 text-sm font-bold ${paymentMethod === value
                                                    ? 'border-orange-500 bg-orange-50 text-orange-600'
                                                    : 'border-gray-200 text-gray-600'
                                                }`}
                                        >
                                            {label}
                                        </button>

                                    )
                                )}

                            </div>


                            <label className="mt-5 block text-sm font-bold text-gray-700">

                                {paymentMethod === 'CARD'
                                    ? 'Card Number'
                                    : 'Mobile Number'}

                                <input
                                    type="text"
                                    value={demoPaymentValue}
                                    onChange={(event) =>
                                        setDemoPaymentValue(
                                            event.target.value
                                        )
                                    }
                                    required
                                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3.5 font-normal outline-none focus:border-orange-400"
                                />

                            </label>


                            <div className="mt-5 rounded-xl bg-gray-50 p-4">

                                <div className="flex justify-between text-sm">

                                    <span className="text-gray-500">
                                        Food total
                                    </span>

                                    <span className="font-bold">
                                        ৳{subtotal.toFixed(0)}
                                    </span>

                                </div>

                                <div className="mt-2 flex justify-between text-sm">

                                    <span className="text-gray-500">
                                        Paying now
                                    </span>

                                    <span className="font-extrabold text-orange-600">
                                        ৳{advanceAmount.toFixed(0)}
                                    </span>

                                </div>

                                <div className="mt-2 flex justify-between text-sm">

                                    <span className="text-gray-500">
                                        Remaining
                                    </span>

                                    <span className="font-bold">
                                        ৳{remainingAmount.toFixed(0)}
                                    </span>

                                </div>

                            </div>


                            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-700">
                                Your payment details are used to confirm the advance amount for this preorder.
                            </div>


                            <button
                                type="submit"
                                disabled={processingPayment}
                                className="mt-5 w-full rounded-xl bg-orange-500 px-5 py-4 font-bold text-white hover:bg-orange-600 disabled:opacity-60"
                            >
                                {processingPayment
                                    ? 'Processing Secure Payment...'
                                    : `Confirm Secure Payment ৳${advanceAmount.toFixed(0)}`}
                            </button>

                        </form>

                    </div>

                </div>

            )}

        </div>

    )

}


export default FoodPreorderPayment
