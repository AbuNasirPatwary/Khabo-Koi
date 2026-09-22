import {
  API_URL,
  AUTH_EXPIRED_EVENT,
  authenticatedFetch,
  clearAuthentication,
  getProfileForProductRole,
  loginForProductRole,
  readJsonResponse,
} from './adminApi'


export const MANAGER_AUTH_EXPIRED_EVENT = AUTH_EXPIRED_EVENT


export function clearManagerAuthentication() {
  clearAuthentication()
}


export async function loginRestaurantManager(credentials) {
  return loginForProductRole(
    credentials,
    'RESTAURANT_MANAGER',
    'Restaurant Manager',
  )
}


export async function getRestaurantManagerProfile() {
  return getProfileForProductRole(
    'RESTAURANT_MANAGER',
    'Restaurant Manager',
  )
}


export async function getManagedRestaurants() {
  const response = await authenticatedFetch(
    `${API_URL}/manager/restaurant/`,
  )

  return readJsonResponse(
    response,
    'Unable to load assigned restaurant profiles.',
  )
}


export async function updateManagedRestaurant(
  restaurantId,
  profileFields,
) {
  const response = await authenticatedFetch(
    `${API_URL}/manager/restaurant/`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        restaurant_id: restaurantId,
        ...profileFields,
      }),
    },
  )

  return readJsonResponse(
    response,
    'Unable to update the restaurant profile.',
  )
}


// Manager operations share the same authenticated request and refresh-token
// path as the Admin portal, while Django remains responsible for ownership.
async function managerRequest(path, fallbackMessage, options = {}) {
  const response = await authenticatedFetch(
    `${API_URL}/manager/${path}`,
    options,
  )

  return readJsonResponse(response, fallbackMessage)
}


function jsonOptions(method, body) {
  return {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }
}


export function getManagerDashboard() {
  return managerRequest(
    'dashboard/',
    'Unable to load the Manager dashboard.',
  )
}


export function getManagerBranches() {
  return managerRequest('branches/', 'Unable to load branches.')
}


export function createManagerBranch(branch) {
  return managerRequest(
    'branches/',
    'Unable to create the branch.',
    jsonOptions('POST', branch),
  )
}


export function updateManagerBranch(branchId, changes) {
  return managerRequest(
    `branches/${branchId}/`,
    'Unable to update the branch.',
    jsonOptions('PATCH', changes),
  )
}


export function deactivateManagerBranch(branchId) {
  return managerRequest(
    `branches/${branchId}/`,
    'Unable to deactivate the branch.',
    { method: 'DELETE' },
  )
}


export function getManagerMenuItems() {
  return managerRequest('menu/', 'Unable to load menu items.')
}


export function createManagerMenuItem(item) {
  return managerRequest(
    'menu/',
    'Unable to create the menu item.',
    jsonOptions('POST', item),
  )
}


export function updateManagerMenuItem(itemId, changes) {
  return managerRequest(
    `menu/${itemId}/`,
    'Unable to update the menu item.',
    jsonOptions('PATCH', changes),
  )
}


export function deactivateManagerMenuItem(itemId) {
  return managerRequest(
    `menu/${itemId}/`,
    'Unable to deactivate the menu item.',
    { method: 'DELETE' },
  )
}


export function getManagerTables() {
  return managerRequest('tables/', 'Unable to load tables.')
}


export function createManagerTable(table) {
  return managerRequest(
    'tables/',
    'Unable to create the table.',
    jsonOptions('POST', table),
  )
}


export function updateManagerTable(tableId, changes) {
  return managerRequest(
    `tables/${tableId}/`,
    'Unable to update the table.',
    jsonOptions('PATCH', changes),
  )
}


export function deactivateManagerTable(tableId) {
  return managerRequest(
    `tables/${tableId}/`,
    'Unable to deactivate the table.',
    { method: 'DELETE' },
  )
}


export function getManagerReservations(filters = {}) {
  const searchParams = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      searchParams.set(key, value)
    }
  })

  const query = searchParams.toString()

  return managerRequest(
    `reservations/${query ? `?${query}` : ''}`,
    'Unable to load reservations.',
  )
}


export function updateManagerReservationStatus(bookingId, status) {
  return managerRequest(
    `reservations/${bookingId}/status/`,
    'Unable to update the reservation status.',
    jsonOptions('PATCH', { status }),
  )
}
