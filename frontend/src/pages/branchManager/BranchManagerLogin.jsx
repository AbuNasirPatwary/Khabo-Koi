
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { loginBranchManager } from '../../api/branchManagerApi'

function BranchManagerLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [error, setError] = useState(location.state?.message || '')
  const [submitting, setSubmitting] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await loginBranchManager(credentials)
      navigate('/branch-manager/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#FDF8F0] lg:grid lg:grid-cols-2">
      <section className="bg-[#1A5C38] px-8 py-12 text-white lg:flex lg:min-h-screen lg:flex-col lg:justify-between lg:px-16">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-500 text-lg font-bold">K</span>
          <span className="text-2xl font-bold">Khabo<span className="text-orange-300">-Koi</span></span>
        </Link>
        <div className="my-16 max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-200">Branch operations</p>
          <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl">Run your assigned branch from one focused workspace.</h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-white/70">
            Reservations, food pre-orders, tables, menu availability and branch details are restricted by the server to your assigned branch.
          </p>
        </div>
        <p className="hidden text-xs text-white/40 lg:block">Authorized Khabo-Koi Branch Managers only</p>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">Secure branch access</p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900">Branch Manager Sign In</h2>
          <form onSubmit={submit} className="mt-8 rounded-2xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-900/5">
            <label className="block text-sm font-semibold text-slate-700">
              Username
              <input
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none focus:border-orange-400 focus:bg-white"
                required
              />
            </label>
            <label className="mt-5 block text-sm font-semibold text-slate-700">
              Password
              <input
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none focus:border-orange-400 focus:bg-white"
                required
              />
            </label>
            {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            <button disabled={submitting} className="mt-6 w-full rounded-xl bg-orange-500 px-5 py-3.5 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-60">
              {submitting ? 'Verifying access...' : 'Sign In'}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}

export default BranchManagerLogin
