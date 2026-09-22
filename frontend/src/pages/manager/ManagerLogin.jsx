import { useState } from 'react'
import {
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import { loginRestaurantManager } from '../../api/managerApi'


function ManagerLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState(
    location.state?.message || '',
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(event) {
    setCredentials((currentCredentials) => ({
      ...currentCredentials,
      [event.target.name]: event.target.value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      await loginRestaurantManager(credentials)
      navigate('/manager/dashboard', {
        replace: true,
      })
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f2e9] lg:grid lg:grid-cols-2">
      <section className="relative min-w-0 overflow-hidden bg-[#1a2332] px-7 py-10 text-white sm:px-12 lg:flex lg:min-h-screen lg:flex-col lg:justify-between lg:px-16 lg:py-14">
        <div className="absolute -right-28 top-20 h-80 w-80 rounded-full bg-orange-500/15 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />

        <Link to="/" className="relative flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-500 text-lg font-bold">
            K
          </span>
          <span className="text-2xl font-bold">
            Khabo<span className="text-orange-400">-Koi</span>
          </span>
        </Link>

        <div className="relative my-14 max-w-xl lg:my-0">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-300">
            Restaurant operations
          </p>
          <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl">
            Manage assigned restaurants with confidence.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">
            Your role and restaurant access are checked by the server before
            the Manager workspace opens.
          </p>

          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {[
              'Assignment-scoped restaurant access',
              'Secure role verification',
              'One workspace for daily operations',
            ].map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-3 text-sm text-slate-200"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500/20 text-orange-300">
                  ✓
                </span>
                {feature}
              </div>
            ))}
          </div>
        </div>

        <p className="relative hidden text-xs text-white/35 lg:block">
          Authorized Khabo-Koi Restaurant Managers only
        </p>
      </section>

      <section className="flex min-w-0 items-center justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="w-full max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">
            Secure Manager access
          </p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900">
            Sign in to the Manager Portal
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Use your Khabo-Koi credentials. The server will verify your
            Restaurant Manager role before storing the session.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8"
          >
            <label className="block text-sm font-semibold text-slate-700">
              Username
              <input
                name="username"
                value={credentials.username}
                onChange={handleChange}
                autoComplete="username"
                placeholder="Enter your username"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                required
              />
            </label>

            <label className="mt-5 block text-sm font-semibold text-slate-700">
              Password
              <span className="relative mt-2 block">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={credentials.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-20 font-normal outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((isVisible) => !isVisible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:text-slate-800"
                  aria-label={`${showPassword ? 'Hide' : 'Show'} password`}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </span>
            </label>

            {errorMessage && (
              <div
                role="alert"
                className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 w-full rounded-xl bg-orange-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600 disabled:cursor-wait disabled:opacity-65"
            >
              {isSubmitting
                ? 'Verifying access...'
                : 'Sign In to Manager Dashboard'}
            </button>
          </form>

          <Link
            to="/"
            className="mt-7 inline-flex text-sm font-semibold text-slate-600 transition hover:text-orange-600"
          >
            ← Back to Khabo-Koi
          </Link>
        </div>
      </section>
    </main>
  )
}


export default ManagerLogin
