// =============================================================================
// EmptyState — Illustrated empty state with CTA
// =============================================================================

export function EmptyState({
    icon,
    title = 'Nothing here yet',
    description = '',
    action,
}) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            {/* Icon bubble */}
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-orange-50">
                {icon || (
                    <svg className="h-10 w-10 text-orange-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                )}
            </div>

            <h3 className="text-base font-semibold text-gray-900">{title}</h3>

            {description && (
                <p className="mt-1.5 max-w-xs text-sm text-gray-500">{description}</p>
            )}

            {action && (
                <div className="mt-5">{action}</div>
            )}
        </div>
    )
}
