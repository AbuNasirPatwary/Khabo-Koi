// =============================================================================
// MANAGER API — All fetch calls for the Manager Portal
// Uses manager_token stored in localStorage for Bearer auth
// =============================================================================

const API_BASE = 'http://127.0.0.1:8000/api'


function authHeaders() {
    const token = localStorage.getItem('manager_token')
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
}


async function request(path, options = {}) {
    try {
        const res = await fetch(`${API_BASE}${path}`, {
            headers: authHeaders(),
            ...options,
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.detail || data?.message || 'Request failed')
        return { data, ok: true }
    } catch (err) {
        return { data: null, ok: false, error: err.message }
    }
}


// ─── AUTH ───────────────────────────────────────────────────────────────────

export async function managerLogin({ username, password }) {
    return request('/accounts/manager-login/', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
    })
}


// ─── RESERVATIONS ───────────────────────────────────────────────────────────

export async function getReservations(params = {}) {
    const query = new URLSearchParams(params).toString()
    return request(`/reservations/?${query}`)
}

export async function updateReservationStatus(id, status) {
    return request(`/reservations/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    })
}


// ─── TABLES ─────────────────────────────────────────────────────────────────

export async function getTables() {
    return request('/manager/tables/')
}

export async function createTable(data) {
    return request('/manager/tables/', {
        method: 'POST',
        body: JSON.stringify(data),
    })
}

export async function updateTable(id, data) {
    return request(`/manager/tables/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(data),
    })
}

export async function deleteTable(id) {
    return request(`/manager/tables/${id}/`, { method: 'DELETE' })
}


// ─── MENU ────────────────────────────────────────────────────────────────────

export async function getMenuItems() {
    return request('/manager/menu/')
}

export async function createMenuItem(data) {
    return request('/manager/menu/', {
        method: 'POST',
        body: JSON.stringify(data),
    })
}

export async function updateMenuItem(id, data) {
    return request(`/manager/menu/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(data),
    })
}

export async function deleteMenuItem(id) {
    return request(`/manager/menu/${id}/`, { method: 'DELETE' })
}


// ─── RESTAURANT PROFILE ──────────────────────────────────────────────────────

export async function getRestaurantProfile() {
    return request('/manager/restaurant/')
}

export async function updateRestaurantProfile(data) {
    return request('/manager/restaurant/', {
        method: 'PUT',
        body: JSON.stringify(data),
    })
}


// ─── BRANCHES ────────────────────────────────────────────────────────────────

export async function getBranches() {
    return request('/manager/branches/')
}

export async function createBranch(data) {
    return request('/manager/branches/', {
        method: 'POST',
        body: JSON.stringify(data),
    })
}

export async function updateBranch(id, data) {
    return request(`/manager/branches/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(data),
    })
}

export async function deleteBranch(id) {
    return request(`/manager/branches/${id}/`, { method: 'DELETE' })
}


// ─── DASHBOARD STATS ─────────────────────────────────────────────────────────

export async function getDashboardStats() {
    return request('/manager/dashboard/')
}
