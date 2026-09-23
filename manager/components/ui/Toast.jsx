// =============================================================================
// Toast — Context + Hook for success/error notifications
// Usage: const { toast } = useToast(); toast.success('Saved!');
// =============================================================================

import { createContext, useCallback, useContext, useState } from 'react'


const ToastContext = createContext(null)


export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])

    const addToast = useCallback((message, type = 'success') => {
        const id = Date.now()
        setToasts(prev => [...prev, { id, message, type }])
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, 3500)
    }, [])

    const toast = {
        success: (msg) => addToast(msg, 'success'),
        error: (msg) => addToast(msg, 'error'),
        info: (msg) => addToast(msg, 'info'),
    }

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}

            {/* Toast Container */}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3">
                {toasts.map(t => (
                    <div
                        key={t.id}
                        className={`flex items-center gap-3 rounded-xl px-5 py-3.5 shadow-2xl text-sm font-medium text-white animate-slide-up
                            ${t.type === 'success' ? 'bg-emerald-500' : ''}
                            ${t.type === 'error' ? 'bg-red-500' : ''}
                            ${t.type === 'info' ? 'bg-blue-500' : ''}
                        `}
                    >
                        {t.type === 'success' && (
                            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                        {t.type === 'error' && (
                            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                        {t.type === 'info' && (
                            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                        {t.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}


export function useToast() {
    const ctx = useContext(ToastContext)
    if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
    return ctx
}
