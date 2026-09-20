// =============================================================================
// Branches — Manager portal: manage restaurant branch locations
// =============================================================================

import { useEffect, useState } from 'react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Input, Select, Textarea } from '../components/ui/Input'
import { Modal, ModalFooter } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { PageLoader } from '../components/ui/Spinner'
import { useToast } from '../components/ui/Toast'


// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_BRANCHES = [
    {
        id: 1,
        name: 'Gulshan Branch',
        address: 'House 12, Road 45, Gulshan-2, Dhaka-1212',
        city: 'Dhaka',
        phone: '+880 1700-000001',
        email: 'gulshan@sultansdine.com',
        manager: 'Rashid Ahmed',
        seats: 80,
        status: 'active',
        emoji: '🏙',
        tables: 20,
    },
    {
        id: 2,
        name: 'Dhanmondi Branch',
        address: 'Plot 5A, Road 27, Dhanmondi, Dhaka-1209',
        city: 'Dhaka',
        phone: '+880 1700-000002',
        email: 'dhanmondi@sultansdine.com',
        manager: 'Kamal Hossain',
        seats: 60,
        status: 'active',
        emoji: '🌆',
        tables: 15,
    },
    {
        id: 3,
        name: 'Uttara Branch',
        address: 'Sector 7, Road 13, Uttara, Dhaka-1230',
        city: 'Dhaka',
        phone: '+880 1700-000003',
        email: 'uttara@sultansdine.com',
        manager: 'Salma Begum',
        seats: 50,
        status: 'inactive',
        emoji: '🏘',
        tables: 12,
    },
]

const EMPTY_FORM = {
    name: '', address: '', city: 'Dhaka', phone: '', email: '', manager: '', seats: '', status: 'active', emoji: '🏠',
}


