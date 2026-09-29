import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import {
  confirmEmailVerification,
  requestEmailVerification,
} from '../api/securityApi'


function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const uid = searchParams.get('uid') || ''
  const token = searchParams.get('token') || ''
  const hasVerificationLink = Boolean(uid && token)
  const confirmationStarted = useRef(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(hasVerificationLink)

  useEffect(() => {
    if (!hasVerificationLink || confirmationStarted.current) return

    confirmationStarted.current = true
    confirmEmailVerification({ uid, token })
      .then((result) => setMessage(result.message))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setSubmitting(false))
  }, [hasVerificationLink, token, uid])

  async function handleRequest() {
    setSubmitting(true)
    setMessage('')
    setError('')

    try {
      const result = await requestEmailVerification()
      setMessage(result.message)
    } catch (requestError) {
      setError(
        requestError.message === 'The request could not be completed.'
          ? 'Please sign in before requesting a verification email.'
          : requestError.message,
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fdf8f0] px-6">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow">
        <h1 className="text-3xl font-bold text-gray-900">Verify your email</h1>
        <p className="mt-2 text-gray-500">
          Verification confirms that you control the email address on your account.
        </p>

        {hasVerificationLink ? (
          <p className="mt-6 text-sm text-gray-600">
            {submitting ? 'Checking your verification link…' : 'Verification check complete.'}
          </p>
        ) : (
          <button
            type="button"
            onClick={handleRequest}
            disabled={submitting}
            className="mt-6 w-full rounded-xl bg-orange-500 py-3 font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Sending…' : 'Send verification email'}
          </button>
        )}

        {message && <p className="mt-4 text-sm text-green-700" role="status">{message}</p>}
        {error && <p className="mt-4 text-sm text-red-700" role="alert">{error}</p>}

        <Link className="mt-6 inline-block text-sm font-semibold text-orange-600 hover:text-orange-700" to="/profile">
          Return to profile
        </Link>
      </section>
    </main>
  )
}


export default VerifyEmail
