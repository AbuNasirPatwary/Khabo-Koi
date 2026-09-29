import {
  API_URL,
  authenticatedFetch,
  readJsonResponse,
} from './adminApi'


function createHistoryQuery(filters = {}) {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      params.set(key, value)
    }
  })

  return params.toString()
}


async function getHistory(path, filters) {
  const query = createHistoryQuery(filters)
  const response = await authenticatedFetch(
    `${API_URL}/${path}/operations/history/${query ? `?${query}` : ''}`,
  )

  return readJsonResponse(
    response,
    'Unable to load operational status history.',
  )
}


export const getAdminOperationalHistory = (filters) => (
  getHistory('admin', filters)
)

export const getManagerOperationalHistory = (filters) => (
  getHistory('manager', filters)
)

export const getBranchManagerOperationalHistory = (filters) => (
  getHistory('branch-manager', filters)
)
