// =============================================================================
// Reservations — Manager portal: view, filter, and update reservations
// =============================================================================

import { useEffect, useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { SkeletonRow } from '../components/ui/Spinner'
import { Modal, ModalFooter } from '../components/ui/Modal'
import { Select } from '../components/ui/Input'
import { useToast } from '../components/ui/Toast'


// ─── Mock data ───────────────────────────────────────────────────────────────

const MOCK_RESERVATIONS = [
    { id: 1,  guest_name: 'Arif Rahman',     table_number: 'T-04', branch_name: 'Gulshan',    reservation_date: '2026-09-20', start_time: '19:00', guest_count: 3, status: 'confirmed', phone: '017XXXXXXX1' },
    { id: 2,  guest_name: 'Nadia Islam',     table_number: 'T-07', branch_name: 'Dhanmondi', reservation_date: '2026-09-20', start_time: '19:30', guest_count: 2, status: 'pending',   phone: '018XXXXXXX2' },
    { id: 3,  guest_name: 'Karim Hossain',  table_number: 'T-11', branch_name: 'Gulshan',    reservation_date: '2026-09-20', start_time: '20:00', guest_count: 5, status: 'confirmed', phone: '019XXXXXXX3' },
    { id: 4,  guest_name: 'Sadia Akter',    table_number: 'T-02', branch_name: 'Uttara',     reservation_date: '2026-09-20', start_time: '20:30', guest_count: 2, status: 'cancelled', phone: '016XXXXXXX4' },
    { id: 5,  guest_name: 'Jahangir Ali',   table_number: 'T-15', branch_name: 'Dhanmondi', reservation_date: '2026-09-20', start_time: '21:00', guest_count: 4, status: 'confirmed', phone: '015XXXXXXX5' },
    { id: 6,  guest_name: 'Farzana Begum',  table_number: 'T-03', branch_name: 'Gulshan',    reservation_date: '2026-09-21', start_time: '18:30', guest_count: 6, status: 'pending',   phone: '017XXXXXXX6' },
    { id: 7,  guest_name: 'Rakib Uddin',    table_number: 'T-09', branch_name: 'Uttara',     reservation_date: '2026-09-21', start_time: '19:00', guest_count: 2, status: 'confirmed', phone: '018XXXXXXX7' },
    { id: 8,  guest_name: 'Mitu Chowdhury', table_number: 'T-06', branch_name: 'Gulshan',    reservation_date: '2026-09-21', start_time: '20:00', guest_count: 3, status: 'pending',   phone: '019XXXXXXX8' },
]

const STATUS_OPTIONS = [
    { value: '', label: 'All Statuses' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'pending',   label: 'Pending' },
    { value: 'cancelled', label: 'Cancelled' },
]

const UPDATE_STATUS_OPTIONS = [
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'pending',   label: 'Pending' },
    { value: 'cancelled', label: 'Cancelled' },
]