export default function Branches() {
    const { toast } = useToast()

    const [branches, setBranches] = useState([])
    const [loading, setLoading]   = useState(true)

    const [modal, setModal]       = useState(null)   // null | 'add' | 'edit' | 'delete' | 'view'
    const [selected, setSelected] = useState(null)
    const [form, setForm]         = useState(EMPTY_FORM)
    const [errors, setErrors]     = useState({})
    const [saving, setSaving]     = useState(false)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        const t = setTimeout(() => {
            setBranches(MOCK_BRANCHES)
            setLoading(false)
        }, 700)
        return () => clearTimeout(t)
    }, [])

    // ── Open modals ──
    function openAdd() {
        setForm(EMPTY_FORM)
        setErrors({})
        setSelected(null)
        setModal('add')
    }

    function openEdit(branch) {
        setForm({
            name: branch.name, address: branch.address, city: branch.city,
            phone: branch.phone, email: branch.email, manager: branch.manager,
            seats: branch.seats, status: branch.status, emoji: branch.emoji,
        })
        setErrors({})
        setSelected(branch)
        setModal('edit')
    }

    function openDelete(branch) {
        setSelected(branch)
        setModal('delete')
    }

    function openView(branch) {
        setSelected(branch)
        setModal('view')
    }

    // ── Form change ──
    function handleChange(e) {
        const { name, value } = e.target
        setForm(f => ({ ...f, [name]: value }))
        if (errors[name]) setErrors(er => ({ ...er, [name]: '' }))
    }

    // ── Validation ──
    function validate() {
        const e = {}
        if (!form.name.trim()) e.name = 'Branch name is required'
        if (!form.address.trim()) e.address = 'Address is required'
        if (!form.phone.trim()) e.phone = 'Phone is required'
        if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
        if (!form.seats || isNaN(form.seats) || Number(form.seats) < 1) e.seats = 'Valid seat count required'
        return e
    }

    // ── Save ──
    async function handleSave() {
        const errs = validate()
        if (Object.keys(errs).length) { setErrors(errs); return }

        setSaving(true)
        await delay(700)

        const branchData = { ...form, seats: Number(form.seats), tables: Math.floor(Number(form.seats) / 4) }

        if (selected && modal === 'edit') {
            setBranches(prev => prev.map(b => b.id === selected.id ? { ...b, ...branchData } : b))
            toast.success(`${form.name} updated successfully`)
        } else {
            setBranches(prev => [...prev, { id: Date.now(), ...branchData }])
            toast.success(`${form.name} added successfully`)
        }

        setSaving(false)
        setModal(null)
    }

    // ── Delete ──
    async function handleDelete() {
        setDeleting(true)
        await delay(700)
        setBranches(prev => prev.filter(b => b.id !== selected.id))
        toast.success(`${selected.name} deleted`)
        setDeleting(false)
        setModal(null)
        setSelected(null)
    }

    const activeCount   = branches.filter(b => b.status === 'active').length
    const inactiveCount = branches.filter(b => b.status === 'inactive').length

    if (loading) return <PageLoader />

    return (
        <div className="space-y-5">

            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-3">
                    <div className="flex items-center gap-2 rounded-xl bg-gray-100 text-gray-700 px-4 py-2 text-sm font-semibold">
                        <span className="font-bold">{branches.length}</span> Branches
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-100 text-emerald-700 px-4 py-2 text-sm font-semibold">
                        <span className="font-bold">{activeCount}</span> Active
                    </div>
                    {inactiveCount > 0 && (
                        <div className="flex items-center gap-2 rounded-xl bg-gray-100 text-gray-400 px-4 py-2 text-sm font-semibold">
                            <span className="font-bold">{inactiveCount}</span> Inactive
                        </div>
                    )}
                </div>

                <Button variant="primary" onClick={openAdd}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Branch
                </Button>
            </div>

            {/* Branch cards grid */}
            {branches.length === 0 ? (
                <EmptyState
                    title="No branches yet"
                    description="Add your first branch location to get started."
                    action={<Button variant="primary" onClick={openAdd}>Add Branch</Button>}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {branches.map(branch => (
                        <BranchCard
                            key={branch.id}
                            branch={branch}
                            onView={() => openView(branch)}
                            onEdit={() => openEdit(branch)}
                            onDelete={() => openDelete(branch)}
                        />
                    ))}
                </div>
            )}


            {/* ── View Modal ── */}
            <Modal open={modal === 'view'} onClose={() => setModal(null)} title={selected?.name}>
                {selected && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-3xl">
                                {selected.emoji}
                            </div>
                            <div>
                                <p className="text-lg font-bold text-gray-900">{selected.name}</p>
                                <Badge label={capitalize(selected.status)} variant={selected.status} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'City',     value: selected.city },
                                { label: 'Seats',    value: selected.seats },
                                { label: 'Tables',   value: selected.tables },
                                { label: 'Manager',  value: selected.manager || '—' },
                                { label: 'Phone',    value: selected.phone },
                                { label: 'Email',    value: selected.email },
                            ].map(d => (
                                <div key={d.label} className="rounded-xl bg-gray-50 px-4 py-3">
                                    <p className="text-xs text-gray-400 mb-0.5">{d.label}</p>
                                    <p className="text-sm font-semibold text-gray-800">{d.value}</p>
                                </div>
                            ))}
                        </div>

                        <div className="rounded-xl bg-gray-50 px-4 py-3">
                            <p className="text-xs text-gray-400 mb-0.5">Address</p>
                            <p className="text-sm font-semibold text-gray-800">{selected.address}</p>
                        </div>

                        <ModalFooter>
                            <Button variant="secondary" onClick={() => setModal(null)}>Close</Button>
                            <Button variant="primary" onClick={() => openEdit(selected)}>Edit Branch</Button>
                        </ModalFooter>
                    </div>
                )}
            </Modal>

            {/* ── Add / Edit Modal ── */}
            <Modal
                open={modal === 'add' || modal === 'edit'}
                onClose={() => setModal(null)}
                title={modal === 'edit' ? `Edit ${selected?.name}` : 'Add New Branch'}
                size="lg"
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Branch Name"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="e.g. Gulshan Branch"
                            error={errors.name}
                            required
                            className="col-span-2 sm:col-span-1"
                        />
                        <Input
                            label="Emoji"
                            name="emoji"
                            value={form.emoji}
                            onChange={handleChange}
                            placeholder="🏠"
                        />
                    </div>

                    <Textarea
                        label="Address"
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        placeholder="Full street address..."
                        rows={2}
                        error={errors.address}
                        required
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input label="City" name="city" value={form.city} onChange={handleChange} placeholder="Dhaka" />
                        <Input
                            label="Total Seats"
                            name="seats"
                            type="number"
                            min={1}
                            value={form.seats}
                            onChange={handleChange}
                            error={errors.seats}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Phone"
                            name="phone"
                            type="tel"
                            value={form.phone}
                            onChange={handleChange}
                            error={errors.phone}
                            required
                        />
                        <Input
                            label="Email"
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            error={errors.email}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Branch Manager"
                            name="manager"
                            value={form.manager}
                            onChange={handleChange}
                            placeholder="Manager name"
                        />
                        <Select
                            label="Status"
                            name="status"
                            value={form.status}
                            onChange={handleChange}
                            options={[
                                { value: 'active',   label: 'Active' },
                                { value: 'inactive', label: 'Inactive' },
                            ]}
                        />
                    </div>

                    <ModalFooter>
                        <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
                        <Button variant="primary" loading={saving} onClick={handleSave}>
                            {modal === 'edit' ? 'Save Changes' : 'Add Branch'}
                        </Button>
                    </ModalFooter>
                </div>
            </Modal>

            {/* ── Delete Confirm Modal ── */}
            <Modal open={modal === 'delete'} onClose={() => setModal(null)} title="Delete Branch" size="sm">
                <div className="text-center space-y-4">
                    <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-red-100 text-2xl">
                        {selected?.emoji || '📍'}
                    </div>
                    <div>
                        <p className="text-base font-semibold text-gray-900">Delete {selected?.name}?</p>
                        <p className="text-sm text-gray-500 mt-1">
                            This will permanently remove this branch. All associated data may be affected.
                        </p>
                    </div>
                    <ModalFooter>
                        <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
                        <Button variant="danger" loading={deleting} onClick={handleDelete}>Delete Branch</Button>
                    </ModalFooter>
                </div>
            </Modal>
        </div>
    )
}


