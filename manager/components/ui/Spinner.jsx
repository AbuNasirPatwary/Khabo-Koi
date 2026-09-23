// =============================================================================
// Spinner + Skeleton loaders
// =============================================================================

export function Spinner({ size = 'md', className = '' }) {
    const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
    return (
        <svg
            className={`animate-spin text-orange-500 ${sizes[size]} ${className}`}
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
    )
}


export function PageLoader() {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
                <Spinner size="lg" />
                <p className="text-sm text-gray-400">Loading...</p>
            </div>
        </div>
    )
}


export function SkeletonCard() {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gray-200" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
            </div>
            <div className="space-y-2">
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-4/5" />
                <div className="h-3 bg-gray-100 rounded w-3/5" />
            </div>
        </div>
    )
}


export function SkeletonRow() {
    return (
        <div className="animate-pulse flex items-center gap-4 py-3 border-b border-gray-50">
            <div className="h-4 bg-gray-200 rounded w-8" />
            <div className="h-4 bg-gray-200 rounded flex-1" />
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="h-4 bg-gray-200 rounded w-20" />
            <div className="h-6 bg-gray-100 rounded-full w-16" />
        </div>
    )
}


export function SkeletonStatCard() {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-gray-200" />
                <div className="h-5 bg-gray-100 rounded-full w-12" />
            </div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-2/3" />
        </div>
    )
}
