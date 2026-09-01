import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

import kacchiImage from '../assets/images/landing/kacchi.png'
import burgerImage from '../assets/images/landing/burger.png'
import pizzaImage from '../assets/images/landing/pizza.png'
import chineseImage from '../assets/images/landing/chinese.png'
import seafoodImage from '../assets/images/landing/seafood.png'
import dessertsImage from '../assets/images/landing/desserts.png'


// -----------------------------------------------------------------------------
// TEMPORARY FOOD DATA
// -----------------------------------------------------------------------------
// BACKEND CONNECTION:
// Later this data will come from Django/PostgreSQL through an API.
// Each food item will belong to a real restaurant/menu record.
// -----------------------------------------------------------------------------

const foodData = [
    {
        id: 1,
        name: 'Mutton Kacchi Biryani',
        category: 'Kacchi',
        restaurant: "Sultan's Dine",
        location: 'Dhanmondi',
        price: 580,
        rating: 4.9,
        image: kacchiImage,
    },
    {
        id: 2,
        name: 'Classic Beef Burger',
        category: 'Burger',
        restaurant: 'Chillox',
        location: 'Banani',
        price: 320,
        rating: 4.8,
        image: burgerImage,
    },
    {
        id: 3,
        name: 'Pepperoni Pizza',
        category: 'Pizza',
        restaurant: 'Pizza Lounge',
        location: 'Dhanmondi',
        price: 650,
        rating: 4.6,
        image: pizzaImage,
    },
    {
        id: 4,
        name: 'Chicken Chow Mein',
        category: 'Chinese',
        restaurant: 'Asian Kitchen',
        location: 'Uttara',
        price: 380,
        rating: 4.5,
        image: chineseImage,
    },
    {
        id: 5,
        name: 'Grilled Seafood Platter',
        category: 'Seafood',
        restaurant: 'Ocean Basket',
        location: 'Banani',
        price: 890,
        rating: 4.7,
        image: seafoodImage,
    },
    {
        id: 6,
        name: 'Chocolate Lava Cake',
        category: 'Desserts',
        restaurant: 'Sweet House',
        location: 'Mirpur',
        price: 280,
        rating: 4.6,
        image: dessertsImage,
    },
    {
        id: 7,
        name: 'Chicken Burger',
        category: 'Burger',
        restaurant: 'Madchef',
        location: 'Uttara',
        price: 350,
        rating: 4.7,
        image: burgerImage,
    },
    {
        id: 8,
        name: 'Special Kacchi',
        category: 'Kacchi',
        restaurant: 'Kacchi Bhai',
        location: 'Mirpur',
        price: 520,
        rating: 4.8,
        image: kacchiImage,
    },
]


const categories = [
    'All Categories',
    'Kacchi',
    'Burger',
    'Pizza',
    'Chinese',
    'Seafood',
    'Desserts',
]


const locations = [
    'All Locations',
    'Dhanmondi',
    'Banani',
    'Uttara',
    'Mirpur',
]


