import { useState } from 'react'
import { Link } from 'react-router-dom'

import { requestPasswordReset } from '../api/securityApi'


function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')

    try {
      const result = await requestPasswordReset(email)
      setMessage(result.message)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fdf8f0] px-6">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-600">
          Account recovery
        </p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">Forgot password?</h1>
        <p className="mt-2 text-gray-500">
          Enter your account email. If it matches an active account, we will send a one-time reset link.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-gray-700" htmlFor="reset-email">
            Email address
          </label>
          <input
            id="reset-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border px-4 py-3"
            autoComplete="email"
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-orange-500 py-3 font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Sending…' : 'Send reset link'}
          </button>
        </form>

        {message && <p className="mt-4 text-sm text-green-700" role="status">{message}</p>}
        {error && <p className="mt-4 text-sm text-red-700" role="alert">{error}</p>}

        <Link className="mt-6 inline-block text-sm font-semibold text-orange-600 hover:text-orange-700" to="/login">
          Back to sign in
        </Link>
      </section>
    </main>
  )
}


export default ForgotPassword
