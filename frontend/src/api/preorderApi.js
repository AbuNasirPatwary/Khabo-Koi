
import { API_URL, authenticatedFetch, readJsonResponse } from './adminApi'

export async function saveFoodPreorder(bookingId, payload) {
  const response = await authenticatedFetch(
    `${API_URL}/bookings/${bookingId}/preorder/`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  )
  return readJsonResponse(response, 'Unable to save the food pre-order.')
}
