// =============================================================================
// StatCard — KPI card for Dashboard
// =============================================================================

export function StatCard({ title, value, subtitle, icon, trend, color = 'orange' }) {
    const colors = {
        orange: {
            bg: 'bg-orange-50',
            icon: 'text-orange-500',
            trend: 'text-orange-600',
        },
        emerald: {
            bg: 'bg-emerald-50',
            icon: 'text-emerald-500',
            trend: 'text-emerald-600',
        },
        blue: {
            bg: 'bg-blue-50',
            icon: 'text-blue-500',
            trend: 'text-blue-600',
        },
        purple: {
            bg: 'bg-purple-50',
            icon: 'text-purple-500',
            trend: 'text-purple-600',
        },
    }

    const c = colors[color] ?? colors.orange

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between mb-4">
                {/* Icon */}
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.bg}`}>
                    <span className={`text-xl ${c.icon}`}>{icon}</span>
                </div>

                {/* Trend badge */}
                {trend && (
                    <span className={`text-xs font-semibold ${c.trend} bg-opacity-10 ${c.bg} px-2 py-0.5 rounded-full`}>
                        {trend}
                    </span>
                )}
            </div>

            <p className="text-3xl font-bold text-gray-900">{value}</p>
            <p className="mt-1 text-sm font-medium text-gray-700">{title}</p>
            {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
        </div>
    )
}
