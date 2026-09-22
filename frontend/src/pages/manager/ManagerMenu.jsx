import { useEffect, useState } from 'react'

import {
  createManagerMenuItem,
  deactivateManagerMenuItem,
  getManagerMenuItems,
  getRestaurantManagerProfile,
  updateManagerMenuItem,
} from '../../api/managerApi'
import ManagerLayout from '../../components/manager/ManagerLayout'


const emptyItem = {
  restaurant_id: '', name: '', category: '', description: '',
  price: '', image_url: '', is_available: true,
}


function ManagerMenu() {
  const [profile, setProfile] = useState(null)
  const [items, setItems] = useState([])
  const [form, setForm] = useState(emptyItem)
  const [editingId, setEditingId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    let isCancelled = false

    async function loadInitialData() {
      try {
        const [managerProfile, menuData] = await Promise.all([
          getRestaurantManagerProfile(), getManagerMenuItems(),
        ])
        if (isCancelled) return
        setProfile(managerProfile)
        setItems(menuData)
        setForm((current) => ({ ...current, restaurant_id: current.restaurant_id || String(managerProfile.assigned_restaurants[0]?.id || '') }))
      } catch (error) {
        if (!isCancelled) setMessage({ type: 'error', text: error.message })
      } finally {
        if (!isCancelled) setIsLoading(false)
      }
    }

    loadInitialData()
    return () => { isCancelled = true }
  }, [])

  function changeField(event) {
    const { name, value, type, checked } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  function resetForm() {
    setEditingId(null)
    setForm({ ...emptyItem, restaurant_id: String(profile?.assigned_restaurants[0]?.id || '') })
  }

  function startEditing(item) {
    setEditingId(item.id)
    setForm({
      restaurant_id: String(item.restaurant), name: item.name,
      category: item.category, description: item.description,
      price: item.price, image_url: item.image_url, is_available: item.is_available,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function saveItem(event) {
    event.preventDefault()
    setIsSaving(true)
    setMessage({ type: '', text: '' })
    try {
      const payload = { ...form, restaurant_id: Number(form.restaurant_id) }
      if (editingId) delete payload.restaurant_id
      const saved = editingId
        ? await updateManagerMenuItem(editingId, payload)
        : await createManagerMenuItem(payload)
      setItems((current) => editingId
        ? current.map((item) => item.id === saved.id ? saved : item)
        : [...current, saved])
      setMessage({ type: 'success', text: editingId ? 'Menu item updated.' : 'Menu item created.' })
      resetForm()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setIsSaving(false)
    }
  }

  async function deactivate(item) {
    if (!window.confirm(`Mark ${item.name} unavailable?`)) return
    try {
      await deactivateManagerMenuItem(item.id)
      setItems((current) => current.map((currentItem) => currentItem.id === item.id ? { ...currentItem, is_available: false } : currentItem))
      setMessage({ type: 'success', text: 'Menu item marked unavailable.' })
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  return (
    <ManagerLayout profile={profile}>
      <header className="border-b border-slate-200 bg-white px-6 py-5 sm:px-9"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600">Restaurant management</p><h1 className="mt-1 text-2xl font-bold">Menu</h1></header>
      <main id="manager-main" tabIndex="-1" className="px-6 py-8 sm:px-9">
        <h2 className="text-3xl font-bold text-slate-900">Menu catalogue</h2><p className="mt-2 text-sm text-slate-500">Maintain real menu items for the restaurants assigned to you.</p>
        {message.text && <div role={message.type === 'error' ? 'alert' : 'status'} className={`mt-5 rounded-xl border px-4 py-3 text-sm ${message.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{message.text}</div>}

        <form onSubmit={saveItem} className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between"><h3 className="text-lg font-bold">{editingId ? 'Edit menu item' : 'Add menu item'}</h3>{editingId && <button type="button" onClick={resetForm} className="text-sm font-semibold text-slate-500">Cancel edit</button>}</div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {profile?.assigned_restaurants.length > 1 && !editingId && <label className="text-sm font-semibold">Restaurant<select name="restaurant_id" value={form.restaurant_id} onChange={changeField} required className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal">{profile.assigned_restaurants.map((restaurant) => <option key={restaurant.id} value={restaurant.id}>{restaurant.name}</option>)}</select></label>}
            <label className="text-sm font-semibold">Name<input name="name" value={form.name} onChange={changeField} required className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
            <label className="text-sm font-semibold">Category<input name="category" value={form.category} onChange={changeField} required className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
            <label className="text-sm font-semibold">Price<input name="price" type="number" min="0" step="0.01" value={form.price} onChange={changeField} required className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
            <label className="text-sm font-semibold md:col-span-2">Image URL<input name="image_url" type="url" value={form.image_url} onChange={changeField} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
            <label className="text-sm font-semibold md:col-span-2 xl:col-span-3">Description<textarea name="description" rows="3" value={form.description} onChange={changeField} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
            <label className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold"><input name="is_available" type="checkbox" checked={form.is_available} onChange={changeField} /> Available</label>
          </div>
          <button disabled={isSaving || !form.restaurant_id} className="mt-5 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{isSaving ? 'Saving...' : editingId ? 'Save changes' : 'Create menu item'}</button>
        </form>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {isLoading ? <p className="text-sm text-slate-500">Loading menu...</p> : items.map((item) => <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">{item.image_url ? <img src={item.image_url} alt="" className="h-36 w-full object-cover" /> : <div className="flex h-36 items-center justify-center bg-slate-100 text-4xl font-bold text-slate-300">{item.name.slice(0, 1)}</div>}<div className="p-5"><div className="flex justify-between gap-3"><div><p className="text-xs font-bold uppercase text-orange-600">{item.restaurant_name} · {item.category}</p><h3 className="mt-1 text-lg font-bold">{item.name}</h3></div><span className="font-bold text-slate-900">৳{item.price}</span></div><p className="mt-2 line-clamp-2 text-sm text-slate-500">{item.description || 'No description'}</p><p className={`mt-3 text-xs font-bold ${item.is_available ? 'text-emerald-700' : 'text-slate-400'}`}>{item.is_available ? 'Available' : 'Unavailable'}</p><div className="mt-4 flex gap-2"><button type="button" onClick={() => startEditing(item)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold">Edit</button>{item.is_available && <button type="button" onClick={() => deactivate(item)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">Make unavailable</button>}</div></div></article>)}
        </section>
      </main>
    </ManagerLayout>
  )
}


export default ManagerMenu
