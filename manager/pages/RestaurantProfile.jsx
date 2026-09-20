// =============================================================================
// RestaurantProfile — Manager portal: edit restaurant info & opening hours
// =============================================================================

import { useEffect, useState } from 'react'
import { Button } from '../components/ui/Button'
import { Card, CardHeader } from '../components/ui/Card'
import { Input, Select, Textarea } from '../components/ui/Input'
import { PageLoader } from '../components/ui/Spinner'
import { useToast } from '../components/ui/Toast'


// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_PROFILE = {
    name: 'Sultan\'s Dine',
    tagline: 'Authentic Bangladeshi Fine Dining',
    description: 'Sultan\'s Dine is a premium Bangladeshi restaurant offering authentic flavors and a luxurious dining experience. Our chefs bring decades of culinary expertise to create dishes that celebrate the rich heritage of Bangladeshi cuisine.',
    cuisine: 'Bangladeshi, Mughal',
    email: 'contact@sultansdine.com',
    phone: '+8801700000000',
    website: 'https://sultansdine.com',
    category: 'Fine Dining',
    cover_emoji: '🏰',
    min_price: 250,
    max_price: 800,
}

const MOCK_HOURS = {
    Monday:    { open: '12:00', close: '22:00', closed: false },
    Tuesday:   { open: '12:00', close: '22:00', closed: false },
    Wednesday: { open: '12:00', close: '22:00', closed: false },
    Thursday:  { open: '12:00', close: '23:00', closed: false },
    Friday:    { open: '13:00', close: '23:00', closed: false },
    Saturday:  { open: '12:00', close: '23:30', closed: false },
    Sunday:    { open: '12:00', close: '21:00', closed: true },
}

const CATEGORY_OPTIONS = [
    { value: 'Fine Dining',  label: 'Fine Dining' },
    { value: 'Casual',       label: 'Casual' },
    { value: 'Fast Food',    label: 'Fast Food' },
    { value: 'Cafe',         label: 'Café' },
    { value: 'Buffet',       label: 'Buffet' },
    { value: 'Rooftop',      label: 'Rooftop' },
]

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']


