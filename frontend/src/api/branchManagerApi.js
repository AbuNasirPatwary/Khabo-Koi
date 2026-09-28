
import {
  API_URL,
  AUTH_EXPIRED_EVENT,
  authenticatedFetch,
  clearAuthentication,
  getProfileForProductRole,
  loginForProductRole,
  readJsonResponse,
} from './adminApi'

export const BRANCH_MANAGER_AUTH_EXPIRED_EVENT = AUTH_EXPIRED_EVENT
export const clearBranchManagerAuthentication = clearAuthentication

export function loginBranchManager(credentials) {
  return loginForProductRole(credentials, 'BRANCH_MANAGER', 'Branch Manager')
}

export function getBranchManagerProfile() {
  return getProfileForProductRole('BRANCH_MANAGER', 'Branch Manager')
}

async function branchRequest(path, fallbackMessage, options = {}) {
  const response = await authenticatedFetch(
    `${API_URL}/branch-manager/${path}`,
    options,
  )
  return readJsonResponse(response, fallbackMessage)
}

function jsonOptions(method, body) {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}

export const getBranchManagerContext = () => branchRequest('context/', 'Unable to load assigned branch.')
export const getBranchManagerDashboard = () => branchRequest('dashboard/', 'Unable to load dashboard.')
export const getBranchManagerTables = () => branchRequest('tables/', 'Unable to load tables.')
export const getBranchManagerMenu = () => branchRequest('menu/', 'Unable to load menu availability.')
export const getBranchManagerNotifications = () => branchRequest('notifications/', 'Unable to load notifications.')

export function updateBranchManagerContext(changes) {
  return branchRequest('context/', 'Unable to update branch profile.', jsonOptions('PATCH', changes))
}

export function getBranchManagerReservations(filters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== '' && v !== null && v !== undefined) params.set(k, v)
  })
  const query = params.toString()
  return branchRequest(`reservations/${query ? `?${query}` : ''}`, 'Unable to load reservations.')
}

export function updateBranchManagerReservationStatus(id, status) {
  return branchRequest(`reservations/${id}/status/`, 'Unable to update reservation.', jsonOptions('PATCH', { status }))
}

export function createBranchManagerTable(table) {
  return branchRequest('tables/', 'Unable to create table.', jsonOptions('POST', table))
}

export function updateBranchManagerTable(id, changes) {
  return branchRequest(`tables/${id}/`, 'Unable to update table.', jsonOptions('PATCH', changes))
}

export function deactivateBranchManagerTable(id) {
  return branchRequest(`tables/${id}/`, 'Unable to deactivate table.', { method: 'DELETE' })
}

export function updateBranchMenuAvailability(foodItemId, isAvailable) {
  return branchRequest('menu/', 'Unable to update menu availability.', jsonOptions('PATCH', {
    food_item_id: foodItemId,
    is_available: isAvailable,
  }))
}

export function getBranchManagerPreorders(status = '') {
  return branchRequest(`preorders/${status ? `?status=${encodeURIComponent(status)}` : ''}`, 'Unable to load food pre-orders.')
}

export function updateBranchManagerPreorderStatus(id, status) {
  return branchRequest(`preorders/${id}/status/`, 'Unable to update food pre-order.', jsonOptions('PATCH', { status }))
}
