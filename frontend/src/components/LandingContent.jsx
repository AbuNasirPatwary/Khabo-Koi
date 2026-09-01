import kacchiImage from '../assets/images/landing/kacchi.png'
import burgerImage from '../assets/images/landing/burger.png'
import pizzaImage from '../assets/images/landing/pizza.png'
import chineseImage from '../assets/images/landing/chinese.png'
import seafoodImage from '../assets/images/landing/seafood.png'
import dessertsImage from '../assets/images/landing/desserts.png'

import sultansDineImage from '../assets/images/landing/sultans-dine.png'
import chilloxImage from '../assets/images/landing/chillox.png'
import madchefImage from '../assets/images/landing/madchef.png'
import kacchiBhaiImage from '../assets/images/landing/kacchi-bhai.png'

import tableBookingImage from '../assets/images/landing/table-booking.png'

import tanvirImage from '../assets/images/landing/tanvir.png'
import samihaImage from '../assets/images/landing/samiha.png'


// -----------------------------------------------------------------------------
// TEMPORARY LANDING PAGE DATA
// -----------------------------------------------------------------------------
// For now this information lives inside React so we can complete the frontend.
//
// Later:
// Categories, restaurants, ratings, locations and table availability
// will come from the Django REST API / PostgreSQL database.
// -----------------------------------------------------------------------------

const categories = [
    {
        name: 'Kacchi',
        restaurants: 38,
        image: kacchiImage,
    },
    {
        name: 'Burger',
        restaurants: 52,
        image: burgerImage,
    },
    {
        name: 'Pizza',
        restaurants: 34,
        image: pizzaImage,
    },
    {
        name: 'Chinese',
        restaurants: 27,
        image: chineseImage,
    },
    {
        name: 'Seafood',
        restaurants: 21,
        image: seafoodImage,
    },
    {
        name: 'Desserts',
        restaurants: 45,
        image: dessertsImage,
    },
]


const restaurants = [
    {
        name: "Sultan's Dine",
        category: 'Kacchi & Bengali',
        location: 'Dhanmondi',
        price: '৳৳',
        rating: '4.8',
        tables: 12,
        status: 'Open Now',
        image: sultansDineImage,
    },
    {
        name: 'Chillox',
        category: 'Burgers & Fast Food',
        location: 'Banani',
        price: '৳৳',
        rating: '4.7',
        tables: 8,
        status: 'Open Now',
        image: chilloxImage,
    },
    {
        name: 'Madchef',
        category: 'Burgers & Continental',
        location: 'Uttara',
        price: '৳৳',
        rating: '4.6',
        tables: 5,
        status: 'Open Now',
        image: madchefImage,
    },
    {
        name: 'Kacchi Bhai',
        category: 'Kacchi & Bengali',
        location: 'Mirpur',
        price: '৳৳',
        rating: '4.7',
        tables: 2,
        status: 'Few Tables Left',
        image: kacchiBhaiImage,
    },
]


const steps = [
    {
        number: '1',
        icon: '⌕',
        title: 'Discover',
        description:
            "Search by restaurant name, food item or location to find exactly what you're craving.",
    },
    {
        number: '2',
        icon: '▣',
        title: 'Reserve',
        description:
            'Select a branch, date, time, guest number and seating preference that suits you.',
    },
    {
        number: '3',
        icon: '♨',
        title: 'Dine',
        description:
            'Pre-order food if needed, arrive on time and enjoy your meal without the wait.',
    },
]


const testimonials = [
    {
        name: 'Nusrat Jahan',
        role: 'Regular Diner · Dhanmondi',
        image: null,
        initials: 'NJ',
        review:
            "Finding a good restaurant used to take forever. With Khabo-Koi I discovered Sultan's Dine in minutes and booked a table for my anniversary without any hassle.",
    },
    {
        name: 'Tanvir Ahmed',
        role: 'Food Enthusiast · Banani',
        image: tanvirImage,
        review:
            'The table reservation feature is brilliant. I chose a window seat for my family dinner, pre-ordered our food and we were seated immediately when we arrived.',
    },
    {
        name: 'Samiha Rahman',
        role: 'Working Professional · Uttara',
        image: samihaImage,
        review:
            'Pre-ordering through Khabo-Koi saved us so much time. Our food was ready when we sat down — no waiting, no stress.',
    },
]


