function Footer() {
    return (
        <footer className="bg-[#1c1c1e] text-white">

            <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-2 lg:grid-cols-4">

                {/* BRAND */}
                <div>

                    <div className="flex items-center gap-3">

                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 font-bold">
                            K
                        </div>

                        <p className="text-xl font-bold">
                            Khabo<span className="text-orange-500">-Koi</span>
                        </p>

                    </div>


                    <p className="mt-5 max-w-xs text-sm leading-6 text-white/60">
                        Khabo-Koi connects diners with restaurants through simple
                        discovery, table booking and food pre-ordering.
                    </p>


                    <div className="mt-5 flex gap-3">

                        {['f', '◎', '▶', 'in'].map((item) => (

                            <button
                                key={item}
                                type="button"
                                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-xs text-white/70"
                            >
                                {item}
                            </button>

                        ))}

                    </div>

                </div>



                {/* EXPLORE */}
                <div>

                    <h3 className="font-semibold">
                        Explore
                    </h3>

                    <div className="mt-5 space-y-3 text-sm text-white/60">

                        <p>Restaurants</p>
                        <p>Food Categories</p>
                        <p>Popular Locations</p>
                        <p>Offers</p>
                        <p>How It Works</p>

                    </div>

                </div>



                {/* BUSINESS */}
                <div>

                    <h3 className="font-semibold">
                        Business
                    </h3>

                    <div className="mt-5 space-y-3 text-sm text-white/60">

                        <p>Register a Restaurant</p>
                        <p>Restaurant Manager Sign In</p>
                        <p>Restaurant Resources</p>
                        <p>Partner Support</p>

                    </div>

                </div>



                {/* HELP */}
                <div>

                    <h3 className="font-semibold">
                        Help & Legal
                    </h3>

                    <div className="mt-5 space-y-3 text-sm text-white/60">

                        <p>Help Centre</p>
                        <p>Contact Us</p>
                        <p>Booking Policy</p>
                        <p>Cancellation Policy</p>
                        <p>Privacy Policy</p>
                        <p>Terms and Conditions</p>

                    </div>

                </div>

            </div>



            <div className="border-t border-white/10">

                <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-6 py-6 text-xs text-white/50 md:flex-row">

                    <div className="flex flex-wrap gap-6">

                        <span>
                            ✉ hello@khabokoi.com
                        </span>

                        <span>
                            ☎ +880 1700-000000
                        </span>

                        <span>
                            Dhaka, Bangladesh
                        </span>

                    </div>


                    <div className="flex gap-5">

                        <span>
                            © 2026 Khabo-Koi. All rights reserved.
                        </span>

                        <button
                            type="button"
                            className="text-white/30"
                        >
                            Admin Portal
                        </button>

                    </div>

                </div>

            </div>

        </footer>
    )
}


export default Footer