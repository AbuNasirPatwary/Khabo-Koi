// =============================================================================
// Badge — Status pill component
// =============================================================================

const variants = {
    confirmed:  'bg-emerald-100 text-emerald-700 border border-emerald-200',
    pending:    'bg-amber-100  text-amber-700  border border-amber-200',
    cancelled:  'bg-red-100    text-red-700    border border-red-200',
    active:     'bg-emerald-100 text-emerald-700 border border-emerald-200',
    inactive:   'bg-gray-100   text-gray-500   border border-gray-200',
    available:  'bg-blue-100   text-blue-700   border border-blue-200',
    occupied:   'bg-orange-100 text-orange-700 border border-orange-200',
    default:    'bg-gray-100   text-gray-600   border border-gray-200',
}

export function Badge({ label, variant = 'default', className = '' }) {
    const cls = variants[variant?.toLowerCase()] ?? variants.default
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls} ${className}`}>
            {label}
        </span>
    )
}