export default function Reservations() {
    const { toast } = useToast()

    const [reservations, setReservations] = useState([])
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState({ status: '', date: '', search: '' })
    const [selected, setSelected] = useState(null)     // reservation to view/update
    const [newStatus, setNewStatus] = useState('')
    const [updating, setUpdating] = useState(false)

    useEffect(() => {
        const t = setTimeout(() => {
            setReservations(MOCK_RESERVATIONS)
            setLoading(false)
        }, 800)
        return () => clearTimeout(t)
    }, [])

    // ── Filtering ──
    const filtered = reservations.filter(r => {
        const matchStatus = !filters.status || r.status === filters.status
        const matchDate   = !filters.date   || r.reservation_date === filters.date
        const matchSearch = !filters.search ||
            r.guest_name.toLowerCase().includes(filters.search.toLowerCase()) ||
            r.table_number.toLowerCase().includes(filters.search.toLowerCase())
        return matchStatus && matchDate && matchSearch
    })

    function openDetail(r) {
        setSelected(r)
        setNewStatus(r.status)
    }

    async function handleStatusUpdate() {
        if (!selected || newStatus === selected.status) { setSelected(null); return }
        setUpdating(true)
        // Simulate API call
        await delay(700)
        setReservations(prev =>
            prev.map(r => r.id === selected.id ? { ...r, status: newStatus } : r)
        )
        toast.success(`Reservation #${selected.id} updated to "${newStatus}"`)
        setUpdating(false)
        setSelected(null)
    }

    // ── Summary counts ──
    const counts = {
        total:     reservations.length,
        confirmed: reservations.filter(r => r.status === 'confirmed').length,
        pending:   reservations.filter(r => r.status === 'pending').length,
        cancelled: reservations.filter(r => r.status === 'cancelled').length,
    }

    return (
        <div className="space-y-5">

            {/* Summary pills */}
            <div className="flex flex-wrap gap-3">
                {[
                    { label: 'Total',     value: counts.total,     color: 'bg-gray-100     text-gray-700' },
                    { label: 'Confirmed', value: counts.confirmed,  color: 'bg-emerald-100  text-emerald-700' },
                    { label: 'Pending',   value: counts.pending,    color: 'bg-amber-100    text-amber-700' },
                    { label: 'Cancelled', value: counts.cancelled,  color: 'bg-red-100      text-red-700' },
                ].map(s => (
                    <div key={s.label} className={`flex items-center gap-2 rounded-xl px-4 py-2 ${s.color}`}>
                        <span className="text-lg font-bold">{s.value}</span>
                        <span className="text-sm font-medium">{s.label}</span>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <Card className="!p-4">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <div className="relative flex-1 min-w-48">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search guest or table..."
                            value={filters.search}
                            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                        />
                    </div>

                    {/* Date filter */}
                    <input
                        type="date"
                        value={filters.date}
                        onChange={e => setFilters(f => ({ ...f, date: e.target.value }))}
                        className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                    />

                    {/* Status filter */}
                    <select
                        value={filters.status}
                        onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                        className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all cursor-pointer"
                    >
                        {STATUS_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>

                    {/* Clear */}
                    {(filters.search || filters.date || filters.status) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFilters({ status: '', date: '', search: '' })}
                        >
                            Clear filters
                        </Button>
                    )}
                </div>
            </Card>

            {/* Table */}
            <Card padding={false} className="overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-7 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <span className="col-span-2">Guest</span>
                    <span>Table</span>
                    <span>Branch</span>
                    <span>Date & Time</span>
                    <span>Guests</span>
                    <span>Status</span>
                </div>

                {loading ? (
                    <div className="px-6 py-2">
                        {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <EmptyState
                        title="No reservations found"
                        description="Try adjusting your filters or date range."
                    />
                ) : (
                    <div className="divide-y divide-gray-50">
                        {filtered.map(r => (
                            <div
                                key={r.id}
                                className="grid grid-cols-7 gap-4 px-6 py-3.5 items-center hover:bg-gray-50/70 transition-colors cursor-pointer"
                                onClick={() => openDetail(r)}
                            >
                                {/* Guest */}
                                <div className="col-span-2 flex items-center gap-2.5">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600 text-xs font-bold">
                                        {r.guest_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">{r.guest_name}</p>
                                        <p className="text-xs text-gray-400">{r.phone}</p>
                                    </div>
                                </div>
                                <span className="text-sm font-medium text-gray-700">{r.table_number}</span>
                                <span className="text-sm text-gray-600">{r.branch_name}</span>
                                <div>
                                    <p className="text-sm text-gray-700">{r.reservation_date}</p>
                                    <p className="text-xs text-gray-400">{r.start_time}</p>
                                </div>
                                <span className="text-sm text-gray-700">{r.guest_count} pax</span>
                                <Badge label={capitalize(r.status)} variant={r.status} />
                            </div>
                        ))}
                    </div>
                )}
            </Card>


            {/* ── Detail / Update Modal ── */}
            <Modal open={!!selected} onClose={() => setSelected(null)} title="Reservation Details">
                {selected && (
                    <div className="space-y-5">
                        {/* Guest info */}
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 text-lg font-bold">
                                {selected.guest_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <div>
                                <p className="text-lg font-bold text-gray-900">{selected.guest_name}</p>
                                <p className="text-sm text-gray-400">{selected.phone}</p>
                            </div>
                        </div>

                        {/* Details grid */}
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'Table',  value: selected.table_number },
                                { label: 'Branch', value: selected.branch_name },
                                { label: 'Date',   value: selected.reservation_date },
                                { label: 'Time',   value: selected.start_time },
                                { label: 'Guests', value: `${selected.guest_count} pax` },
                                { label: 'Booking ID', value: `#${selected.id}` },
                            ].map(d => (
                                <div key={d.label} className="rounded-xl bg-gray-50 px-4 py-3">
                                    <p className="text-xs text-gray-400 mb-0.5">{d.label}</p>
                                    <p className="text-sm font-semibold text-gray-800">{d.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Current status */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Current status:</span>
                            <Badge label={capitalize(selected.status)} variant={selected.status} />
                        </div>

                        {/* Update status */}
                        <Select
                            label="Update Status"
                            name="status"
                            value={newStatus}
                            onChange={e => setNewStatus(e.target.value)}
                            options={UPDATE_STATUS_OPTIONS}
                        />

                        <ModalFooter>
                            <Button variant="secondary" onClick={() => setSelected(null)}>Cancel</Button>
                            <Button
                                variant="primary"
                                loading={updating}
                                onClick={handleStatusUpdate}
                                disabled={newStatus === selected.status}
                            >
                                Save Changes
                            </Button>
                        </ModalFooter>
                    </div>
                )}
            </Modal>
        </div>
    )
}


function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : ''
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