// ─── Branch Card ──────────────────────────────────────────────────────────────

function BranchCard({ branch, onView, onEdit, onDelete }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
            {/* Top color strip */}
            <div className={`h-1.5 w-full ${branch.status === 'active' ? 'bg-emerald-400' : 'bg-gray-300'}`} />

            <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-2xl">
                            {branch.emoji}
                        </div>
                        <div>
                            <p className="text-base font-bold text-gray-900">{branch.name}</p>
                            <p className="text-xs text-gray-400">{branch.city}</p>
                        </div>
                    </div>
                    <Badge label={capitalize(branch.status)} variant={branch.status} />
                </div>

                {/* Address */}
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{branch.address}</p>

                {/* Stats */}
                <div className="flex gap-4 py-2.5 border-t border-b border-gray-50 mb-3">
                    <div className="text-center flex-1">
                        <p className="text-sm font-bold text-gray-900">{branch.tables}</p>
                        <p className="text-xs text-gray-400">Tables</p>
                    </div>
                    <div className="text-center flex-1">
                        <p className="text-sm font-bold text-gray-900">{branch.seats}</p>
                        <p className="text-xs text-gray-400">Seats</p>
                    </div>
                    <div className="text-center flex-1">
                        <p className="text-xs font-semibold text-gray-700 truncate">{branch.manager || '—'}</p>
                        <p className="text-xs text-gray-400">Manager</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <button
                        onClick={onView}
                        className="flex-1 rounded-lg bg-gray-50 border border-gray-200 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        View
                    </button>
                    <button
                        onClick={onEdit}
                        className="flex-1 rounded-lg bg-orange-50 border border-orange-200 py-1.5 text-xs font-medium text-orange-600 hover:bg-orange-100 transition-colors"
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
        </div>
    )
}


function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : ''
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