function BrowseFood() {

    // What the user is currently typing
    const [searchInput, setSearchInput] = useState('')

    // The search value that has actually been submitted
    const [searchTerm, setSearchTerm] = useState('')

    const [selectedCategory, setSelectedCategory] =
        useState('All Categories')

    const [selectedLocation, setSelectedLocation] =
        useState('All Locations')

    const [sortBy, setSortBy] =
        useState('recommended')


    // -------------------------------------------------------------------------
    // SEARCH SUBMISSION
    // -------------------------------------------------------------------------
    // The user can either:
    // 1. Click the Search button
    // 2. Press Enter
    //
    // Later this function can send the search value to our Django API.
    // -----------------------------------------------------------------------------

    function handleSearch(event) {
        event.preventDefault()

        setSearchTerm(searchInput.trim())
    }


    // -------------------------------------------------------------------------
    // FRONTEND SEARCH + FILTERING
    // -------------------------------------------------------------------------
    // BACKEND CONNECTION:
    //
    // Later this can become:
    //
    // /api/foods/?search=burger&category=Burger&location=Banani
    // -----------------------------------------------------------------------------

    const filteredFoods = useMemo(() => {

        let results = foodData.filter((food) => {

            const search =
                searchTerm.toLowerCase().trim()


            const matchesSearch =
                food.name.toLowerCase().includes(search) ||
                food.restaurant.toLowerCase().includes(search) ||
                food.category.toLowerCase().includes(search) ||
                food.location.toLowerCase().includes(search)


            const matchesCategory =
                selectedCategory === 'All Categories' ||
                food.category === selectedCategory


            const matchesLocation =
                selectedLocation === 'All Locations' ||
                food.location === selectedLocation


            return (
                matchesSearch &&
                matchesCategory &&
                matchesLocation
            )

        })


        // SORT BY HIGHEST RATING
        if (sortBy === 'rating') {

            results = [...results].sort(
                (a, b) => b.rating - a.rating,
            )

        }


        // SORT BY LOWEST PRICE
        if (sortBy === 'price-low') {

            results = [...results].sort(
                (a, b) => a.price - b.price,
            )

        }


        // SORT BY HIGHEST PRICE
        if (sortBy === 'price-high') {

            results = [...results].sort(
                (a, b) => b.price - a.price,
            )

        }


        return results

    }, [
        searchTerm,
        selectedCategory,
        selectedLocation,
        sortBy,
    ])



    // -------------------------------------------------------------------------
    // CLEAR EVERYTHING
    // -----------------------------------------------------------------------------

    function clearFilters() {

        setSearchInput('')
        setSearchTerm('')
        setSelectedCategory('All Categories')
        setSelectedLocation('All Locations')
        setSortBy('recommended')

    }



    return (

        <div className="min-h-screen bg-[#fdf8f0]">


            {/* ================================================================
                NAVBAR
            ================================================================= */}

            <Navbar />



            {/* ================================================================
                PAGE HEADER
            ================================================================= */}

            <section className="bg-[#fff7ed]">

                <div className="mx-auto max-w-7xl px-6 py-14">

                    <p className="text-sm font-semibold uppercase tracking-wider text-orange-500">
                        Browse Food
                    </p>


                    <h1 className="mt-3 text-4xl font-bold text-gray-900 md:text-5xl">
                        Find exactly what you're craving.
                    </h1>


                    <p className="mt-4 max-w-2xl leading-7 text-gray-500">
                        Search dishes from different restaurants,
                        compare prices and discover where your
                        favourite food is available.
                    </p>

                </div>

            </section>



            {/* ================================================================
                SEARCH + FILTER AREA
            ================================================================= */}

            <section>

                <div className="mx-auto max-w-7xl px-6 py-8">

                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">


                        {/* ----------------------------------------------------
                            SEARCH FORM
                        ----------------------------------------------------- */}

                        <form
                            onSubmit={handleSearch}
                            className="flex flex-col gap-3 sm:flex-row"
                        >

                            <input
                                type="text"
                                value={searchInput}
                                onChange={(event) =>
                                    setSearchInput(event.target.value)
                                }
                                placeholder="Search food, restaurant or location..."
                                className="flex-1 rounded-xl border border-gray-200 px-5 py-4 text-sm outline-none transition focus:border-orange-400"
                            />


                            <button
                                type="submit"
                                className="rounded-xl bg-orange-500 px-8 py-4 text-sm font-semibold text-white transition hover:bg-orange-600"
                            >
                                Search
                            </button>

                        </form>



                        {/* ----------------------------------------------------
                            CATEGORY FILTERS
                        ----------------------------------------------------- */}

                        <div className="mt-5 flex flex-wrap gap-2">

                            {categories.map((category) => (

                                <button
                                    key={category}
                                    type="button"
                                    onClick={() =>
                                        setSelectedCategory(category)
                                    }
                                    className={`rounded-full border px-4 py-2 text-xs font-medium transition ${
                                        selectedCategory === category
                                            ? 'border-orange-500 bg-orange-500 text-white'
                                            : 'border-gray-200 text-gray-600 hover:border-orange-400 hover:text-orange-500'
                                    }`}
                                >

                                    {category}

                                </button>

                            ))}

                        </div>



                        {/* ----------------------------------------------------
                            LOCATION + SORT
                        ----------------------------------------------------- */}

                        <div className="mt-5 flex flex-col gap-3 sm:flex-row">


                            {/* LOCATION */}

                            <select
                                value={selectedLocation}
                                onChange={(event) =>
                                    setSelectedLocation(event.target.value)
                                }
                                className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-orange-400 sm:w-56"
                            >

                                {locations.map((location) => (

                                    <option
                                        key={location}
                                        value={location}
                                    >
                                        {location}
                                    </option>

                                ))}

                            </select>



                            {/* SORT */}

                            <select
                                value={sortBy}
                                onChange={(event) =>
                                    setSortBy(event.target.value)
                                }
                                className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-orange-400 sm:w-56"
                            >

                                <option value="recommended">
                                    Recommended
                                </option>

                                <option value="rating">
                                    Highest Rating
                                </option>

                                <option value="price-low">
                                    Price: Low to High
                                </option>

                                <option value="price-high">
                                    Price: High to Low
                                </option>

                            </select>



                            {/* CLEAR FILTERS */}

                            {(searchInput ||
                                searchTerm ||
                                selectedCategory !== 'All Categories' ||
                                selectedLocation !== 'All Locations' ||
                                sortBy !== 'recommended') && (

                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="text-sm font-semibold text-orange-500 transition hover:text-orange-600 sm:ml-auto"
                                >
                                    Clear Filters
                                </button>

                            )}

                        </div>


                        {/* ----------------------------------------------------
                            ACTIVE SEARCH TEXT
                        ----------------------------------------------------- */}

                        {searchTerm && (

                            <p className="mt-5 text-sm text-gray-500">

                                Showing results for{' '}

                                <span className="font-semibold text-gray-800">
                                    "{searchTerm}"
                                </span>

                            </p>

                        )}

                    </div>

                </div>

            </section>



            {/* ================================================================
                FOOD RESULTS
            ================================================================= */}

            <main className="mx-auto max-w-7xl px-6 pb-16">


                <div className="flex items-end justify-between">

                    <div>

                        <h2 className="text-2xl font-bold text-gray-900">
                            Available Food
                        </h2>


                        <p className="mt-1 text-sm text-gray-500">

                            {filteredFoods.length}{' '}

                            {filteredFoods.length === 1
                                ? 'item'
                                : 'items'}{' '}

                            found

                        </p>

                    </div>

                </div>



                {/* ============================================================
                    FOOD CARDS
                ============================================================= */}

                {filteredFoods.length > 0 ? (

                    <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">


                        {filteredFoods.map((food) => (

                            <article
                                key={food.id}
                                className="overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-lg"
                            >


                                {/* FOOD IMAGE */}

                                <div className="h-52 overflow-hidden">

                                    <img
                                        src={food.image}
                                        alt={food.name}
                                        className="h-full w-full object-cover transition duration-300 hover:scale-105"
                                    />

                                </div>



                                {/* FOOD DETAILS */}

                                <div className="p-5">


                                    <div className="flex items-start justify-between gap-3">


                                        <div>

                                            <p className="text-xs font-semibold text-orange-500">
                                                {food.category}
                                            </p>


                                            <h3 className="mt-1 text-lg font-bold text-gray-900">
                                                {food.name}
                                            </h3>

                                        </div>



                                        <span className="whitespace-nowrap text-sm font-semibold text-gray-700">
                                            ★ {food.rating}
                                        </span>


                                    </div>



                                    <p className="mt-3 text-sm font-medium text-gray-700">
                                        {food.restaurant}
                                    </p>


                                    <p className="mt-1 text-xs text-gray-500">
                                        📍 {food.location}
                                    </p>



                                    <div className="mt-5 flex items-center justify-between">


                                        <p className="text-xl font-bold text-orange-500">
                                            ৳{food.price}
                                        </p>



                                        {/* BACKEND / ROUTING:
                                            Later this should navigate directly
                                            to the restaurant that owns this food. */}

                                        <Link
                                            to="/restaurants"
                                            className="text-sm font-semibold text-green-700 hover:text-green-800"
                                        >
                                            Restaurant →
                                        </Link>


                                    </div>



                                    {/* RESERVATION:
                                        Later this button will open the restaurant
                                        details / reservation flow. */}

                                    <button
                                        type="button"
                                        className="mt-5 w-full rounded-xl border border-orange-500 px-4 py-3 text-sm font-semibold text-orange-500 transition hover:bg-orange-50"
                                    >
                                        View & Reserve
                                    </button>


                                </div>


                            </article>

                        ))}

                    </div>

                ) : (


                    /* =========================================================
                        NO RESULTS
                    ========================================================== */

                    <div className="mt-8 rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-20 text-center">


                        <div className="text-5xl">
                            🍽️
                        </div>


                        <h3 className="mt-5 text-xl font-bold text-gray-900">
                            No food found
                        </h3>


                        <p className="mt-2 text-sm text-gray-500">
                            Try another food, restaurant, location or category.
                        </p>


                        <button
                            type="button"
                            onClick={clearFilters}
                            className="mt-6 rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
                        >
                            Clear All Filters
                        </button>


                    </div>

                )}


            </main>



            {/* ================================================================
                RESERVATION CTA
            ================================================================= */}

            <section className="bg-[#1a5c38]">

                <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-12 text-white md:flex-row md:items-center md:justify-between">


                    <div>

                        <h2 className="text-2xl font-bold">
                            Found something you like?
                        </h2>


                        <p className="mt-2 text-sm text-white/70">
                            Choose the restaurant, reserve your table
                            and add food to your booking.
                        </p>

                    </div>



                    <Link
                        to="/restaurants"
                        className="rounded-xl bg-orange-500 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-orange-600"
                    >
                        Explore Restaurants
                    </Link>


                </div>

            </section>



            <Footer />


        </div>

    )
}


export default BrowseFood