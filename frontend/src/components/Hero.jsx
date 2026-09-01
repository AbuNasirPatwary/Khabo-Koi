import heroRestaurant from '../assets/images/hero-restaurant.png'

function Hero() {
    return (
        // HERO SECTION:
        // This is the first major section of the Khabo-Koi homepage.
        // It follows the structure from our Figma design.
        <section className="bg-[#fffaf2]">
            <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                {/* LEFT SIDE:
                    Contains the main heading, description, and restaurant search UI. */}
                <div>
                    <p className="text-sm font-semibold text-orange-500 mb-4">
                        Discover • Book • Enjoy
                    </p>

                    <h1 className="text-5xl lg:text-6xl font-bold leading-tight text-gray-900">
                        Find the right
                        <br />
                        restaurant and
                        <br />
                        reserve your{' '}
                        <span className="text-orange-500">
                            perfect table.
                        </span>
                    </h1>

                    <p className="mt-6 text-gray-600 max-w-xl leading-relaxed">
                        Search restaurants or your favourite food, choose a nearby
                        branch, reserve an available table and pre-order your meal
                        before you arrive.
                    </p>

                    {/* SEARCH AREA:
                        FRONTEND FOR NOW.

                        Later this will connect to the Django backend.
                        The backend will search restaurants, cuisines, and food items
                        stored in PostgreSQL. */}
                    <div className="mt-8 bg-white p-2 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-2">

                        <input
                            type="text"
                            placeholder="Search restaurant, cuisine or dish"
                            className="flex-1 px-4 py-3 outline-none text-sm"
                        />

                        {/* LOCATION:
                            Later this can be used to filter restaurant branches
                            based on the customer's selected location. */}
                        <input
                            type="text"
                            placeholder="Select your location"
                            className="flex-1 px-4 py-3 outline-none text-sm border-t md:border-t-0 md:border-l border-gray-200"
                        />

                        {/* SEARCH BUTTON:
                            Later clicking this will send the search values to our
                            restaurant search page / backend API. */}
                        <button
                            type="button"
                            className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-3 rounded-lg"
                        >
                            Find Restaurants
                        </button>
                    </div>

                    {/* QUICK SEARCH:
                        These are example shortcuts from the homepage design.
                        Later clicking a category can perform a real food search. */}
                    <div className="mt-5 flex flex-wrap gap-2">
                        {['Kacchi', 'Burger', 'Pizza', 'Chinese', 'Dhanmondi', 'Banani'].map(
                            (item) => (
                                <button
                                    key={item}
                                    type="button"
                                    className="px-4 py-2 text-xs text-gray-600 bg-white border border-gray-200 rounded-full hover:border-orange-400 hover:text-orange-500"
                                >
                                    {item}
                                </button>
                            ),
                        )}
                    </div>
                </div>

                {/* RIGHT SIDE:
                    Contains the main restaurant image and floating information cards. */}
                <div className="relative w-full h-[500px] rounded-3xl overflow-visible">

                    {/* HERO IMAGE:
                        This is the exported restaurant image from the Figma design. */}
                    <img
                        src={heroRestaurant}
                        alt="Elegant restaurant interior"
                        className="w-full h-full object-cover rounded-3xl"
                    />

                    {/* FLOATING CARD 1 — TABLE AVAILABILITY:
                        This is static frontend data for now.

                        BACKEND CONNECTION:
                        Later the availability status and booking time can come
                        from our Django reservation availability API. */}
                    <div className="absolute -left-8 top-10 bg-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">

                        <div className="w-9 h-9 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold">
                            ✓
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-gray-900">
                                Table available
                            </p>

                            <p className="text-xs text-gray-500">
                                Today at 8:00 PM
                            </p>
                        </div>

                    </div>

                    {/* FLOATING CARD 2 — PRE-ORDER STATUS:
                    This is static frontend data for now.

                    BACKEND CONNECTION:
                    Later this status can come from the reservation/pre-order API
                    after the customer adds food to a booking. */}
                    <div className="absolute -right-6 top-44 bg-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">

                        <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center font-bold">
                            ✓
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-gray-900">
                                Pre-order confirmed
                            </p>

                            <p className="text-xs text-gray-500">
                                3 items ready before arrival
                            </p>
                        </div>

                    </div>

                    {/* FLOATING CARD 3 — RATING:
                    This is static frontend data for now.

                    BACKEND CONNECTION:
                    Later the rating and review count can come from
                    restaurant/review data returned by the Django API. */}
                    <div className="absolute -left-6 bottom-10 bg-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">

                        <div className="w-9 h-9 rounded-full bg-yellow-100 text-yellow-500 flex items-center justify-center font-bold">
                            ★
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-gray-900">
                                4.8 rating
                            </p>

                            <p className="text-xs text-gray-500">
                                Based on 850 reviews
                            </p>
                        </div>

                    </div>

                </div>

            </div>
        </section>
    )
}

export default Hero