export default function RestaurantProfile() {
    const { toast } = useToast()

    const [loading, setLoading]   = useState(true)
    const [profile, setProfile]   = useState(null)
    const [hours, setHours]       = useState(null)
    const [errors, setErrors]     = useState({})
    const [saving, setSaving]     = useState(false)
    const [savingHours, setSavingHours] = useState(false)
    const [activeTab, setActiveTab] = useState('info')   // 'info' | 'hours'

    useEffect(() => {
        const t = setTimeout(() => {
            setProfile(MOCK_PROFILE)
            setHours(MOCK_HOURS)
            setLoading(false)
        }, 700)
        return () => clearTimeout(t)
    }, [])

    // ── Profile field change ──
    function handleChange(e) {
        const { name, value } = e.target
        setProfile(prev => ({ ...prev, [name]: value }))
        if (errors[name]) setErrors(er => ({ ...er, [name]: '' }))
    }

    // ── Validation ──
    function validate() {
        const e = {}
        if (!profile.name?.trim()) e.name = 'Restaurant name is required'
        if (!profile.email?.trim()) e.email = 'Email is required'
        else if (!/\S+@\S+\.\S+/.test(profile.email)) e.email = 'Enter a valid email'
        if (!profile.phone?.trim()) e.phone = 'Phone number is required'
        if (Number(profile.min_price) > Number(profile.max_price)) e.max_price = 'Max price must be greater than min price'
        return e
    }

    // ── Save profile ──
    async function handleSaveProfile(e) {
        e.preventDefault()
        const errs = validate()
        if (Object.keys(errs).length) { setErrors(errs); return }

        setSaving(true)
        await delay(800)
        toast.success('Restaurant profile updated successfully')
        setSaving(false)
    }

    // ── Hours change ──
    function handleHourChange(day, field, value) {
        setHours(prev => ({
            ...prev,
            [day]: { ...prev[day], [field]: value },
        }))
    }

    // ── Save hours ──
    async function handleSaveHours(e) {
        e.preventDefault()
        setSavingHours(true)
        await delay(800)
        toast.success('Opening hours updated successfully')
        setSavingHours(false)
    }

    if (loading) return <PageLoader />

    return (
        <div className="space-y-5 max-w-3xl">

            {/* Cover banner */}
            <Card className="relative overflow-hidden !p-0">
                <div className="h-32 bg-gradient-to-r from-[#1a1a2e] to-[#2d1b5e] flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-6xl mb-2">{profile.cover_emoji}</div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
                <div className="px-6 py-4">
                    <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
                    <p className="text-sm text-gray-500">{profile.tagline}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                        <span className="text-xs bg-orange-100 text-orange-600 font-semibold px-2 py-0.5 rounded-full">{profile.category}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{profile.cuisine}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">৳{profile.min_price} – ৳{profile.max_price}</span>
                    </div>
                </div>
            </Card>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
                {[
                    { key: 'info',  label: 'Restaurant Info' },
                    { key: 'hours', label: 'Opening Hours' },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all
                            ${activeTab === tab.key
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Tab: Info ── */}
            {activeTab === 'info' && (
                <Card>
                    <CardHeader title="Restaurant Information" subtitle="Update your public profile details" />
                    <form onSubmit={handleSaveProfile} noValidate className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                                label="Restaurant Name"
                                name="name"
                                value={profile.name}
                                onChange={handleChange}
                                error={errors.name}
                                required
                            />
                            <Input
                                label="Tagline"
                                name="tagline"
                                value={profile.tagline}
                                onChange={handleChange}
                                placeholder="e.g. Authentic Fine Dining"
                            />
                        </div>

                        <Textarea
                            label="Description"
                            name="description"
                            value={profile.description}
                            onChange={handleChange}
                            placeholder="Tell guests about your restaurant..."
                            rows={4}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                                label="Cuisine Types"
                                name="cuisine"
                                value={profile.cuisine}
                                onChange={handleChange}
                                placeholder="e.g. Bangladeshi, Mughal"
                            />
                            <Select
                                label="Category"
                                name="category"
                                value={profile.category}
                                onChange={handleChange}
                                options={CATEGORY_OPTIONS}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                                label="Contact Email"
                                name="email"
                                type="email"
                                value={profile.email}
                                onChange={handleChange}
                                error={errors.email}
                                required
                            />
                            <Input
                                label="Phone Number"
                                name="phone"
                                type="tel"
                                value={profile.phone}
                                onChange={handleChange}
                                error={errors.phone}
                                required
                            />
                        </div>

                        <Input
                            label="Website"
                            name="website"
                            type="url"
                            value={profile.website}
                            onChange={handleChange}
                            placeholder="https://yourrestaurant.com"
                        />

                        {/* Price range */}
                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Price Range (৳)</p>
                            <div className="flex items-center gap-3">
                                <Input
                                    name="min_price"
                                    type="number"
                                    value={profile.min_price}
                                    onChange={handleChange}
                                    placeholder="Min"
                                    className="flex-1"
                                />
                                <span className="text-gray-400">—</span>
                                <Input
                                    name="max_price"
                                    type="number"
                                    value={profile.max_price}
                                    onChange={handleChange}
                                    placeholder="Max"
                                    error={errors.max_price}
                                    className="flex-1"
                                />
                            </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                            <Button type="submit" variant="primary" loading={saving}>
                                Save Profile
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            {/* ── Tab: Opening Hours ── */}
            {activeTab === 'hours' && (
                <Card>
                    <CardHeader title="Opening Hours" subtitle="Set your weekly schedule" />
                    <form onSubmit={handleSaveHours}>
                        <div className="divide-y divide-gray-50">
                            {DAYS.map(day => (
                                <div key={day} className="flex items-center gap-4 py-3.5">
                                    {/* Day name */}
                                    <span className="w-28 text-sm font-medium text-gray-700">{day}</span>

                                    {/* Closed toggle */}
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <div
                                            className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer
                                                ${hours[day].closed ? 'bg-gray-300' : 'bg-orange-500'}`}
                                            onClick={() => handleHourChange(day, 'closed', !hours[day].closed)}
                                        >
                                            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform
                                                ${hours[day].closed ? 'translate-x-0' : 'translate-x-5'}`}
                                            />
                                        </div>
                                        <span className="text-xs text-gray-500">{hours[day].closed ? 'Closed' : 'Open'}</span>
                                    </label>

                                    {/* Time pickers */}
                                    {!hours[day].closed ? (
                                        <div className="flex items-center gap-2 flex-1">
                                            <input
                                                type="time"
                                                value={hours[day].open}
                                                onChange={e => handleHourChange(day, 'open', e.target.value)}
                                                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                                            />
                                            <span className="text-gray-400 text-sm">to</span>
                                            <input
                                                type="time"
                                                value={hours[day].close}
                                                onChange={e => handleHourChange(day, 'close', e.target.value)}
                                                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                                            />
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-400 flex-1">Closed all day</p>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button type="submit" variant="primary" loading={savingHours}>
                                Save Hours
                            </Button>
                        </div>
                    </form>
                </Card>
            )}
        </div>
    )
}


function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
