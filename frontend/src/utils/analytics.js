export const ANALYTICS_PERIODS = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'custom', label: 'Custom range' },
]


export function createAnalyticsQuery(filters = {}) {
  const params = new URLSearchParams()
  const period = filters.period || '30d'

  params.set('range', period)

  if (period === 'custom') {
    if (filters.startDate) params.set('date_from', filters.startDate)
    if (filters.endDate) params.set('date_to', filters.endDate)
  }

  return params.toString()
}


export function formatNumber(value) {
  return Number(value || 0).toLocaleString()
}


export function formatMoney(value) {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}


export function normalizeStatusDistribution(distribution) {
  if (Array.isArray(distribution)) {
    return distribution.map((item) => ({
      label: item.label || item.status || 'Unknown',
      value: Number(item.value ?? item.count ?? 0),
    }))
  }

  return Object.entries(distribution || {}).map(([status, value]) => ({
    label: status.replaceAll('_', ' '),
    value: Number(value || 0),
  }))
}


function csvCell(value) {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}


export function buildAnalyticsCsv(analytics, scopeLabel = 'Analytics') {
  const reservations = analytics?.reservations || {}
  const preorders = analytics?.preorders || {}
  const rows = [
    ['Khabo-Koi analytics report'],
    ['Scope', scopeLabel],
    ['From', analytics?.period?.date_from || ''],
    ['To', analytics?.period?.date_to || ''],
    [],
    ['Summary', 'Value'],
    ['Reservations', reservations.total || 0],
    ['Reserved guests', reservations.guests || 0],
    ['Completion rate', `${reservations.completion_rate || 0}%`],
    ['Cancellation rate', `${reservations.cancellation_rate || 0}%`],
    ['Preorders', preorders.total || 0],
    ['Preorder value', preorders.total_value || 0],
    ['Amount collected', preorders.collected_amount || 0],
    ['Outstanding amount', preorders.outstanding_amount || 0],
  ]

  if (analytics?.branch_performance?.length) {
    rows.push(
      [],
      ['Branch performance'],
      ['Restaurant', 'Branch', 'Reservations', 'Completed', 'Cancelled', 'Guests', 'Preorders', 'Preorder value'],
      ...analytics.branch_performance.map((branch) => [
        branch.restaurant_name || '',
        branch.branch_name || branch.name || '',
        branch.reservations || 0,
        branch.completed || 0,
        branch.cancelled || 0,
        branch.guests || 0,
        branch.preorders || 0,
        branch.preorder_value || 0,
      ]),
    )
  }

  if (analytics?.top_items?.length) {
    rows.push(
      [],
      ['Top-selling food items'],
      ['Item', 'Category', 'Quantity', 'Value'],
      ...analytics.top_items.map((item) => [
        item.name || item.food_item_name || '',
        item.category || '',
        item.quantity || 0,
        item.value || item.total_value || 0,
      ]),
    )
  }

  return rows.map((row) => row.map(csvCell).join(',')).join('\n')
}
