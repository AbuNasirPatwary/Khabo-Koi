import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { confirmPasswordReset } from '../api/securityApi'


function ResetPassword() {
  const [searchParams] = useSearchParams()
  const uid = searchParams.get('uid') || ''
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const linkIsComplete = Boolean(uid && token)

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    setError('')

    if (password !== confirmation) {
      setError('The password confirmation does not match.')
      return
    }

    setSubmitting(true)
    try {
      const result = await confirmPasswordReset({ uid, token, newPassword: password })
      setMessage(result.message)
      setPassword('')
      setConfirmation('')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fdf8f0] px-6">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow">
        <h1 className="text-3xl font-bold text-gray-900">Choose a new password</h1>
        <p className="mt-2 text-gray-500">
          Use a strong password that you do not use for another account.
        </p>

        {!linkIsComplete ? (
          <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700" role="alert">
            This reset link is incomplete. Request a new link and try again.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="New password"
              className="w-full rounded-xl border px-4 py-3"
              autoComplete="new-password"
              required
            />
            <input
              type="password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder="Confirm new password"
              className="w-full rounded-xl border px-4 py-3"
              autoComplete="new-password"
              required
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-orange-500 py-3 font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}

        {message && <p className="mt-4 text-sm text-green-700" role="status">{message}</p>}
        {error && <p className="mt-4 text-sm text-red-700" role="alert">{error}</p>}

        <Link className="mt-6 inline-block text-sm font-semibold text-orange-600 hover:text-orange-700" to="/login">
          Go to sign in
        </Link>
      </section>
    </main>
  )
}


export default ResetPassword
