const API_URL = (
  import.meta.env.VITE_API_URL
  || 'http://127.0.0.1:8000/api'
)


function getErrorMessage(data, fallbackMessage) {
  if (typeof data?.detail === 'string') {
    return data.detail
  }

  if (typeof data?.error === 'string') {
    return data.error
  }

  const firstFieldError = Object.values(data || {})[0]

  if (Array.isArray(firstFieldError) && firstFieldError[0]) {
    return firstFieldError[0]
  }

  return fallbackMessage
}


async function readJsonResponse(response, fallbackMessage) {
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, fallbackMessage)
    )
  }

  return data
}


function getAccessToken() {
  return localStorage.getItem('access_token')
}


function getAuthorizationHeaders() {
  const token = getAccessToken()

  if (!token) {
    throw new Error('Please sign in with a Platform Admin account.')
  }

  return {
    Authorization: `Bearer ${token}`,
  }
}


export async function loginPlatformAdmin(credentials) {
  const loginResponse = await fetch(
    `${API_URL}/accounts/login/`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    },
  )

  const tokens = await readJsonResponse(
    loginResponse,
    'Invalid username or password.',
  )

  // Verify the product role before persisting tokens. Hiding an Admin route in
  // React is not security; Django remains the authorization source of truth.
  const profileResponse = await fetch(
    `${API_URL}/accounts/profile/`,
    {
      headers: {
        Authorization: `Bearer ${tokens.access}`,
      },
    },
  )

  const profile = await readJsonResponse(
    profileResponse,
    'Unable to verify the account role.',
  )

  if (profile.role !== 'ADMIN') {
    throw new Error(
      'This account does not have Platform Admin access.',
    )
  }

  localStorage.setItem('access_token', tokens.access)
  localStorage.setItem('refresh_token', tokens.refresh)

  return profile
}


export async function getPlatformAdminProfile() {
  const response = await fetch(
    `${API_URL}/accounts/profile/`,
    {
      headers: getAuthorizationHeaders(),
    },
  )

  const profile = await readJsonResponse(
    response,
    'Unable to load the authenticated profile.',
  )

  if (profile.role !== 'ADMIN') {
    throw new Error(
      'This account does not have Platform Admin access.',
    )
  }

  return profile
}


export async function getPlatformAdminDashboard() {
  const response = await fetch(
    `${API_URL}/accounts/admin/dashboard/`,
    {
      headers: getAuthorizationHeaders(),
    },
  )

  return readJsonResponse(
    response,
    'Unable to load the Platform Admin dashboard.',
  )
}


export async function getPlatformAdminUsers() {
  const response = await fetch(
    `${API_URL}/accounts/admin/users/`,
    {
      headers: getAuthorizationHeaders(),
    },
  )

  return readJsonResponse(
    response,
    'Unable to load Platform Admin users.',
  )
}


// Authorization mutations stay in this API layer so UI components never need
// to know endpoint paths or repeat authenticated request headers.
export async function updatePlatformAdminUserRole(userId, role) {
  const response = await fetch(
    `${API_URL}/accounts/admin/users/${userId}/role/`,
    {
      method: 'PATCH',
      headers: {
        ...getAuthorizationHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role }),
    },
  )

  return readJsonResponse(
    response,
    'Unable to update the user role.',
  )
}


export async function updatePlatformAdminAccountStatus(
  userId,
  isActive,
) {
  const response = await fetch(
    `${API_URL}/accounts/admin/users/${userId}/status/`,
    {
      method: 'PATCH',
      headers: {
        ...getAuthorizationHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        is_active: isActive,
      }),
    },
  )

  return readJsonResponse(
    response,
    'Unable to update the account status.',
  )
}


export function clearAuthentication() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}
