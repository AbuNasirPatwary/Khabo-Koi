// =============================================================================
// Header — Manager portal top header bar
// =============================================================================

import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'


const PAGE_TITLES = {
    '/manager':                  { title: 'Dashboard',          subtitle: 'Overview of your restaurant activity' },
    '/manager/reservations':     { title: 'Reservations',       subtitle: 'Manage all table bookings' },
    '/manager/tables':           { title: 'Tables',             subtitle: 'Configure your floor layout' },
    '/manager/menu':             { title: 'Menu',               subtitle: 'Manage your food & beverage offerings' },
    '/manager/branches':         { title: 'Branches',           subtitle: 'Manage your restaurant locations' },
    '/manager/restaurant-profile': { title: 'Restaurant Profile', subtitle: 'Edit your restaurant information' },
}


export default function Header() {
    const { pathname } = useLocation()
    const [menuOpen, setMenuOpen] = useState(false)

    const username = localStorage.getItem('manager_username') || 'Manager'
    const { title, subtitle } = PAGE_TITLES[pathname] ?? { title: 'Manager Portal', subtitle: '' }

    const initials = username
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

    return (
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-30">

            {/* Page Title */}
            <div>
                <h1 className="text-xl font-bold text-gray-900">{title}</h1>
                {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">

                {/* Notification bell */}
                <button className="relative p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {/* Badge */}
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500" />
                </button>

                {/* Divider */}
                <div className="w-px h-6 bg-gray-200" />

                {/* Avatar Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setMenuOpen(v => !v)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-gray-100 transition-colors"
                    >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white text-xs font-bold">
                            {initials}
                        </div>
                        <div className="text-left hidden sm:block">
                            <p className="text-sm font-semibold text-gray-800 leading-tight">{username}</p>
                            <p className="text-[10px] text-gray-400">Restaurant Manager</p>
                        </div>
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {/* Dropdown */}
                    {menuOpen && (
                        <div
                            className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50"
                            onMouseLeave={() => setMenuOpen(false)}
                        >
                            <div className="px-4 py-3 border-b border-gray-50">
                                <p className="text-sm font-semibold text-gray-900">{username}</p>
                                <p className="text-xs text-gray-400">Restaurant Manager</p>
                            </div>
                            <Link
                                to="/manager/restaurant-profile"
                                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                onClick={() => setMenuOpen(false)}
                            >
                                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Restaurant Profile
                            </Link>
                            <button
                                onClick={() => {
                                    localStorage.removeItem('manager_token')
                                    localStorage.removeItem('manager_username')
                                    window.location.href = '/manager/login'
                                }}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors border-t border-gray-50"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
