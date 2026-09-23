// =============================================================================
// Menu — Manager portal: manage menu categories and food items
// =============================================================================

import { useEffect, useState } from 'react'
import { Button } from '../components/ui/Button'
import { Card, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Input, Select, Textarea } from '../components/ui/Input'
import { Modal, ModalFooter } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { PageLoader } from '../components/ui/Spinner'
import { useToast } from '../components/ui/Toast'


// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_MENU = [
    {
        id: 1, category: 'Starters',
        items: [
            { id: 101, name: 'Shingara',          price: 20,   description: 'Crispy fried pastry with spiced potato filling', available: true,  image: '🫔' },
            { id: 102, name: 'Jhal Muri',          price: 40,   description: 'Puffed rice mix with mustard oil and spices',   available: true,  image: '🥗' },
            { id: 103, name: 'Vegetable Chop',     price: 35,   description: 'Deep fried vegetable croquettes',               available: false, image: '🥙' },
        ],
    },
    {
        id: 2, category: 'Main Course',
        items: [
            { id: 201, name: 'Kacchi Biryani',     price: 350,  description: 'Slow-cooked mutton biryani with basmati rice', available: true,  image: '🍛' },
            { id: 202, name: 'Beef Bhuna',          price: 280,  description: 'Rich slow-cooked beef curry with spices',      available: true,  image: '🥩' },
            { id: 203, name: 'Hilsa Fish Curry',   price: 420,  description: 'Traditional Ilish mach with mustard sauce',    available: true,  image: '🐟' },
            { id: 204, name: 'Dal Makhani',         price: 180,  description: 'Slow-cooked black lentils with cream',         available: false, image: '🫕' },
        ],
    },
    {
        id: 3, category: 'Desserts',
        items: [
            { id: 301, name: 'Mishti Doi',          price: 80,   description: 'Sweet yogurt from Bogra',                     available: true,  image: '🍮' },
            { id: 302, name: 'Roshogolla',          price: 60,   description: 'Soft cottage cheese balls in sugar syrup',     available: true,  image: '🧁' },
            { id: 303, name: 'Firni',               price: 90,   description: 'Creamy rice pudding with cardamom',            available: true,  image: '🍚' },
        ],
    },
    {
        id: 4, category: 'Beverages',
        items: [
            { id: 401, name: 'Borhani',             price: 50,   description: 'Spiced yogurt drink with mint and cumin',      available: true,  image: '🥛' },
            { id: 402, name: 'Lemon Sharbat',       price: 40,   description: 'Fresh lemon drink with salt & sugar',          available: true,  image: '🍋' },
        ],
    },
]

const CATEGORY_OPTIONS = ['Starters', 'Main Course', 'Desserts', 'Beverages', 'Specials', 'Sides']

const EMPTY_ITEM_FORM = { name: '', price: '', description: '', category: 'Starters', available: 'true', image: '' }


