// =============================================================================
// ManagerLogin — Dedicated login page for restaurant managers
// =============================================================================

import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { managerLogin } from '../api/managerApi'


function FieldError({ msg }) {
    if (!msg) return null
    return <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
        <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        {msg}
    </p>
}


export default function ManagerLogin() {
    const navigate = useNavigate()

    // Already logged in → skip to dashboard
    if (localStorage.getItem('manager_token')) {
        return <Navigate to="/manager" replace />
    }

    const [form, setForm] = useState({ username: '', password: '' })
    const [errors, setErrors] = useState({})
    const [serverError, setServerError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPass, setShowPass] = useState(false)

    function validate() {
        const e = {}
        if (!form.username.trim()) e.username = 'Username is required'
        if (!form.password) e.password = 'Password is required'
        else if (form.password.length < 6) e.password = 'Password must be at least 6 characters'
        return e
    }

    function handleChange(e) {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
        // Clear field error on type
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
        setServerError('')
    }

    async function handleSubmit(e) {
        e.preventDefault()
        const errs = validate()
        if (Object.keys(errs).length) {
            setErrors(errs)
            return
        }

        setLoading(true)
        setServerError('')

        const { data, ok, error } = await managerLogin(form)

        setLoading(false)

        if (ok && data?.access) {
            localStorage.setItem('manager_token', data.access)
            localStorage.setItem('manager_username', data.username || form.username)
            navigate('/manager')
        } else {
            setServerError(error || 'Invalid credentials. Please try again.')
        }
    }

    return (
        <div className="min-h-screen bg-[#fdf8f0] flex">

            {/* ── Left panel (brand/illustration) ── */}
            <div className="hidden lg:flex lg:w-1/2 bg-[#1a1a2e] flex-col items-center justify-center p-12 relative overflow-hidden">

                {/* Background decorative circles */}
                <div className="absolute top-[-80px] left-[-80px] w-72 h-72 rounded-full bg-orange-500 opacity-10" />
                <div className="absolute bottom-[-100px] right-[-100px] w-96 h-96 rounded-full bg-orange-400 opacity-10" />

                {/* Content */}
                <div className="relative z-10 text-center max-w-md">
                    {/* Logo */}
                    <div className="flex items-center justify-center gap-3 mb-10">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 font-bold text-white text-2xl shadow-lg shadow-orange-500/30">
                            K
                        </div>
                        <div className="text-left">
                            <span className="font-extrabold text-2xl text-white">Khabo-</span>
                            <span className="font-extrabold text-2xl text-orange-400">Koi</span>
                        </div>
                    </div>

                    {/* Headline */}
                    <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
                        Manage your<br />
                        restaurant with<br />
                        <span className="text-orange-400">confidence.</span>
                    </h2>
                    <p className="text-gray-400 text-base leading-relaxed">
                        Control reservations, tables, menus, and branches — all in one powerful dashboard.
                    </p>

                    {/* Feature pills */}
                    <div className="mt-8 flex flex-wrap gap-2 justify-center">
                        {['📅 Reservations', '🍽 Menu', '🪑 Tables', '📍 Branches'].map(f => (
                            <span key={f} className="px-3 py-1.5 rounded-full bg-white/10 text-sm text-gray-300 font-medium">
                                {f}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Right panel (login form) ── */}
            <div className="flex flex-1 items-center justify-center p-6">
                <div className="w-full max-w-md">

                    {/* Mobile logo */}
                    <div className="flex lg:hidden items-center gap-2 mb-8">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 font-bold text-white">K</div>
                        <span className="font-bold text-gray-900">Khabo-<span className="text-orange-500">Koi</span></span>
                    </div>

                    {/* Role badge */}
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-600 mb-5">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
                        Restaurant Manager
                    </div>

                    <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Welcome back</h1>
                    <p className="text-gray-500 text-sm mb-8">Sign in to access your restaurant portal</p>

                    {/* Server error banner */}
                    {serverError && (
                        <div className="mb-5 flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                            <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <p className="text-sm text-red-600">{serverError}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate className="space-y-5">

                        {/* Username */}
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Username <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </span>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    autoComplete="username"
                                    value={form.username}
                                    onChange={handleChange}
                                    placeholder="Enter your username"
                                    className={`w-full rounded-xl border pl-10 pr-4 py-3 text-sm text-gray-800 placeholder-gray-400
                                        outline-none transition-all
                                        ${errors.username
                                            ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200'
                                            : 'border-gray-200 bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-100'
                                        }`}
                                />
                            </div>
                            <FieldError msg={errors.username} />
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Password <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </span>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPass ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="Enter your password"
                                    className={`w-full rounded-xl border pl-10 pr-11 py-3 text-sm text-gray-800 placeholder-gray-400
                                        outline-none transition-all
                                        ${errors.password
                                            ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200'
                                            : 'border-gray-200 bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-100'
                                        }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(v => !v)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    aria-label="Toggle password visibility"
                                >
                                    {showPass ? (
                                        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            <FieldError msg={errors.password} />
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white
                                hover:bg-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2
                                disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-orange-500/20"
                        >
                            {loading && (
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            )}
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>

                    </form>

                    {/* Back to site link */}
                    <p className="mt-6 text-center text-sm text-gray-400">
                        Not a manager?{' '}
                        <a href="/" className="text-orange-500 font-medium hover:underline">
                            Back to Khabo-Koi
                        </a>
                    </p>

                </div>
            </div>
        </div>
    )
}
