// =============================================================================
// Sidebar — Manager portal sidebar navigation
// =============================================================================

import { NavLink, useNavigate } from 'react-router-dom'


const NAV_ITEMS = [
    {
        label: 'Dashboard',
        to: '/manager',
        end: true,
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
    },
    {
        label: 'Reservations',
        to: '/manager/reservations',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        ),
    },
    {
        label: 'Tables',
        to: '/manager/tables',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
        ),
    },
    {
        label: 'Menu',
        to: '/manager/menu',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
        ),
    },
    {
        label: 'Branches',
        to: '/manager/branches',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
    },
    {
        label: 'Restaurant Profile',
        to: '/manager/restaurant-profile',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
        ),
    },
]


export default function Sidebar({ collapsed, onToggle }) {
    const navigate = useNavigate()

    function handleLogout() {
        localStorage.removeItem('manager_token')
        localStorage.removeItem('manager_username')
        navigate('/manager/login')
    }

    return (
        <aside
            className={`flex flex-col bg-[#1a1a2e] text-white transition-all duration-300 ease-in-out
                ${collapsed ? 'w-16' : 'w-64'} min-h-screen shrink-0`}
        >
            {/* LOGO */}
            <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/10
                ${collapsed ? 'justify-center' : ''}`}
            >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500 font-bold text-white text-lg">
                    K
                </div>
                {!collapsed && (
                    <div>
                        <span className="font-bold text-white">Khabo-</span>
                        <span className="font-bold text-orange-400">Koi</span>
                        <p className="text-[10px] text-gray-400 leading-tight">Manager Portal</p>
                    </div>
                )}
            </div>

            {/* COLLAPSE TOGGLE */}
            <button
                onClick={onToggle}
                className={`mt-2 mx-auto flex items-center justify-center w-8 h-8 rounded-lg
                    text-gray-400 hover:text-white hover:bg-white/10 transition-colors`}
                aria-label="Toggle sidebar"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    {collapsed
                        ? <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        : <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    }
                </svg>
            </button>

            {/* NAV ITEMS */}
            <nav className="mt-4 flex flex-col gap-1 px-2 flex-1">
                {NAV_ITEMS.map(item => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        title={collapsed ? item.label : undefined}
                        className={({ isActive }) =>
                            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150
                            ${isActive
                                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                                : 'text-gray-400 hover:text-white hover:bg-white/10'
                            }
                            ${collapsed ? 'justify-center' : ''}`
                        }
                    >
                        <span className="shrink-0">{item.icon}</span>
                        {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                ))}
            </nav>

            {/* BOTTOM — Logout */}
            <div className={`px-2 pb-4 border-t border-white/10 pt-3`}>
                <button
                    onClick={handleLogout}
                    title={collapsed ? 'Logout' : undefined}
                    className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium
                        text-gray-400 hover:text-red-400 hover:bg-white/10 transition-colors
                        ${collapsed ? 'justify-center' : ''}`}
                >
                    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {!collapsed && <span>Logout</span>}
                </button>
            </div>
        </aside>
    )
}
