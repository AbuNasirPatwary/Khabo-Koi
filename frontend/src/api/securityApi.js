import { API_URL } from './adminApi'


const ACCOUNTS_API_URL = `${API_URL}/accounts`


async function readResponse(response) {
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const fieldMessage = Object.values(data).flat().find(Boolean)
    throw new Error(data.detail || fieldMessage || 'The request could not be completed.')
  }

  return data
}


export async function requestPasswordReset(email) {
  const response = await fetch(`${ACCOUNTS_API_URL}/password-reset/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })

  return readResponse(response)
}


export async function confirmPasswordReset({ uid, token, newPassword }) {
  const response = await fetch(`${ACCOUNTS_API_URL}/password-reset/confirm/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      uid,
      token,
      new_password: newPassword,
    }),
  })

  return readResponse(response)
}


export async function requestEmailVerification() {
  const accessToken = localStorage.getItem('access_token')
  const response = await fetch(`${ACCOUNTS_API_URL}/email-verification/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken || ''}`,
    },
  })

  return readResponse(response)
}


export async function confirmEmailVerification({ uid, token }) {
  const response = await fetch(`${ACCOUNTS_API_URL}/email-verification/confirm/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid, token }),
  })

  return readResponse(response)
}
