import {
    API_URL,
    authenticatedFetch,
    readJsonResponse,
} from './adminApi'


export async function askDiningAssistant(message) {
    const response = await authenticatedFetch(
        `${API_URL}/ai/assistant/`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message }),
        },
    )

    return readJsonResponse(
        response,
        'Unable to contact the AI dining assistant.',
    )
}