function CheckItem({ children }) {
    return (
        <div className="flex items-center gap-3">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                ✓
            </span>

            <span className="text-sm text-gray-800">
                {children}
            </span>
        </div>
    )
}


function LandingContent() {
    return (
        <>

            {/* ================================================================
                CATEGORY SECTION
            ================================================================= */}
            <section className="bg-white py-20">

                <div className="mx-auto max-w-7xl px-6">

                    <div className="text-center">

                        <p className="text-sm font-semibold uppercase tracking-wider text-orange-500">
                            Explore by category
                        </p>

                        <h2 className="mt-3 text-3xl font-bold text-gray-900 md:text-4xl">
                            What are you craving today?
                        </h2>

                        <p className="mt-4 text-gray-500">
                            Find restaurants based on the food you want to enjoy.
                        </p>

                    </div>


                    <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">

                        {categories.map((category) => (

                            <button
                                key={category.name}
                                type="button"
                                className="group relative h-[270px] overflow-hidden rounded-2xl text-left"
                            >

                                <img
                                    src={category.image}
                                    alt={category.name}
                                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                />

                                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

                                <div className="absolute bottom-0 left-0 p-4">

                                    <h3 className="text-lg font-bold text-white">
                                        {category.name}
                                    </h3>

                                    <p className="mt-1 text-sm text-white/70">
                                        {category.restaurants} restaurants
                                    </p>

                                </div>

                            </button>

                        ))}

                    </div>

                </div>

            </section>



            {/* ================================================================
                POPULAR RESTAURANTS
            ================================================================= */}
            <section className="bg-[#fdf8f0] py-20">

                <div className="mx-auto max-w-7xl px-6">

                    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">

                        <div>

                            <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">
                                Popular restaurants near you
                            </h2>

                            <p className="mt-3 text-gray-500">
                                Discover highly rated restaurants and reserve your table in advance.
                            </p>

                        </div>


                        <button
                            type="button"
                            className="font-semibold text-orange-500 hover:text-orange-600"
                        >
                            View All Restaurants →
                        </button>

                    </div>


                    <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

                        {restaurants.map((restaurant) => (

                            <article
                                key={restaurant.name}
                                className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
                            >

                                <div className="relative h-48">

                                    <img
                                        src={restaurant.image}
                                        alt={restaurant.name}
                                        className="h-full w-full object-cover"
                                    />


                                    <span
                                        className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${restaurant.status === 'Open Now'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-orange-100 text-orange-600'
                                            }`}
                                    >
                                        {restaurant.status}
                                    </span>

                                </div>


                                <div className="p-5">

                                    <div className="flex justify-between gap-3">

                                        <div>

                                            <h3 className="text-lg font-bold text-gray-900">
                                                {restaurant.name}
                                            </h3>

                                            <p className="mt-1 text-sm text-gray-500">
                                                {restaurant.category}
                                            </p>

                                        </div>


                                        <div className="flex items-start gap-1 text-sm font-semibold">
                                            <span className="text-yellow-500">
                                                ★
                                            </span>

                                            {restaurant.rating}
                                        </div>

                                    </div>


                                    <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">

                                        <span>
                                            📍 {restaurant.location}
                                        </span>

                                        <span>
                                            {restaurant.price}
                                        </span>

                                    </div>


                                    {/* Later this table count will be returned
                                        from the availability API. */}
                                    <p className="mt-4 text-xs font-medium text-green-700">
                                        ✓ {restaurant.tables} tables available
                                    </p>


                                    <button
                                        type="button"
                                        className="mt-5 w-full rounded-xl border border-orange-500 py-2.5 text-sm font-semibold text-orange-500 transition hover:bg-orange-500 hover:text-white"
                                    >
                                        View Restaurant
                                    </button>

                                </div>

                            </article>

                        ))}

                    </div>

                </div>

            </section>



            {/* ================================================================
                HOW IT WORKS
            ================================================================= */}
            <section
                id="how-it-works"
                className="bg-[#f0ebe0] py-20"
            >

                <div className="mx-auto max-w-7xl px-6">

                    <h2 className="text-center text-3xl font-bold text-gray-900 md:text-4xl">
                        Book your dining experience in{' '}
                        <span className="text-orange-500">
                            three simple steps
                        </span>
                    </h2>


                    <div className="mt-14 grid gap-6 md:grid-cols-3">

                        {steps.map((step) => (

                            <div
                                key={step.number}
                                className="rounded-2xl border border-gray-200 bg-white p-8 text-center"
                            >

                                <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-2xl text-orange-500">

                                    {step.icon}

                                    <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                                        {step.number}
                                    </span>

                                </div>


                                <h3 className="mt-5 text-xl font-bold text-gray-900">
                                    {step.title}
                                </h3>


                                <p className="mt-3 text-sm leading-6 text-gray-500">
                                    {step.description}
                                </p>

                            </div>

                        ))}

                    </div>

                </div>

            </section>



            {/* ================================================================
                TABLE BOOKING FEATURE
            ================================================================= */}
            <section className="bg-[#fdf8f0] py-20">

                <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-2 lg:items-center">

                    <div className="h-[500px] overflow-hidden rounded-3xl">

                        <img
                            src={tableBookingImage}
                            alt="Restaurant table booking"
                            className="h-full w-full object-cover"
                        />

                    </div>


                    <div>

                        <p className="font-semibold text-orange-500">
                            — Smart Table Booking
                        </p>


                        <h2 className="mt-5 text-3xl font-bold leading-tight text-gray-900 md:text-4xl">
                            Choose your table before reaching the restaurant.
                        </h2>


                        <p className="mt-6 leading-7 text-gray-500">
                            Check table availability, select your preferred seating
                            area and reduce waiting time by reserving in advance.
                        </p>


                        <div className="mt-8 space-y-4">

                            <CheckItem>
                                Select booking date and arrival time
                            </CheckItem>

                            <CheckItem>
                                Enter the number of guests
                            </CheckItem>

                            <CheckItem>
                                Choose indoor, outdoor or window-side seating
                            </CheckItem>

                            <CheckItem>
                                Avoid unavailable or already-booked tables
                            </CheckItem>

                            <CheckItem>
                                Pre-order meals before arrival
                            </CheckItem>

                        </div>


                        <div className="mt-9 flex flex-wrap gap-3">

                            <button
                                type="button"
                                className="rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white hover:bg-orange-600"
                            >
                                Book a Table
                            </button>


                            <button
                                type="button"
                                className="rounded-xl border border-gray-300 px-6 py-3 font-semibold text-gray-900 hover:bg-white"
                            >
                                Explore Restaurants
                            </button>

                        </div>

                    </div>

                </div>

            </section>



            {/* ================================================================
                PRE-ORDER FEATURE
            ================================================================= */}
            <section className="bg-white py-20">

                <div className="mx-auto grid max-w-7xl gap-16 px-6 lg:grid-cols-2 lg:items-center">

                    <div>

                        <h2 className="text-3xl font-bold leading-tight text-gray-900 md:text-4xl">
                            Spend less time waiting and{' '}
                            <span className="text-orange-500">
                                more time dining.
                            </span>
                        </h2>


                        <p className="mt-6 max-w-lg leading-7 text-gray-500">
                            Add food to your booking before arriving. Your restaurant
                            can prepare the order according to your reservation time.
                        </p>


                        <div className="mt-8 space-y-4">

                            <div className="rounded-2xl bg-[#f0ebe0] p-5">

                                <h3 className="font-semibold text-gray-900">
                                    🍽 Browse restaurant menus
                                </h3>

                                <p className="mt-1 text-sm text-gray-500">
                                    Explore complete menus and pick your favourites ahead of time.
                                </p>

                            </div>


                            <div className="rounded-2xl bg-[#f0ebe0] p-5">

                                <h3 className="font-semibold text-gray-900">
                                    🛒 Add food to your reservation
                                </h3>

                                <p className="mt-1 text-sm text-gray-500">
                                    Attach your food order directly to your table booking.
                                </p>

                            </div>


                            <div className="rounded-2xl bg-[#f0ebe0] p-5">

                                <h3 className="font-semibold text-gray-900">
                                    🔒 Pay an advance amount securely
                                </h3>

                                <p className="mt-1 text-sm text-gray-500">
                                    Confirm with a secure advance payment and arrive worry-free.
                                </p>

                            </div>

                        </div>


                        <button
                            type="button"
                            className="mt-6 rounded-xl bg-orange-500 px-7 py-3 font-semibold text-white hover:bg-orange-600"
                        >
                            Explore Food
                        </button>

                    </div>



                    {/* PRE-ORDER PREVIEW
                        Static UI for now.
                        Later this will use actual booking + food order data. */}
                    <div className="rounded-3xl bg-[#f0ebe0] p-6">

                        <div className="flex items-center justify-between">

                            <h3 className="font-bold text-gray-900">
                                Your Pre-Order
                            </h3>

                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                Confirmed
                            </span>

                        </div>


                        <div className="mt-5 space-y-4">

                            {[
                                ['Mutton Kacchi Biryani', 'Qty: 2', '৳580'],
                                ['Chicken Tikka Platter', 'Qty: 1', '৳350'],
                                ['Borhani', 'Qty: 2', '৳90'],
                            ].map(([name, quantity, price]) => (

                                <div
                                    key={name}
                                    className="flex items-center justify-between rounded-xl bg-white p-4"
                                >

                                    <div>

                                        <p className="text-sm font-medium text-gray-900">
                                            {name}
                                        </p>

                                        <p className="mt-1 text-xs text-gray-500">
                                            {quantity}
                                        </p>

                                    </div>


                                    <span className="text-sm font-semibold">
                                        {price}
                                    </span>

                                </div>

                            ))}

                        </div>


                        <div className="mt-5 flex items-center justify-between border-t border-gray-300 pt-4">

                            <span className="text-sm font-semibold text-gray-500">
                                Total (advance)
                            </span>

                            <span className="text-xl font-bold text-orange-500">
                                ৳1,020
                            </span>

                        </div>


                        <div className="mt-4 rounded-xl bg-green-50 p-3 text-xs text-green-700">
                            ✓ Ready at your reservation time · Sultan's Dine, Dhanmondi
                        </div>

                    </div>

                </div>

            </section>



            {/* ================================================================
                USER ACCESS
            ================================================================= */}
            <section className="bg-[#fdf8f0] py-20">

                <div className="mx-auto max-w-7xl px-6">

                    <h2 className="text-center text-3xl font-bold text-gray-900 md:text-4xl">
                        One platform for every part of the dining experience
                    </h2>


                    <div className="mt-12 grid items-start gap-6 lg:grid-cols-3">


                        <div className="rounded-3xl bg-orange-500 p-8 text-white">

                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-2xl">
                                👤
                            </div>


                            <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-white/80">
                                For Customers
                            </p>


                            <h3 className="mt-2 text-2xl font-bold">
                                Dine your way.
                            </h3>


                            <p className="mt-4 text-sm leading-6 text-white/80">
                                Discover restaurants, book tables and pre-order meals —
                                all in one place before you even step out the door.
                            </p>


                            <div className="mt-5 space-y-2 text-sm text-white/90">

                                <p>✓ Explore restaurants and food</p>
                                <p>✓ Reserve tables in advance</p>
                                <p>✓ Pre-order and pay securely</p>

                            </div>


                            <button
                                type="button"
                                className="mt-7 w-full rounded-xl bg-white py-3 font-bold text-orange-500"
                            >
                                Create Customer Account
                            </button>

                        </div>



                        <div className="rounded-3xl border border-gray-200 bg-white p-8">

                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-2xl">
                                🏪
                            </div>


                            <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-green-800">
                                For Restaurant Managers
                            </p>


                            <h3 className="mt-2 text-2xl font-bold text-gray-900">
                                Grow your restaurant.
                            </h3>


                            <p className="mt-4 text-sm leading-6 text-gray-500">
                                Manage branches, tables, menus, reservations and
                                pre-orders from a single professional dashboard.
                            </p>


                            <button
                                type="button"
                                className="mt-7 w-full rounded-xl bg-green-800 py-3 font-bold text-white"
                            >
                                Register Your Restaurant
                            </button>

                        </div>



                        <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-8">

                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-2xl">
                                🔐
                            </div>


                            <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Platform Administration
                            </p>


                            <h3 className="mt-2 text-xl font-bold text-gray-900">
                                Admin Access
                            </h3>


                            <p className="mt-4 text-sm text-gray-500">
                                Secure access for authorized platform administrators.
                            </p>


                            <button
                                type="button"
                                className="mt-6 text-sm text-gray-500 underline"
                            >
                                Admin Sign In →
                            </button>

                        </div>

                    </div>

                </div>

            </section>



            {/* ================================================================
                RESTAURANT MANAGER PROMO
            ================================================================= */}
            <section id="for-restaurants" className="bg-[#1a5c38] py-20 text-white">

                <div className="mx-auto grid max-w-7xl gap-16 px-6 lg:grid-cols-2 lg:items-center">

                    <div>

                        <p className="text-sm font-semibold text-white/70">
                            ◈ Khabo-Koi for Restaurants
                        </p>


                        <h2 className="mt-6 text-3xl font-bold leading-tight md:text-4xl">
                            Manage your restaurant operations from one dashboard.
                        </h2>


                        <p className="mt-6 leading-7 text-white/70">
                            Create branches, organize tables, update menus, manage
                            reservations, review pre-orders and define booking policies.
                        </p>


                        <div className="mt-7 grid gap-3 text-sm text-white/80 sm:grid-cols-2">

                            <p>✓ Branch management</p>
                            <p>✓ Table and seating management</p>
                            <p>✓ Menu and price management</p>
                            <p>✓ Reservation management</p>
                            <p>✓ Pre-order tracking</p>
                            <p>✓ Restaurant-specific policies</p>

                        </div>


                        <div className="mt-8 flex flex-wrap items-center gap-5">

                            <button
                                type="button"
                                className="rounded-xl bg-orange-500 px-7 py-3 font-bold text-white"
                            >
                                Register Your Restaurant
                            </button>


                            <button
                                type="button"
                                className="text-sm text-white/70 underline"
                            >
                                Manager Sign In
                            </button>

                        </div>

                    </div>



                    {/* DASHBOARD PREVIEW
                        This is only a visual preview on the landing page.
                        Real manager data will be implemented later. */}
                    <div className="rounded-2xl bg-white/10 p-5">

                        <p className="font-semibold">
                            Restaurant Dashboard
                        </p>


                        <div className="mt-5 grid grid-cols-2 gap-3">

                            {[
                                ['Total Bookings', '284', '+12% today'],
                                ['Available Tables', '18', 'of 32 total'],
                                ['Pending Pre-orders', '47', '5 urgent'],
                                ['Revenue (month)', '৳2.4L', '+8.3%'],
                            ].map(([label, value, small]) => (

                                <div
                                    key={label}
                                    className="rounded-xl bg-white/10 p-4"
                                >

                                    <p className="text-xs text-white/60">
                                        {label}
                                    </p>

                                    <p className="mt-2 text-xl font-bold">
                                        {value}
                                    </p>

                                    <p className="mt-1 text-xs text-white/50">
                                        {small}
                                    </p>

                                </div>

                            ))}

                        </div>


                        <div className="mt-4 overflow-hidden rounded-xl bg-white/10">

                            <div className="border-b border-white/10 px-4 py-3 text-xs font-semibold text-white/70">
                                Recent Reservations
                            </div>


                            {[
                                ['Rahim Uddin', '#4821 · 7:30 PM · 4 guests', 'Confirmed'],
                                ['Priya Das', '#4820 · 8:00 PM · 2 guests', 'Pending'],
                                ['Arif Hossain', '#4819 · 8:30 PM · 6 guests', 'Confirmed'],
                            ].map(([name, details, status]) => (

                                <div
                                    key={name}
                                    className="flex items-center justify-between border-b border-white/5 px-4 py-3 last:border-0"
                                >

                                    <div>

                                        <p className="text-xs font-medium">
                                            {name}
                                        </p>

                                        <p className="mt-1 text-xs text-white/50">
                                            {details}
                                        </p>

                                    </div>


                                    <span
                                        className={`rounded-full px-2 py-1 text-xs ${status === 'Confirmed'
                                                ? 'bg-green-500/20 text-green-300'
                                                : 'bg-yellow-500/20 text-yellow-300'
                                            }`}
                                    >
                                        {status}
                                    </span>

                                </div>

                            ))}

                        </div>

                    </div>

                </div>

            </section>



            {/* ================================================================
                TESTIMONIALS
            ================================================================= */}
            <section className="bg-[#f0ebe0] py-20">

                <div className="mx-auto max-w-7xl px-6">

                    <h2 className="text-center text-3xl font-bold text-gray-900 md:text-4xl">
                        Dining made easier with{' '}
                        <span className="text-orange-500">
                            Khabo-Koi
                        </span>
                    </h2>


                    <div className="mt-12 grid gap-6 lg:grid-cols-3">

                        {testimonials.map((testimonial) => (

                            <article
                                key={testimonial.name}
                                className="flex flex-col rounded-2xl border border-gray-200 bg-white p-7"
                            >

                                <div className="text-yellow-500">
                                    ★ ★ ★ ★ ★
                                </div>


                                <p className="mt-5 flex-1 text-sm leading-6 text-gray-700">
                                    “{testimonial.review}”
                                </p>


                                <div className="mt-6 flex items-center gap-3 border-t border-gray-200 pt-4">

                                    {testimonial.image ? (

                                        <img
                                            src={testimonial.image}
                                            alt={testimonial.name}
                                            className="h-10 w-10 rounded-full object-cover"
                                        />

                                    ) : (

                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600">
                                            {testimonial.initials}
                                        </div>

                                    )}


                                    <div>

                                        <p className="text-sm font-semibold text-gray-900">
                                            {testimonial.name}
                                        </p>

                                        <p className="text-xs text-gray-500">
                                            {testimonial.role}
                                        </p>

                                    </div>

                                </div>

                            </article>

                        ))}

                    </div>

                </div>

            </section>



            {/* ================================================================
                FINAL CTA
            ================================================================= */}
            <section className="bg-[#fdf8f0] py-20">

                <div className="mx-auto max-w-7xl px-6">

                    <div className="flex flex-col justify-between gap-10 rounded-3xl bg-orange-500 px-8 py-12 text-white lg:flex-row lg:items-center lg:px-12">

                        <div className="max-w-xl">

                            <h2 className="text-3xl font-bold leading-tight md:text-4xl">
                                Ready to find your next dining destination?
                            </h2>


                            <p className="mt-4 text-white/80">
                                Explore restaurants, reserve a table and enjoy your meal
                                without unnecessary waiting.
                            </p>

                        </div>


                        <div className="flex flex-wrap gap-3">

                            <button
                                type="button"
                                className="rounded-xl bg-white px-7 py-3 font-bold text-orange-500"
                            >
                                Explore Restaurants
                            </button>


                            <button
                                type="button"
                                className="rounded-xl border border-white/50 px-7 py-3 font-bold text-white"
                            >
                                Create an Account
                            </button>

                        </div>

                    </div>

                </div>

            </section>

        </>
    )
}


export default LandingContent