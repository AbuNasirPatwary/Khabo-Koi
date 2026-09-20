// =============================================================================
// Card — Consistent white card wrapper
// =============================================================================

export function Card({ children, className = '', padding = true }) {
    return (
        <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${padding ? 'p-6' : ''} ${className}`}>
            {children}
        </div>
    )
}

export function CardHeader({ title, subtitle, action }) {
    return (
        <div className="flex items-start justify-between mb-5">
            <div>
                <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
            {action && <div>{action}</div>}
        </div>
    )
}