export default function Menu() {
    const { toast } = useToast()

    const [categories, setCategories] = useState([])
    const [loading, setLoading]       = useState(true)
    const [search, setSearch]         = useState('')
    const [expanded, setExpanded]     = useState({})

    // Modal state
    const [modal, setModal]           = useState(null)   // null | 'add' | 'edit' | 'delete'
    const [editItem, setEditItem]     = useState(null)
    const [editCatId, setEditCatId]   = useState(null)
    const [form, setForm]             = useState(EMPTY_ITEM_FORM)
    const [errors, setErrors]         = useState({})
    const [saving, setSaving]         = useState(false)
    const [deleteItem, setDeleteItem] = useState(null)
    const [deleting, setDeleting]     = useState(false)

    useEffect(() => {
        const t = setTimeout(() => {
            setCategories(MOCK_MENU)
            const exp = {}
            MOCK_MENU.forEach(c => { exp[c.id] = true })
            setExpanded(exp)
            setLoading(false)
        }, 700)
        return () => clearTimeout(t)
    }, [])

    // ── Search filter ──
    const filteredCats = categories.map(cat => ({
        ...cat,
        items: cat.items.filter(i =>
            !search || i.name.toLowerCase().includes(search.toLowerCase())
        ),
    })).filter(cat => cat.items.length > 0)

    function toggleCategory(id) {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
    }

    // ── Open add ──
    function openAdd(catId, catName) {
        setForm({ ...EMPTY_ITEM_FORM, category: catName })
        setErrors({})
        setEditItem(null)
        setEditCatId(catId)
        setModal('add')
    }

    // ── Open edit ──
    function openEdit(catId, item) {
        setForm({
            name: item.name,
            price: item.price,
            description: item.description,
            category: categories.find(c => c.id === catId)?.category || '',
            available: String(item.available),
            image: item.image,
        })
        setErrors({})
        setEditItem(item)
        setEditCatId(catId)
        setModal('edit')
    }

    // ── Open delete ──
    function openDelete(catId, item) {
        setDeleteItem({ catId, item })
        setModal('delete')
    }

    // ── Validation ──
    function validate() {
        const e = {}
        if (!form.name.trim()) e.name = 'Item name is required'
        if (!form.price || isNaN(form.price)) e.price = 'Valid price is required'
        if (Number(form.price) < 0) e.price = 'Price cannot be negative'
        return e
    }

    // ── Save ──
    async function handleSave() {
        const errs = validate()
        if (Object.keys(errs).length) { setErrors(errs); return }

        setSaving(true)
        await delay(600)

        const itemData = {
            name: form.name,
            price: Number(form.price),
            description: form.description,
            available: form.available === 'true',
            image: form.image || '🍽',
        }

        setCategories(prev => prev.map(cat => {
            if (cat.id !== editCatId) return cat
            if (editItem) {
                return { ...cat, items: cat.items.map(i => i.id === editItem.id ? { ...i, ...itemData } : i) }
            } else {
                return { ...cat, items: [...cat.items, { id: Date.now(), ...itemData }] }
            }
        }))

        toast.success(editItem ? `"${form.name}" updated` : `"${form.name}" added to menu`)
        setSaving(false)
        setModal(null)
    }

    // ── Delete ──
    async function handleDelete() {
        setDeleting(true)
        await delay(600)
        setCategories(prev => prev.map(cat => {
            if (cat.id !== deleteItem.catId) return cat
            return { ...cat, items: cat.items.filter(i => i.id !== deleteItem.item.id) }
        }))
        toast.success(`"${deleteItem.item.name}" removed from menu`)
        setDeleting(false)
        setModal(null)
        setDeleteItem(null)
    }

    // ── Total counts ──
    const totalItems = categories.reduce((sum, c) => sum + c.items.length, 0)
    const available  = categories.reduce((sum, c) => sum + c.items.filter(i => i.available).length, 0)

    if (loading) return <PageLoader />

    return (
        <div className="space-y-5">

            {/* Header row */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-3">
                    <div className="flex items-center gap-2 rounded-xl bg-gray-100 text-gray-700 px-4 py-2 text-sm font-semibold">
                        <span className="text-base font-bold">{totalItems}</span> Total Items
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-100 text-emerald-700 px-4 py-2 text-sm font-semibold">
                        <span className="text-base font-bold">{available}</span> Available
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-gray-100 text-gray-500 px-4 py-2 text-sm font-semibold">
                        <span className="text-base font-bold">{totalItems - available}</span> Unavailable
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search menu items..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                    />
                </div>
            </div>

            {/* Categories */}
            {filteredCats.length === 0 ? (
                <EmptyState title="No items found" description="Try a different search term." />
            ) : (
                <div className="space-y-4">
                    {filteredCats.map(cat => (
                        <Card key={cat.id} padding={false} className="overflow-hidden">
                            {/* Category header */}
                            <button
                                className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                                onClick={() => toggleCategory(cat.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-base font-bold text-gray-900">{cat.category}</span>
                                    <span className="text-xs bg-orange-100 text-orange-600 font-semibold px-2 py-0.5 rounded-full">
                                        {cat.items.length} items
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={e => { e.stopPropagation(); openAdd(cat.id, cat.category) }}
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                        </svg>
                                        Add item
                                    </Button>
                                    <svg
                                        className={`w-5 h-5 text-gray-400 transition-transform ${expanded[cat.id] ? 'rotate-180' : ''}`}
                                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </button>

                            {/* Items list */}
                            {expanded[cat.id] && (
                                <div className="border-t border-gray-100 divide-y divide-gray-50">
                                    {cat.items.map(item => (
                                        <div key={item.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50/70 transition-colors">
                                            {/* Emoji */}
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-xl">
                                                {item.image}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                                                    {!item.available && (
                                                        <Badge label="Unavailable" variant="inactive" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-400 truncate mt-0.5">{item.description}</p>
                                            </div>

                                            {/* Price */}
                                            <p className="text-sm font-bold text-gray-900 shrink-0">৳{item.price}</p>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    onClick={() => openEdit(cat.id, item)}
                                                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => openDelete(cat.id, item)}
                                                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}

            {/* ── Add / Edit Modal ── */}
            <Modal
                open={modal === 'add' || modal === 'edit'}
                onClose={() => setModal(null)}
                title={modal === 'edit' ? `Edit "${editItem?.name}"` : 'Add Menu Item'}
            >
                <div className="space-y-4">
                    <Input
                        label="Item Name"
                        name="name"
                        value={form.name}
                        onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(er => ({ ...er, name: '' })) }}
                        placeholder="e.g. Kacchi Biryani"
                        error={errors.name}
                        required
                    />
                    <Input
                        label="Price (৳)"
                        name="price"
                        type="number"
                        min={0}
                        value={form.price}
                        onChange={e => { setForm(f => ({ ...f, price: e.target.value })); setErrors(er => ({ ...er, price: '' })) }}
                        placeholder="e.g. 350"
                        error={errors.price}
                        required
                    />
                    <Input
                        label="Emoji / Image"
                        name="image"
                        value={form.image}
                        onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
                        placeholder="e.g. 🍛"
                    />
                    <Textarea
                        label="Description"
                        name="description"
                        value={form.description}
                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="Describe the dish..."
                        rows={3}
                    />
                    <Select
                        label="Availability"
                        name="available"
                        value={form.available}
                        onChange={e => setForm(f => ({ ...f, available: e.target.value }))}
                        options={[
                            { value: 'true',  label: 'Available' },
                            { value: 'false', label: 'Unavailable' },
                        ]}
                    />
                    <ModalFooter>
                        <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
                        <Button variant="primary" loading={saving} onClick={handleSave}>
                            {modal === 'edit' ? 'Save Changes' : 'Add Item'}
                        </Button>
                    </ModalFooter>
                </div>
            </Modal>

            {/* ── Delete Confirm Modal ── */}
            <Modal open={modal === 'delete'} onClose={() => setModal(null)} title="Remove Item" size="sm">
                <div className="text-center space-y-4">
                    <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-red-100 text-2xl">
                        {deleteItem?.item?.image || '🍽'}
                    </div>
                    <div>
                        <p className="text-base font-semibold text-gray-900">
                            Remove "{deleteItem?.item?.name}"?
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            This item will be removed from your menu permanently.
                        </p>
                    </div>
                    <ModalFooter>
                        <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
                        <Button variant="danger" loading={deleting} onClick={handleDelete}>Remove</Button>
                    </ModalFooter>
                </div>
            </Modal>
        </div>
    )
}


function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
