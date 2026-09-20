// =============================================================================
// Tables — Manager portal: floor layout grid with add/edit/delete
// =============================================================================

import { useEffect, useState } from 'react'
import { Button } from '../components/ui/Button'
import { Card, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Input, Select } from '../components/ui/Input'
import { Modal, ModalFooter } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { PageLoader } from '../components/ui/Spinner'
import { useToast } from '../components/ui/Toast'


// ─── Constants ───────────────────────────────────────────────────────────────

const SEATING_OPTIONS = [
    { value: 'INDOOR',   label: 'Indoor' },
    { value: 'OUTDOOR',  label: 'Outdoor' },
    { value: 'WINDOW',   label: 'Window Side' },
    { value: 'PRIVATE',  label: 'Private' },
]

const SEATING_ICONS = {
    INDOOR:  '🏠',
    OUTDOOR: '🌿',
    WINDOW:  '🪟',
    PRIVATE: '🔒',
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_TABLES = [
    { id: 1,  number: 'T-01', capacity: 2, seating: 'INDOOR',  status: 'available' },
    { id: 2,  number: 'T-02', capacity: 4, seating: 'INDOOR',  status: 'occupied' },
    { id: 3,  number: 'T-03', capacity: 4, seating: 'WINDOW',  status: 'available' },
    { id: 4,  number: 'T-04', capacity: 6, seating: 'INDOOR',  status: 'occupied' },
    { id: 5,  number: 'T-05', capacity: 2, seating: 'OUTDOOR', status: 'available' },
    { id: 6,  number: 'T-06', capacity: 8, seating: 'PRIVATE', status: 'available' },
    { id: 7,  number: 'T-07', capacity: 4, seating: 'OUTDOOR', status: 'occupied' },
    { id: 8,  number: 'T-08', capacity: 2, seating: 'WINDOW',  status: 'available' },
    { id: 9,  number: 'T-09', capacity: 6, seating: 'INDOOR',  status: 'available' },
    { id: 10, number: 'T-10', capacity: 4, seating: 'INDOOR',  status: 'occupied' },
]

const EMPTY_FORM = { number: '', capacity: 2, seating: 'INDOOR', status: 'available' }


export default function Tables() {
    const { toast } = useToast()

    const [tables, setTables]   = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter]   = useState('all')   // 'all' | 'available' | 'occupied'

    const [modal, setModal]     = useState(null)     // null | 'add' | 'edit' | 'delete'
    const [editTarget, setEditTarget] = useState(null)
    const [form, setForm]       = useState(EMPTY_FORM)
    const [errors, setErrors]   = useState({})
    const [saving, setSaving]   = useState(false)
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        const t = setTimeout(() => {
            setTables(MOCK_TABLES)
            setLoading(false)
        }, 700)
        return () => clearTimeout(t)
    }, [])

    // ── Filtered view ──
    const displayed = tables.filter(t =>
        filter === 'all' ? true : t.status === filter
    )

    // ── Open add modal ──
    function openAdd() {
        setForm(EMPTY_FORM)
        setErrors({})
        setEditTarget(null)
        setModal('add')
    }

    // ── Open edit modal ──
    function openEdit(table) {
        setForm({ number: table.number, capacity: table.capacity, seating: table.seating, status: table.status })
        setErrors({})
        setEditTarget(table)
        setModal('edit')
    }

    // ── Open delete confirm ──
    function openDelete(table) {
        setDeleteTarget(table)
        setModal('delete')
    }

    // ── Form validation ──
    function validate() {
        const e = {}
        if (!form.number.trim()) e.number = 'Table number is required'
        if (!form.capacity || form.capacity < 1) e.capacity = 'Capacity must be at least 1'
        if (form.capacity > 20) e.capacity = 'Capacity cannot exceed 20'
        return e
    }

    // ── Save (add or edit) ──
    async function handleSave() {
        const errs = validate()
        if (Object.keys(errs).length) { setErrors(errs); return }

        setSaving(true)
        await delay(600)

        if (editTarget) {
            setTables(prev => prev.map(t => t.id === editTarget.id ? { ...t, ...form } : t))
            toast.success(`Table ${form.number} updated successfully`)
        } else {
            const newTable = { id: Date.now(), ...form, capacity: Number(form.capacity) }
            setTables(prev => [...prev, newTable])
            toast.success(`Table ${form.number} added successfully`)
        }

        setSaving(false)
        setModal(null)
    }

    // ── Delete ──
    async function handleDelete() {
        setDeleting(true)
        await delay(600)
        setTables(prev => prev.filter(t => t.id !== deleteTarget.id))
        toast.success(`Table ${deleteTarget.number} deleted`)
        setDeleting(false)
        setModal(null)
        setDeleteTarget(null)
    }

    // ── Counts ──
    const available = tables.filter(t => t.status === 'available').length
    const occupied  = tables.filter(t => t.status === 'occupied').length

    if (loading) return <PageLoader />

    return (
        <div className="space-y-5">

            {/* Header row */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Summary chips */}
                <div className="flex gap-3">
                    {[
                        { label: 'All Tables',  value: tables.length,  key: 'all',       cls: 'bg-gray-100 text-gray-700' },
                        { label: 'Available',   value: available,      key: 'available',  cls: 'bg-emerald-100 text-emerald-700' },
                        { label: 'Occupied',    value: occupied,       key: 'occupied',   cls: 'bg-orange-100 text-orange-700' },
                    ].map(s => (
                        <button
                            key={s.key}
                            onClick={() => setFilter(s.key)}
                            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all
                                ${filter === s.key ? `${s.cls} ring-2 ring-offset-1 ring-current` : s.cls}`}
                        >
                            <span className="text-base font-bold">{s.value}</span>
                            {s.label}
                        </button>
                    ))}
                </div>

                <Button variant="primary" onClick={openAdd}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Table
                </Button>
            </div>

            {/* Floor grid */}
            {displayed.length === 0 ? (
                <EmptyState
                    title="No tables found"
                    description="Add your first table to start managing your floor."
                    action={<Button variant="primary" onClick={openAdd}>Add Table</Button>}
                />
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {displayed.map(table => (
                        <TableCard
                            key={table.id}
                            table={table}
                            onEdit={() => openEdit(table)}
                            onDelete={() => openDelete(table)}
                        />
                    ))}
                </div>
            )}


            {/* ── Add / Edit Modal ── */}
            <Modal
                open={modal === 'add' || modal === 'edit'}
                onClose={() => setModal(null)}
                title={modal === 'edit' ? `Edit ${editTarget?.number}` : 'Add New Table'}
            >
                <div className="space-y-4">
                    <Input
                        label="Table Number"
                        name="number"
                        value={form.number}
                        onChange={e => { setForm(f => ({ ...f, number: e.target.value })); setErrors(er => ({ ...er, number: '' })) }}
                        placeholder="e.g. T-11"
                        error={errors.number}
                        required
                    />
                    <Input
                        label="Capacity (seats)"
                        name="capacity"
                        type="number"
                        min={1}
                        max={20}
                        value={form.capacity}
                        onChange={e => { setForm(f => ({ ...f, capacity: e.target.value })); setErrors(er => ({ ...er, capacity: '' })) }}
                        error={errors.capacity}
                        required
                    />
                    <Select
                        label="Seating Type"
                        name="seating"
                        value={form.seating}
                        onChange={e => setForm(f => ({ ...f, seating: e.target.value }))}
                        options={SEATING_OPTIONS}
                    />
                    <Select
                        label="Status"
                        name="status"
                        value={form.status}
                        onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                        options={[
                            { value: 'available', label: 'Available' },
                            { value: 'occupied',  label: 'Occupied' },
                        ]}
                    />
                    <ModalFooter>
                        <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
                        <Button variant="primary" loading={saving} onClick={handleSave}>
                            {modal === 'edit' ? 'Save Changes' : 'Add Table'}
                        </Button>
                    </ModalFooter>
                </div>
            </Modal>

            {/* ── Delete Confirm Modal ── */}
            <Modal open={modal === 'delete'} onClose={() => setModal(null)} title="Delete Table" size="sm">
                <div className="text-center space-y-4">
                    <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-red-100">
                        <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-base font-semibold text-gray-900">Delete {deleteTarget?.number}?</p>
                        <p className="text-sm text-gray-500 mt-1">
                            This action cannot be undone. All reservation data for this table may be affected.
                        </p>
                    </div>
                    <ModalFooter>
                        <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
                        <Button variant="danger" loading={deleting} onClick={handleDelete}>Delete</Button>
                    </ModalFooter>
                </div>
            </Modal>
        </div>
    )
}


// ─── Table Card ───────────────────────────────────────────────────────────────

function TableCard({ table, onEdit, onDelete }) {
    const isOccupied = table.status === 'occupied'
    return (
        <div className={`relative rounded-2xl border-2 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md
            ${isOccupied ? 'border-orange-200 bg-orange-50' : 'border-emerald-200 bg-emerald-50'}`}
        >
            {/* Seating icon */}
            <div className="text-2xl mb-2">{SEATING_ICONS[table.seating] || '🪑'}</div>

            <p className="font-bold text-gray-900 text-base">{table.number}</p>
            <p className="text-xs text-gray-500 mt-0.5">{table.seating} · {table.capacity} seats</p>

            <div className="mt-3">
                <Badge label={capitalize(table.status)} variant={table.status} />
            </div>

            {/* Actions */}
            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            </div>

            <div className="mt-3 flex gap-2">
                <button
                    onClick={onEdit}
                    className="flex-1 rounded-lg bg-white border border-gray-200 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                    Edit
                </button>
                <button
                    onClick={onDelete}
                    className="flex-1 rounded-lg bg-white border border-red-200 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                >
                    Delete
                </button>
            </div>
        </div>
    )
}


function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : ''
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
