import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

import sultansDineImage from '../assets/images/landing/sultans-dine.png'
import chilloxImage from '../assets/images/landing/chillox.png'
import madchefImage from '../assets/images/landing/madchef.png'
import kacchiBhaiImage from '../assets/images/landing/kacchi-bhai.png'


// -----------------------------------------------------------------------------
// DJANGO API
// -----------------------------------------------------------------------------
// Restaurant information now comes from PostgreSQL through Django REST API.
// -----------------------------------------------------------------------------

const API_URL = 'http://127.0.0.1:8000/api/restaurants/'


// -----------------------------------------------------------------------------
// TEMPORARY LOCAL IMAGE FALLBACKS
// -----------------------------------------------------------------------------
// Our PostgreSQL Restaurant.image_url field is currently empty.
//
// Later restaurant managers can upload/save restaurant images.
// Until then, we use our existing frontend images.
// -----------------------------------------------------------------------------

const localRestaurantImages = {
    "Sultan's Dine": sultansDineImage,
    Chillox: chilloxImage,
    Madchef: madchefImage,
    'Kacchi Bhai': kacchiBhaiImage,
}


function Restaurants() {

    // -------------------------------------------------------------------------
    // REAL DATABASE DATA
    // -------------------------------------------------------------------------

    const [restaurantData, setRestaurantData] = useState([])

    const [loading, setLoading] = useState(true)

    const [error, setError] = useState('')


    // -------------------------------------------------------------------------
    // FILTER STATE
    // -------------------------------------------------------------------------

    const [searchTerm, setSearchTerm] = useState('')

    const [selectedLocation, setSelectedLocation] =
        useState('All Locations')

    const [selectedCuisine, setSelectedCuisine] =
        useState('All Cuisines')

    const [sortBy, setSortBy] =
        useState('recommended')



    // =========================================================================
    // LOAD RESTAURANTS FROM DJANGO
    // =========================================================================
    //
    // React
    //   ↓
    // Django REST API
    //   ↓
    // PostgreSQL
    //
    // This replaces our old hard-coded restaurantData array.
    // =========================================================================

    useEffect(() => {

        const controller = new AbortController()


        async function loadRestaurants() {

            try {

                setLoading(true)
                setError('')


                const response = await fetch(
                    API_URL,
                    {
                        signal: controller.signal,
                    }
                )


                if (!response.ok) {

                    throw new Error(
                        `API request failed with status ${response.status}`
                    )

                }


                const data = await response.json()


                // Normally our current DRF endpoint returns an array.
                // The second option also keeps this working if pagination
                // is added later.
                const restaurants = Array.isArray(data)
                    ? data
                    : data.results || []


                setRestaurantData(restaurants)

            }

            catch (requestError) {

                if (requestError.name !== 'AbortError') {

                    console.error(
                        'Restaurant API error:',
                        requestError
                    )

                    setError(
                        'Could not load restaurants from the server.'
                    )

                }

            }

            finally {

                setLoading(false)

            }

        }


        loadRestaurants()


        return () => {
            controller.abort()
        }

    }, [])



    // =========================================================================
    // LOCATIONS FROM DATABASE
    // =========================================================================
    //
    // Instead of manually writing:
    // Dhanmondi, Banani, Uttara, Mirpur...
    //
    // React now builds the location list from Branch records returned
    // by PostgreSQL.
    // =========================================================================

    const locations = useMemo(() => {

        const branchNames = restaurantData.flatMap(
            (restaurant) =>
                restaurant.branches
                    ?.filter((branch) => branch.is_active)
                    .map((branch) => branch.name) || []
        )


        return [
            'All Locations',
            ...new Set(branchNames),
        ]

    }, [restaurantData])



    // =========================================================================
    // CUISINES FROM DATABASE
    // =========================================================================

    const cuisines = useMemo(() => {

        const cuisineNames = restaurantData
            .map((restaurant) => restaurant.cuisine)
            .filter(Boolean)


        return [
            'All Cuisines',
            ...new Set(cuisineNames),
        ]

    }, [restaurantData])



    // =========================================================================
    // HELPER: ACTIVE TABLE COUNT
    // =========================================================================
    //
    // This counts active tables belonging to all branches.
    //
    // IMPORTANT:
    // This is NOT yet date/time availability.
    //
    // Real availability will later check:
    // RestaurantTable + Booking + Date + Start Time + End Time
    // =========================================================================

    function getTableCount(restaurant) {

        return restaurant.branches?.reduce(
            (total, branch) => {

                const activeTables =
                    branch.tables?.filter(
                        (table) => table.is_active
                    ).length || 0


                return total + activeTables

            },
            0
        ) || 0

    }



    // =========================================================================
    // HELPER: RESTAURANT IMAGE
    // =========================================================================

    function getRestaurantImage(restaurant) {

        if (restaurant.image_url) {
            return restaurant.image_url
        }


        return (
            localRestaurantImages[restaurant.name] ||
            sultansDineImage
        )

    }



    // =========================================================================
    // SEARCH + FILTER
    // =========================================================================
    //
    // Restaurant records come from the database.
    //
    // For now filtering happens in React after the API returns the data.
    //
    // Later we can move more filtering to Django:
    //
    // /api/restaurants/?search=burger
    // =========================================================================

    const filteredRestaurants = useMemo(() => {

        let results = restaurantData.filter(
            (restaurant) => {

                const search =
                    searchTerm.toLowerCase().trim()


                const branchNames =
                    restaurant.branches
                        ?.filter(
                            (branch) => branch.is_active
                        )
                        .map(
                            (branch) => branch.name
                        ) || []


                const matchesSearch =

                    restaurant.name
                        .toLowerCase()
                        .includes(search) ||

                    restaurant.cuisine
                        .toLowerCase()
                        .includes(search) ||

                    branchNames.some(
                        (branchName) =>
                            branchName
                                .toLowerCase()
                                .includes(search)
                    )


                const matchesLocation =

                    selectedLocation === 'All Locations' ||

                    branchNames.includes(
                        selectedLocation
                    )


                const matchesCuisine =

                    selectedCuisine === 'All Cuisines' ||

                    restaurant.cuisine ===
                    selectedCuisine


                return (
                    matchesSearch &&
                    matchesLocation &&
                    matchesCuisine
                )

            }
        )



        // SORT BY RATING

        if (sortBy === 'rating') {

            results = [...results].sort(

                (a, b) =>
                    Number(b.rating) -
                    Number(a.rating)

            )

        }



        // SORT BY NUMBER OF ACTIVE TABLES

        if (sortBy === 'tables') {

            results = [...results].sort(

                (a, b) =>
                    getTableCount(b) -
                    getTableCount(a)

            )

        }


        return results

    }, [
        restaurantData,
        searchTerm,
        selectedLocation,
        selectedCuisine,
        sortBy,
    ])



    // =========================================================================
    // CLEAR FILTERS
    // =========================================================================

    function clearFilters() {

        setSearchTerm('')

        setSelectedLocation(
            'All Locations'
        )

        setSelectedCuisine(
            'All Cuisines'
        )

        setSortBy(
            'recommended'
        )

    }



    return (

        <div className="min-h-screen bg-[#fdf8f0]">


            <Navbar />



            {/* ================================================================
                PAGE HEADER
            ================================================================= */}

            <section className="border-b border-orange-100 bg-[#fff7ed]">

                <div className="mx-auto max-w-7xl px-6 py-14">


                    <p className="text-sm font-semibold uppercase tracking-wider text-orange-500">
                        Discover Restaurants
                    </p>


                    <h1 className="mt-3 text-4xl font-bold text-gray-900 md:text-5xl">
                        Find your perfect place to dine.
                    </h1>


                    <p className="mt-4 max-w-2xl leading-7 text-gray-500">
                        Search restaurants by name, cuisine or location,
                        check table availability and choose where you want to eat.
                    </p>


                </div>

            </section>



            {/* ================================================================
                SEARCH & FILTER PANEL
            ================================================================= */}

            <section>

                <div className="mx-auto max-w-7xl px-6">


                    <div className="-mt-1 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">


                        {/* SEARCH */}

                        <div className="flex flex-col gap-3 lg:flex-row">


                            <div className="relative flex-1">


                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                    ⌕
                                </span>


                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(event) =>
                                        setSearchTerm(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Search restaurant, cuisine or location"
                                    className="w-full rounded-xl border border-gray-200 py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-orange-400"
                                />


                            </div>



                            {/* LOCATION */}

                            <select
                                value={selectedLocation}
                                onChange={(event) =>
                                    setSelectedLocation(
                                        event.target.value
                                    )
                                }
                                className="rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-700 outline-none focus:border-orange-400 lg:w-52"
                            >

                                {locations.map(
                                    (location) => (

                                        <option
                                            key={location}
                                            value={location}
                                        >
                                            {location}
                                        </option>

                                    )
                                )}

                            </select>



                            {/* CUISINE */}

                            <select
                                value={selectedCuisine}
                                onChange={(event) =>
                                    setSelectedCuisine(
                                        event.target.value
                                    )
                                }
                                className="rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-700 outline-none focus:border-orange-400 lg:w-56"
                            >

                                {cuisines.map(
                                    (cuisine) => (

                                        <option
                                            key={cuisine}
                                            value={cuisine}
                                        >
                                            {cuisine}
                                        </option>

                                    )
                                )}

                            </select>


                        </div>



                        {/* QUICK LOCATION FILTERS */}

                        <div className="mt-5 flex flex-wrap items-center gap-2">


                            <span className="mr-2 text-xs font-semibold text-gray-500">
                                Popular:
                            </span>



                            {locations
                                .slice(1)
                                .map(
                                    (location) => (

                                        <button
                                            key={location}
                                            type="button"
                                            onClick={() =>
                                                setSelectedLocation(
                                                    location
                                                )
                                            }
                                            className={`rounded-full border px-4 py-2 text-xs font-medium transition ${selectedLocation === location
                                                ? 'border-orange-500 bg-orange-500 text-white'
                                                : 'border-gray-200 bg-white text-gray-600 hover:border-orange-400 hover:text-orange-500'
                                                }`}
                                        >
                                            {location}
                                        </button>

                                    )
                                )}



                            {(searchTerm ||
                                selectedLocation !== 'All Locations' ||
                                selectedCuisine !== 'All Cuisines') && (

                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="ml-auto text-xs font-semibold text-orange-500 hover:text-orange-600"
                                    >
                                        Clear Filters
                                    </button>

                                )}


                        </div>


                    </div>


                </div>

            </section>



            {/* ================================================================
                RESULTS
            ================================================================= */}

            <main className="mx-auto max-w-7xl px-6 py-12">


                {/* ------------------------------------------------------------
                    LOADING
                ------------------------------------------------------------- */}

                {loading && (

                    <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center">

                        <p className="font-semibold text-gray-700">
                            Loading restaurants...
                        </p>

                        <p className="mt-2 text-sm text-gray-500">
                            Getting restaurant data from Khabo-Koi.
                        </p>

                    </div>

                )}



                {/* ------------------------------------------------------------
                    API ERROR
                ------------------------------------------------------------- */}

                {!loading && error && (

                    <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">

                        <h3 className="font-bold text-red-700">
                            Could not load restaurants
                        </h3>

                        <p className="mt-2 text-sm text-red-600">
                            {error}
                        </p>

                        <p className="mt-2 text-xs text-gray-500">
                            Make sure the Django server is running on port 8000.
                        </p>

                    </div>

                )}



                {/* ------------------------------------------------------------
                    RESTAURANTS
                ------------------------------------------------------------- */}

                {!loading && !error && (

                    <>


                        {/* RESULT COUNT + SORT */}

                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">


                            <div>


                                <h2 className="text-2xl font-bold text-gray-900">
                                    Restaurants
                                </h2>


                                <p className="mt-1 text-sm text-gray-500">

                                    {filteredRestaurants.length}{' '}

                                    {filteredRestaurants.length === 1
                                        ? 'restaurant'
                                        : 'restaurants'}{' '}

                                    found

                                </p>


                            </div>



                            <div className="flex items-center gap-3">


                                <label
                                    htmlFor="sort"
                                    className="text-sm text-gray-500"
                                >
                                    Sort by
                                </label>


                                <select
                                    id="sort"
                                    value={sortBy}
                                    onChange={(event) =>
                                        setSortBy(
                                            event.target.value
                                        )
                                    }
                                    className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none"
                                >

                                    <option value="recommended">
                                        Recommended
                                    </option>

                                    <option value="rating">
                                        Highest Rating
                                    </option>

                                    <option value="tables">
                                        Most Tables
                                    </option>

                                </select>


                            </div>


                        </div>



                        {/* ====================================================
                            RESTAURANT CARDS
                        ===================================================== */}

                        {filteredRestaurants.length > 0 ? (

                            <div className="mt-8 grid gap-6 md:grid-cols-2">


                                {filteredRestaurants.map(
                                    (restaurant) => {


                                        const activeBranches =
                                            restaurant.branches
                                                ?.filter(
                                                    (branch) =>
                                                        branch.is_active
                                                ) || []


                                        const tableCount =
                                            getTableCount(
                                                restaurant
                                            )


                                        return (

                                            <article
                                                key={restaurant.id}
                                                className="overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-lg lg:flex"
                                            >


                                                {/* IMAGE */}

                                                <div className="relative h-60 lg:h-auto lg:w-[42%]">


                                                    <img
                                                        src={
                                                            getRestaurantImage(
                                                                restaurant
                                                            )
                                                        }
                                                        alt={restaurant.name}
                                                        className="h-full w-full object-cover"
                                                    />


                                                    <span className="absolute left-4 top-4 rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">

                                                        ● Active

                                                    </span>


                                                </div>



                                                {/* DETAILS */}

                                                <div className="flex flex-1 flex-col p-6">


                                                    <div className="flex items-start justify-between gap-4">


                                                        <div>


                                                            <h3 className="text-xl font-bold text-gray-900">
                                                                {restaurant.name}
                                                            </h3>


                                                            <p className="mt-1 text-sm text-gray-500">
                                                                {restaurant.cuisine}
                                                            </p>


                                                        </div>



                                                        <div className="flex items-center gap-1 rounded-lg bg-yellow-50 px-2.5 py-1.5">


                                                            <span className="text-yellow-500">
                                                                ★
                                                            </span>


                                                            <span className="text-sm font-bold text-gray-900">
                                                                {restaurant.rating}
                                                            </span>


                                                        </div>


                                                    </div>



                                                    <p className="mt-4 text-sm leading-6 text-gray-500">
                                                        {restaurant.description}
                                                    </p>



                                                    {/* BRANCH LOCATIONS */}

                                                    <div className="mt-5 flex flex-wrap gap-2">


                                                        {activeBranches.length > 0 ? (

                                                            activeBranches.map(
                                                                (branch) => (

                                                                    <span
                                                                        key={branch.id}
                                                                        className="rounded-full bg-gray-50 px-3 py-1.5 text-xs text-gray-600"
                                                                    >
                                                                        📍 {branch.name}
                                                                    </span>

                                                                )
                                                            )

                                                        ) : (

                                                            <span className="text-sm text-gray-400">
                                                                No active branches
                                                            </span>

                                                        )}


                                                    </div>



                                                    {/* TABLE INFORMATION */}

                                                    <div className="mt-5 rounded-xl bg-green-50 px-4 py-3">


                                                        <p className="text-sm font-semibold text-green-700">

                                                            ✓ {tableCount}{' '}

                                                            {tableCount === 1
                                                                ? 'table'
                                                                : 'tables'}{' '}

                                                            configured

                                                        </p>


                                                        <p className="mt-1 text-xs text-green-600">
                                                            Choose a date and time to check actual availability
                                                        </p>


                                                    </div>



                                                    {/* BUTTONS */}

                                                    <div className="mt-auto flex gap-3 pt-5">


                                                        <Link
                                                            to={`/restaurants/${restaurant.id}`}
                                                            className="flex-1 rounded-xl bg-orange-500 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-orange-600"
                                                        >
                                                            View Restaurant
                                                        </Link>


                                                        <Link
                                                            to={`/restaurants/${restaurant.id}#reservation`}
                                                            className="rounded-xl border border-orange-500 px-4 py-3 text-center text-sm font-semibold text-orange-500 transition hover:bg-orange-50"
                                                        >
                                                            Reserve
                                                        </Link>

                                                    </div>


                                                </div>


                                            </article>

                                        )

                                    }
                                )}


                            </div>

                        ) : (


                            /* =================================================
                                EMPTY SEARCH RESULT
                            ================================================== */

                            <div className="mt-8 rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-20 text-center">


                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-3xl">
                                    🍽
                                </div>


                                <h3 className="mt-5 text-xl font-bold text-gray-900">
                                    No restaurants found
                                </h3>


                                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                                    We couldn't find a restaurant matching your
                                    current search and filters.
                                </p>


                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="mt-6 rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-600"
                                >
                                    Clear All Filters
                                </button>


                            </div>

                        )}


                    </>

                )}


            </main>



            {/* ================================================================
                CTA
            ================================================================= */}

            <section className="bg-[#1a5c38]">


                <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-6 py-12 text-white md:flex-row md:items-center">


                    <div>


                        <h2 className="text-2xl font-bold">
                            Can't decide where to eat?
                        </h2>


                        <p className="mt-2 text-sm text-white/70">
                            Browse food first and discover restaurants serving
                            exactly what you're craving.
                        </p>


                    </div>



                    <Link
                        to="/browse-food"
                        className="inline-flex rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-600"
                    >
                        Browse Food
                    </Link>


                </div>


            </section>



            <Footer />


        </div>

    )

}


export default Restaurants