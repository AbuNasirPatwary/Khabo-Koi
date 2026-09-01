import { Link, NavLink } from 'react-router-dom'


function Navbar() {
    const navLinkClass = ({ isActive }) =>
        `text-sm transition ${isActive
            ? 'font-semibold text-orange-500'
            : 'text-gray-700 hover:text-orange-500'
        }`


    return (
        <header className="w-full border-b border-gray-100 bg-white">

            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

                {/* BRAND */}
                <Link
                    to="/"
                    className="flex items-center gap-2"
                >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 font-bold text-white">
                        K
                    </div>

                    <span className="font-bold text-gray-900">
                        Khabo-
                        <span className="text-orange-500">
                            Koi
                        </span>
                    </span>
                </Link>


                {/* MAIN NAVIGATION */}
                <nav className="flex items-center gap-8">

                    <NavLink
                        to="/"
                        className={navLinkClass}
                    >
                        Home
                    </NavLink>

                    <NavLink
                        to="/restaurants"
                        className={navLinkClass}
                    >
                        Restaurants
                    </NavLink>

                    <NavLink
                        to="/browse-food"
                        className={navLinkClass}
                    >
                        Browse Food
                    </NavLink>

                    {/* This stays on the Home page because
                        How It Works is a homepage section. */}
                    <a
                        href="/#how-it-works"
                        className="text-sm text-gray-700 transition hover:text-orange-500"
                    >
                        How It Works
                    </a>

                    {/* Restaurant registration/dashboard
                        route will be created later. */}
                    <a
                        href="/#for-restaurants"
                        className="text-sm text-gray-700 transition hover:text-orange-500"
                    >
                        For Restaurants
                    </a>

                </nav>


                {/* AUTHENTICATION */}
                <div className="flex items-center gap-3">

                    <Link
                        to="/login"
                        className="rounded-full border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                        Sign In
                    </Link>

                    <Link
                        to="/register"
                        className="rounded-full bg-orange-500 px-5 py-2 text-sm font-medium text-white transition hover:bg-orange-600"
                    >
                        Sign Up
                    </Link>

                </div>

            </div>

        </header>
    )
}


export default Navbar