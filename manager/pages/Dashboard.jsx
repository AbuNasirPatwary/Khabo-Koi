// =============================================================================
// Dashboard — Manager portal overview with KPIs + recent reservations
// =============================================================================

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { StatCard } from '../components/ui/StatCard'
import { Card, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { SkeletonStatCard, SkeletonRow } from '../components/ui/Spinner'
import { EmptyState } from '../components/ui/EmptyState'


// ─── Mock data (used when API is unavailable) ─────────────────────────────

const MOCK_STATS = {
    total_reservations_today: 18,
    confirmed: 12,
    pending: 4,
    cancelled: 2,
    available_tables: 8,
    total_tables: 20,
    revenue_today: 142500,
    new_bookings_week: 73,
}

const MOCK_RECENT = [
    { id: 1, guest_name: 'Arif Rahman',    table_number: 'T-04', reservation_date: '2026-09-20', start_time: '19:00', guest_count: 3, status: 'confirmed' },
    { id: 2, guest_name: 'Nadia Islam',    table_number: 'T-07', reservation_date: '2026-09-20', start_time: '19:30', guest_count: 2, status: 'pending' },
    { id: 3, guest_name: 'Karim Hossain', table_number: 'T-11', reservation_date: '2026-09-20', start_time: '20:00', guest_count: 5, status: 'confirmed' },
    { id: 4, guest_name: 'Sadia Akter',   table_number: 'T-02', reservation_date: '2026-09-20', start_time: '20:30', guest_count: 2, status: 'cancelled' },
    { id: 5, guest_name: 'Jahangir Ali',  table_number: 'T-15', reservation_date: '2026-09-20', start_time: '21:00', guest_count: 4, status: 'confirmed' },
]

const MOCK_ACTIVITY = [
    { id: 1, message: 'New reservation by Arif Rahman for Table T-04',  time: '2 min ago',  type: 'booking' },
    { id: 2, message: 'Nadia Islam cancelled reservation for Table T-09', time: '15 min ago', type: 'cancel' },
    { id: 3, message: 'Menu item "Kacchi Biryani" updated',             time: '1 hr ago',   type: 'menu' },
    { id: 4, message: 'Table T-12 marked as unavailable',              time: '2 hr ago',   type: 'table' },
    { id: 5, message: 'New branch "Dhanmondi" added',                  time: '5 hr ago',   type: 'branch' },
]


function ActivityIcon({ type }) {
    const map = {
        booking: { bg: 'bg-emerald-100', icon: '📅' },
        cancel:  { bg: 'bg-red-100',     icon: '❌' },
        menu:    { bg: 'bg-amber-100',   icon: '🍽' },
        table:   { bg: 'bg-blue-100',    icon: '🪑' },
        branch:  { bg: 'bg-purple-100',  icon: '📍' },
    }
    const { bg, icon } = map[type] ?? { bg: 'bg-gray-100', icon: '📌' }
    return (
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${bg} text-sm`}>
            {icon}
        </div>
    )
}


function StatusBar({ confirmed, pending, cancelled, total }) {
    if (!total) return null
    const pct = (n) => Math.round((n / total) * 100)
    return (
        <div className="mt-4 space-y-2">
            {[
                { label: 'Confirmed', count: confirmed, pct: pct(confirmed), color: 'bg-emerald-400' },
                { label: 'Pending',   count: pending,   pct: pct(pending),   color: 'bg-amber-400' },
                { label: 'Cancelled', count: cancelled, pct: pct(cancelled), color: 'bg-red-400' },
            ].map(r => (
                <div key={r.label} className="flex items-center gap-3">
                    <span className="w-20 text-xs text-gray-500">{r.label}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full ${r.color} transition-all duration-700`}
                            style={{ width: `${r.pct}%` }}
                        />
                    </div>
                    <span className="w-6 text-xs text-gray-600 text-right">{r.count}</span>
                </div>
            ))}
        </div>
    )
}


