// =============================================================================
// Button — Primary / secondary / ghost / danger variants
// =============================================================================

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    type = 'button',
    onClick,
    className = '',
    ...rest
}) {
    const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

    const variants = {
        primary:   'bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-400 shadow-sm hover:shadow-md',
        secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 focus:ring-gray-300 shadow-sm',
        ghost:     'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-300',
        danger:    'bg-red-500 text-white hover:bg-red-600 focus:ring-red-400 shadow-sm',
        success:   'bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-400 shadow-sm',
    }

    const sizes = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
    }

    return (
        <button
            type={type}
            disabled={disabled || loading}
            onClick={onClick}
            className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
            {...rest}
        >
            {loading && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            )}
            {children}
        </button>
    )
}
