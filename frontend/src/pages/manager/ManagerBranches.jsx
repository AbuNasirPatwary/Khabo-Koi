import { useEffect, useState } from 'react'

import {
  createManagerBranch,
  deactivateManagerBranch,
  getManagerBranches,
  getRestaurantManagerProfile,
  updateManagerBranch,
} from '../../api/managerApi'
import ManagerLayout from '../../components/manager/ManagerLayout'


const emptyBranch = {
  restaurant_id: '', name: '', address: '', phone: '',
  opening_time: '09:00', closing_time: '22:00', is_active: true,
}


function ManagerBranches() {
  const [profile, setProfile] = useState(null)
  const [branches, setBranches] = useState([])
  const [form, setForm] = useState(emptyBranch)
  const [editingId, setEditingId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    let isCancelled = false

    async function loadInitialData() {
      try {
        const [managerProfile, branchData] = await Promise.all([
          getRestaurantManagerProfile(), getManagerBranches(),
        ])
        if (isCancelled) return
        setProfile(managerProfile)
        setBranches(branchData)
        setForm((current) => ({
          ...current,
          restaurant_id: current.restaurant_id || String(managerProfile.assigned_restaurants[0]?.id || ''),
        }))
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
    setForm({ ...emptyBranch, restaurant_id: String(profile?.assigned_restaurants[0]?.id || '') })
  }

  function startEditing(branch) {
    setEditingId(branch.id)
    setForm({
      restaurant_id: String(branch.restaurant), name: branch.name,
      address: branch.address, phone: branch.phone,
      opening_time: branch.opening_time.slice(0, 5),
      closing_time: branch.closing_time.slice(0, 5), is_active: branch.is_active,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function saveBranch(event) {
    event.preventDefault()
    setIsSaving(true)
    setMessage({ type: '', text: '' })
    try {
      const payload = { ...form, restaurant_id: Number(form.restaurant_id) }
      if (editingId) {
        delete payload.restaurant_id
      }
      const saved = editingId
        ? await updateManagerBranch(editingId, payload)
        : await createManagerBranch(payload)
      setBranches((current) => editingId
        ? current.map((branch) => branch.id === saved.id ? saved : branch)
        : [...current, saved])
      setMessage({ type: 'success', text: editingId ? 'Branch updated.' : 'Branch created.' })
      resetForm()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setIsSaving(false)
    }
  }

  async function deactivate(branch) {
    if (!window.confirm(`Deactivate ${branch.name}? Existing records will be kept.`)) return
    try {
      await deactivateManagerBranch(branch.id)
      setBranches((current) => current.map((item) => item.id === branch.id ? { ...item, is_active: false } : item))
      setMessage({ type: 'success', text: 'Branch deactivated.' })
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  return (
    <ManagerLayout profile={profile}>
      <header className="border-b border-slate-200 bg-white px-6 py-5 sm:px-9"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600">Restaurant management</p><h1 className="mt-1 text-2xl font-bold">Branches</h1></header>
      <main id="manager-main" tabIndex="-1" className="px-6 py-8 sm:px-9">
        <h2 className="text-3xl font-bold text-slate-900">Branch locations</h2>
        <p className="mt-2 text-sm text-slate-500">Create, update, and safely deactivate locations belonging to your assigned restaurants.</p>
        {message.text && <div role={message.type === 'error' ? 'alert' : 'status'} className={`mt-5 rounded-xl border px-4 py-3 text-sm ${message.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{message.text}</div>}

        <form onSubmit={saveBranch} className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between"><h3 className="text-lg font-bold">{editingId ? 'Edit branch' : 'Add a branch'}</h3>{editingId && <button type="button" onClick={resetForm} className="text-sm font-semibold text-slate-500">Cancel edit</button>}</div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {profile?.assigned_restaurants.length > 1 && !editingId && <label className="text-sm font-semibold text-slate-700">Restaurant<select name="restaurant_id" value={form.restaurant_id} onChange={changeField} required className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal">{profile.assigned_restaurants.map((restaurant) => <option key={restaurant.id} value={restaurant.id}>{restaurant.name}</option>)}</select></label>}
            <label className="text-sm font-semibold text-slate-700">Name<input name="name" value={form.name} onChange={changeField} required className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
            <label className="text-sm font-semibold text-slate-700">Phone<input name="phone" value={form.phone} onChange={changeField} required className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
            <label className="text-sm font-semibold text-slate-700 md:col-span-2">Address<input name="address" value={form.address} onChange={changeField} required className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
            <label className="text-sm font-semibold text-slate-700">Opening time<input name="opening_time" type="time" value={form.opening_time} onChange={changeField} required className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
            <label className="text-sm font-semibold text-slate-700">Closing time<input name="closing_time" type="time" value={form.closing_time} onChange={changeField} required className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
            <label className="flex items-center gap-2 self-end rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold"><input name="is_active" type="checkbox" checked={form.is_active} onChange={changeField} /> Active</label>
          </div>
          <button disabled={isSaving || !form.restaurant_id} className="mt-5 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{isSaving ? 'Saving...' : editingId ? 'Save changes' : 'Create branch'}</button>
        </form>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          {isLoading ? <p className="text-sm text-slate-500">Loading branches...</p> : branches.map((branch) => <article key={branch.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex justify-between gap-4"><div><p className="text-xs font-bold uppercase text-orange-600">{branch.restaurant_name}</p><h3 className="mt-1 text-lg font-bold">{branch.name}</h3><p className="mt-2 text-sm text-slate-500">{branch.address}</p><p className="mt-1 text-sm text-slate-500">{branch.phone} · {branch.opening_time.slice(0, 5)}–{branch.closing_time.slice(0, 5)}</p></div><span className={`h-fit rounded-full px-2.5 py-1 text-xs font-bold ${branch.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{branch.is_active ? 'Active' : 'Inactive'}</span></div><div className="mt-5 flex gap-2"><button type="button" onClick={() => startEditing(branch)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold">Edit</button>{branch.is_active && <button type="button" onClick={() => deactivate(branch)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">Deactivate</button>}</div></article>)}
        </section>
      </main>
    </ManagerLayout>
  )
}


export default ManagerBranches