export default function Dashboard() {
    const [stats, setStats]   = useState(null)
    const [recent, setRecent] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Simulate API call — replace with getDashboardStats() when backend is ready
        const timer = setTimeout(() => {
            setStats(MOCK_STATS)
            setRecent(MOCK_RECENT)
            setLoading(false)
        }, 900)
        return () => clearTimeout(timer)
    }, [])

    const username = localStorage.getItem('manager_username') || 'Manager'

    return (
        <div className="space-y-6">

            {/* Greeting */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        Good {getGreeting()}, {username} 👋
                    </h2>
                    <p className="text-sm text-gray-400 mt-0.5">
                        Here's what's happening at your restaurant today
                    </p>
                </div>
                <div className="text-sm text-gray-400">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* ── KPI Stat Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
                ) : (
                    <>
                        <StatCard
                            title="Today's Reservations"
                            value={stats.total_reservations_today}
                            subtitle="vs 15 yesterday"
                            icon="📅"
                            trend="+20%"
                            color="orange"
                        />
                        <StatCard
                            title="Tables Available"
                            value={`${stats.available_tables}/${stats.total_tables}`}
                            subtitle="Floor capacity"
                            icon="🪑"
                            color="blue"
                        />
                        <StatCard
                            title="Revenue Today"
                            value={`৳${(stats.revenue_today / 100).toLocaleString()}`}
                            subtitle="From confirmed orders"
                            icon="💰"
                            trend="+8%"
                            color="emerald"
                        />
                        <StatCard
                            title="Bookings This Week"
                            value={stats.new_bookings_week}
                            subtitle="Last 7 days"
                            icon="📊"
                            trend="+12%"
                            color="purple"
                        />
                    </>
                )}
            </div>

            {/* ── Middle row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Reservation breakdown */}
                <Card className="lg:col-span-1">
                    <CardHeader
                        title="Today's Breakdown"
                        subtitle="Reservation status overview"
                    />
                    {loading ? (
                        <div className="space-y-3 animate-pulse">
                            {[1,2,3].map(i => <div key={i} className="h-4 bg-gray-100 rounded w-full" />)}
                        </div>
                    ) : (
                        <>
                            {/* Donut-style summary */}
                            <div className="flex items-center justify-around mb-4">
                                {[
                                    { label: 'Confirmed', value: stats.confirmed,  color: 'text-emerald-500' },
                                    { label: 'Pending',   value: stats.pending,    color: 'text-amber-500' },
                                    { label: 'Cancelled', value: stats.cancelled,  color: 'text-red-500' },
                                ].map(s => (
                                    <div key={s.label} className="text-center">
                                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                                    </div>
                                ))}
                            </div>
                            <StatusBar
                                confirmed={stats.confirmed}
                                pending={stats.pending}
                                cancelled={stats.cancelled}
                                total={stats.total_reservations_today}
                            />
                        </>
                    )}
                </Card>

                {/* Recent Reservations */}
                <Card padding={false} className="lg:col-span-2 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                        <div>
                            <p className="text-base font-semibold text-gray-900">Recent Reservations</p>
                            <p className="text-xs text-gray-400">Latest bookings for today</p>
                        </div>
                        <Link
                            to="/manager/reservations"
                            className="text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors"
                        >
                            View all →
                        </Link>
                    </div>

                    {loading ? (
                        <div className="px-6 py-2">
                            {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
                        </div>
                    ) : recent.length === 0 ? (
                        <EmptyState
                            title="No reservations yet today"
                            description="Bookings will appear here as guests reserve tables."
                        />
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {recent.map(r => (
                                <div key={r.id} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50/60 transition-colors">
                                    {/* Avatar */}
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600 text-xs font-bold">
                                        {r.guest_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </div>
                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 truncate">{r.guest_name}</p>
                                        <p className="text-xs text-gray-400">{r.table_number} · {r.start_time} · {r.guest_count} guests</p>
                                    </div>
                                    <Badge label={capitalize(r.status)} variant={r.status} />
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

            </div>

            {/* ── Activity Feed ── */}
            <Card>
                <CardHeader
                    title="Recent Activity"
                    subtitle="Latest changes across your restaurant"
                />
                {MOCK_ACTIVITY.length === 0 ? (
                    <EmptyState title="No recent activity" />
                ) : (
                    <div className="space-y-3">
                        {MOCK_ACTIVITY.map(a => (
                            <div key={a.id} className="flex items-start gap-3">
                                <ActivityIcon type={a.type} />
                                <div className="flex-1">
                                    <p className="text-sm text-gray-700">{a.message}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{a.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

        </div>
    )
}


// ─── Helpers ─────────────────────────────────────────────────────────────────

function getGreeting() {
    const h = new Date().getHours()
    if (h < 12) return 'morning'
    if (h < 17) return 'afternoon'
    return 'evening'
}

function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : ''
}
