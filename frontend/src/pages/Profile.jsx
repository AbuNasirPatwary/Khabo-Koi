import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'


function Profile() {

    const navigate = useNavigate()

    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')


    useEffect(() => {

        const token = localStorage.getItem('access_token')

        if (!token) {
            navigate('/login')
            return
        }


        async function loadProfile() {

            try {

                const response = await fetch(
                    'http://127.0.0.1:8000/api/accounts/profile/',
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                )


                if (!response.ok) {
                    throw new Error('Could not load profile.')
                }


                const data = await response.json()

                setUser(data)

            } catch (error) {

                setError(
                    'Unable to load your profile information.'
                )

            } finally {

                setLoading(false)

            }

        }


        loadProfile()

    }, [navigate])


    function handleLogout() {

        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')

        navigate('/login')

    }


    const initial =
        user?.username?.charAt(0)?.toUpperCase() || 'U'


    return (

        <main className="min-h-screen bg-[#fdf8f0]">

            {/* TOP BAR */}

            <header className="border-b border-orange-100 bg-white">

                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">

                    <button
                        onClick={() => navigate('/')}
                        className="text-xl font-extrabold text-gray-900"
                    >
                        <span className="text-orange-500">
                            Khabo-
                        </span>
                        Koi
                    </button>


                    <div className="flex items-center gap-3">

                        <button
                            onClick={() => navigate('/restaurants')}
                            className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                        >
                            Restaurants
                        </button>


                        <button
                            onClick={() => navigate('/my-bookings')}
                            className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                        >
                            My Bookings
                        </button>


                        <button
                            onClick={handleLogout}
                            className="rounded-xl bg-orange-500 px-5 py-2 text-sm font-bold text-white hover:bg-orange-600"
                        >
                            Logout
                        </button>

                    </div>

                </div>

            </header>


            <section className="mx-auto max-w-6xl px-6 py-12">

                {/* PAGE TITLE */}

                <div className="mb-8">

                    <p className="text-sm font-bold uppercase tracking-widest text-orange-500">
                        Customer Account
                    </p>

                    <h1 className="mt-2 text-4xl font-extrabold text-gray-900">
                        My Profile
                    </h1>

                    <p className="mt-2 text-gray-500">
                        View your account information and manage your Khabo-Koi activity.
                    </p>

                </div>


                {loading && (

                    <div className="rounded-3xl bg-white p-10 text-gray-500 shadow-sm">
                        Loading profile...
                    </div>

                )}


                {error && (

                    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-600">
                        {error}
                    </div>

                )}


                {user && (

                    <div className="grid gap-6 lg:grid-cols-3">

                        {/* PROFILE CARD */}

                        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-100">

                            <div className="flex flex-col items-center text-center">

                                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-5xl font-extrabold text-white shadow-lg">
                                    {initial}
                                </div>


                                <h2 className="mt-5 text-2xl font-extrabold text-gray-900">
                                    {user.username}
                                </h2>


                                <p className="mt-1 text-sm text-gray-500">
                                    {user.email}
                                </p>


                                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-bold text-green-700">

                                    <span className="h-2 w-2 rounded-full bg-green-500"></span>

                                    Active Customer

                                </div>

                            </div>


                            <div className="mt-8 border-t border-gray-100 pt-6">

                                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                    Account Type
                                </p>

                                <p className="mt-2 font-bold text-gray-800">
                                    Khabo-Koi Customer
                                </p>

                            </div>

                        </div>


                        {/* ACCOUNT INFORMATION */}

                        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-100 lg:col-span-2">

                            <div className="flex items-center justify-between">

                                <div>

                                    <p className="text-sm font-bold text-orange-500">
                                        Account Details
                                    </p>

                                    <h2 className="mt-1 text-2xl font-extrabold text-gray-900">
                                        Personal Information
                                    </h2>

                                </div>


                                <div className="rounded-2xl bg-orange-50 px-4 py-2 text-sm font-bold text-orange-600">
                                    ✓ Verified Account
                                </div>

                            </div>


                            <div className="mt-8 grid gap-5 sm:grid-cols-2">

                                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">

                                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                        Username
                                    </p>

                                    <p className="mt-2 text-lg font-bold text-gray-900">
                                        {user.username}
                                    </p>

                                </div>


                                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">

                                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                        Email Address
                                    </p>

                                    <p className="mt-2 break-all text-lg font-bold text-gray-900">
                                        {user.email}
                                    </p>

                                </div>

                            </div>


                            {/* QUICK ACTIONS */}

                            <div className="mt-10">

                                <h3 className="text-lg font-extrabold text-gray-900">
                                    Quick Actions
                                </h3>


                                <div className="mt-4 grid gap-4 sm:grid-cols-3">

                                    <button
                                        onClick={() => navigate('/my-bookings')}
                                        className="rounded-2xl border border-orange-100 bg-orange-50 p-5 text-left transition hover:-translate-y-1 hover:shadow-md"
                                    >

                                        <div className="text-2xl">
                                            📅
                                        </div>

                                        <p className="mt-3 font-bold text-gray-900">
                                            My Bookings
                                        </p>

                                        <p className="mt-1 text-xs text-gray-500">
                                            View your reservations
                                        </p>

                                    </button>


                                    <button
                                        onClick={() => navigate('/restaurants')}
                                        className="rounded-2xl border border-orange-100 bg-orange-50 p-5 text-left transition hover:-translate-y-1 hover:shadow-md"
                                    >

                                        <div className="text-2xl">
                                            🍽️
                                        </div>

                                        <p className="mt-3 font-bold text-gray-900">
                                            Restaurants
                                        </p>

                                        <p className="mt-1 text-xs text-gray-500">
                                            Find your next table
                                        </p>

                                    </button>


                                    <button
                                        onClick={() => navigate('/browse-food')}
                                        className="rounded-2xl border border-orange-100 bg-orange-50 p-5 text-left transition hover:-translate-y-1 hover:shadow-md"
                                    >

                                        <div className="text-2xl">
                                            🍔
                                        </div>

                                        <p className="mt-3 font-bold text-gray-900">
                                            Browse Food
                                        </p>

                                        <p className="mt-1 text-xs text-gray-500">
                                            Explore available dishes
                                        </p>

                                    </button>

                                </div>

                            </div>

                        </div>

                    </div>

                )}

            </section>

        </main>

    )

}


export default Profile