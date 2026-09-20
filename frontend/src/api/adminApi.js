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


function getRefreshToken() {
  return localStorage.getItem('refresh_token')
}


export function clearAuthentication() {
  sessionGeneration += 1
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}


export const ADMIN_AUTH_EXPIRED_EVENT = 'khabo-koi:admin-auth-expired'


let sessionGeneration = 0
let refreshRequest = null


function createExpiredSessionError() {
  const error = new Error(
    'Your Admin session has expired. Please sign in again.',
  )

  error.code = 'ADMIN_AUTH_EXPIRED'

  return error
}


function expireAuthentication() {
  clearAuthentication()
  window.dispatchEvent(
    new CustomEvent(ADMIN_AUTH_EXPIRED_EVENT),
  )

  return createExpiredSessionError()
}


async function refreshAccessToken() {
  const refreshToken = getRefreshToken()
  const requestGeneration = sessionGeneration

  if (!refreshToken) {
    throw expireAuthentication()
  }

  // Several dashboard requests can discover an expired access token at the
  // same time. Reusing one in-flight refresh prevents duplicate renewals.
  if (
    !refreshRequest
    || refreshRequest.generation !== requestGeneration
    || refreshRequest.refreshToken !== refreshToken
  ) {
    const request = fetch(
      `${API_URL}/accounts/token/refresh/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh: refreshToken,
        }),
      },
    )
      .then(async (response) => {
        const data = await response.json().catch(() => ({}))

        // Logout or another login may have happened while this request was
        // in flight. Check that first: even a failed stale response must not
        // clear the credentials from a newer login.
        if (
          sessionGeneration !== requestGeneration
          || getRefreshToken() !== refreshToken
        ) {
          throw createExpiredSessionError()
        }

        if (!response.ok || !data.access) {
          throw expireAuthentication()
        }

        localStorage.setItem('access_token', data.access)

        // SimpleJWT may rotate refresh tokens when that option is enabled.
        if (data.refresh) {
          localStorage.setItem('refresh_token', data.refresh)
        }

        return data.access
      })
      .finally(() => {
        if (refreshRequest?.request === request) {
          refreshRequest = null
        }
      })

    refreshRequest = {
      generation: requestGeneration,
      refreshToken,
      request,
    }
  }

  return refreshRequest.request
}


async function authenticatedFetch(url, options = {}) {
  let accessToken = getAccessToken()

  if (!accessToken) {
    accessToken = await refreshAccessToken()
  }

  const sendRequest = (token) => fetch(
    url,
    {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    },
  )

  let response = await sendRequest(accessToken)

  // Only authentication failures trigger renewal. Permission failures remain
  // visible because refreshing cannot grant a missing Platform Admin role.
  if (response.status === 401) {
    const latestAccessToken = getAccessToken()

    // Another simultaneous request may already have renewed the token while
    // this response was in flight. Reuse it instead of refreshing twice.
    accessToken = (
      latestAccessToken
      && latestAccessToken !== accessToken
    )
      ? latestAccessToken
      : await refreshAccessToken()

    response = await sendRequest(accessToken)

    if (response.status === 401) {
      throw expireAuthentication()
    }
  }

  return response
}


export async function loginPlatformAdmin(credentials) {
  // A new login attempt must never inherit credentials from an older account.
  clearAuthentication()
  const loginGeneration = sessionGeneration

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

  // If the user logged out or started another sign-in while these requests
  // were running, this older result must not replace the newer session.
  if (sessionGeneration !== loginGeneration) {
    throw createExpiredSessionError()
  }

  localStorage.setItem('access_token', tokens.access)
  localStorage.setItem('refresh_token', tokens.refresh)

  return profile
}


export async function getPlatformAdminProfile() {
  const response = await authenticatedFetch(
    `${API_URL}/accounts/profile/`,
  )

  const profile = await readJsonResponse(
    response,
    'Unable to load the authenticated profile.',
  )

  if (profile.role !== 'ADMIN') {
    clearAuthentication()
    throw new Error(
      'This account does not have Platform Admin access.',
    )
  }

  return profile
}


export async function getPlatformAdminDashboard() {
  const response = await authenticatedFetch(
    `${API_URL}/accounts/admin/dashboard/`,
  )

  return readJsonResponse(
    response,
    'Unable to load the Platform Admin dashboard.',
  )
}


export async function getPlatformAdminUsers() {
  const response = await authenticatedFetch(
    `${API_URL}/accounts/admin/users/`,
  )

  return readJsonResponse(
    response,
    'Unable to load Platform Admin users.',
  )
}


// Authorization mutations stay in this API layer so UI components never need
// to know endpoint paths or repeat authenticated request headers.
export async function updatePlatformAdminUserRole(userId, role) {
  const response = await authenticatedFetch(
    `${API_URL}/accounts/admin/users/${userId}/role/`,
    {
      method: 'PATCH',
      headers: {
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
  const response = await authenticatedFetch(
    `${API_URL}/accounts/admin/users/${userId}/status/`,
    {
      method: 'PATCH',
      headers: {
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


export async function getPlatformAdminManagerAssignments() {
  const response = await authenticatedFetch(
    `${API_URL}/accounts/admin/manager-assignments/`,
  )

  return readJsonResponse(
    response,
    'Unable to load Manager assignments.',
  )
}


export async function createPlatformAdminManagerAssignment(
  userId,
  restaurantId,
) {
  const response = await authenticatedFetch(
    `${API_URL}/accounts/admin/manager-assignments/`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        restaurant_id: restaurantId,
      }),
    },
  )

  return readJsonResponse(
    response,
    'Unable to create the Manager assignment.',
  )
}


export async function updatePlatformAdminManagerAssignment(
  assignmentId,
  isActive,
) {
  const response = await authenticatedFetch(
    `${API_URL}/accounts/admin/manager-assignments/${assignmentId}/`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        is_active: isActive,
      }),
    },
  )

  return readJsonResponse(
    response,
    'Unable to update the Manager assignment.',
  )
}


export async function getRestaurantsForAdminAssignment() {
  const response = await fetch(
    `${API_URL}/restaurants/`,
  )

  return readJsonResponse(
    response,
    'Unable to load restaurants.',
  )
}


export async function getPlatformAdminRestaurants() {
  const response = await authenticatedFetch(
    `${API_URL}/admin/restaurants/`,
  )

  return readJsonResponse(
    response,
    'Unable to load restaurant oversight data.',
  )
}


export async function updatePlatformAdminRestaurantStatus(
  restaurantId,
  isActive,
) {
  const response = await authenticatedFetch(
    `${API_URL}/admin/restaurants/${restaurantId}/status/`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        is_active: isActive,
      }),
    },
  )

  return readJsonResponse(
    response,
    'Unable to update the restaurant status.',
  )
}


export async function getPlatformAdminBookings() {
  const response = await authenticatedFetch(
    `${API_URL}/admin/bookings/`,
  )

  return readJsonResponse(
    response,
    'Unable to load booking oversight data.',
  )
}
