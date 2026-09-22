import { useEffect, useState } from 'react'

import {
  createManagerTable,
  deactivateManagerTable,
  getManagerBranches,
  getManagerTables,
  getRestaurantManagerProfile,
  updateManagerTable,
} from '../../api/managerApi'
import ManagerLayout from '../../components/manager/ManagerLayout'


const emptyTable = {
  branch_id: '', table_number: '', capacity: '2',
  seating_type: 'INDOOR', is_active: true,
}


function ManagerTables() {
  const [profile, setProfile] = useState(null)
  const [branches, setBranches] = useState([])
  const [tables, setTables] = useState([])
  const [form, setForm] = useState(emptyTable)
  const [editingId, setEditingId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    let isCancelled = false

    async function loadInitialData() {
      try {
        const [managerProfile, branchData, tableData] = await Promise.all([
          getRestaurantManagerProfile(), getManagerBranches(), getManagerTables(),
        ])
        if (isCancelled) return
        setProfile(managerProfile)
        setBranches(branchData)
        setTables(tableData)
        setForm((current) => ({ ...current, branch_id: current.branch_id || String(branchData.find((branch) => branch.is_active)?.id || '') }))
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
    setForm({ ...emptyTable, branch_id: String(branches.find((branch) => branch.is_active)?.id || '') })
  }

  function startEditing(table) {
    setEditingId(table.id)
    setForm({
      branch_id: String(table.branch), table_number: table.table_number,
      capacity: String(table.capacity), seating_type: table.seating_type,
      is_active: table.is_active,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function saveTable(event) {
    event.preventDefault()
    setIsSaving(true)
    setMessage({ type: '', text: '' })
    try {
      const payload = {
        ...form,
        branch_id: Number(form.branch_id),
        capacity: Number(form.capacity),
      }
      if (editingId) delete payload.branch_id
      const saved = editingId
        ? await updateManagerTable(editingId, payload)
        : await createManagerTable(payload)
      setTables((current) => editingId
        ? current.map((table) => table.id === saved.id ? saved : table)
        : [...current, saved])
      setMessage({ type: 'success', text: editingId ? 'Table updated.' : 'Table created.' })
      resetForm()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setIsSaving(false)
    }
  }

  async function deactivate(table) {
    if (!window.confirm(`Deactivate table ${table.table_number}?`)) return
    try {
      await deactivateManagerTable(table.id)
      setTables((current) => current.map((item) => item.id === table.id ? { ...item, is_active: false } : item))
      setMessage({ type: 'success', text: 'Table deactivated.' })
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  return (
    <ManagerLayout profile={profile}>
      <header className="border-b border-slate-200 bg-white px-6 py-5 sm:px-9"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600">Restaurant management</p><h1 className="mt-1 text-2xl font-bold">Tables</h1></header>
      <main id="manager-main" tabIndex="-1" className="px-6 py-8 sm:px-9">
        <h2 className="text-3xl font-bold text-slate-900">Seating inventory</h2><p className="mt-2 text-sm text-slate-500">Manage bookable tables inside branches you own.</p>
        {message.text && <div role={message.type === 'error' ? 'alert' : 'status'} className={`mt-5 rounded-xl border px-4 py-3 text-sm ${message.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{message.text}</div>}

        <form onSubmit={saveTable} className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between"><h3 className="text-lg font-bold">{editingId ? 'Edit table' : 'Add table'}</h3>{editingId && <button type="button" onClick={resetForm} className="text-sm font-semibold text-slate-500">Cancel edit</button>}</div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <label className="text-sm font-semibold">Branch<select name="branch_id" value={form.branch_id} onChange={changeField} disabled={Boolean(editingId)} required className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal disabled:bg-slate-100">{branches.filter((branch) => branch.is_active || String(branch.id) === form.branch_id).map((branch) => <option key={branch.id} value={branch.id}>{branch.restaurant_name} · {branch.name}</option>)}</select></label>
            <label className="text-sm font-semibold">Table number<input name="table_number" value={form.table_number} onChange={changeField} required className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
            <label className="text-sm font-semibold">Capacity<input name="capacity" type="number" min="1" value={form.capacity} onChange={changeField} required className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
            <label className="text-sm font-semibold">Seating<select name="seating_type" value={form.seating_type} onChange={changeField} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"><option value="INDOOR">Indoor</option><option value="OUTDOOR">Outdoor</option><option value="WINDOW">Window</option></select></label>
            <label className="flex items-center gap-2 self-end rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold"><input name="is_active" type="checkbox" checked={form.is_active} onChange={changeField} /> Active</label>
          </div>
          {branches.length === 0 && !isLoading && <p className="mt-4 text-sm text-amber-700">Create an active branch before adding tables.</p>}
          <button disabled={isSaving || !form.branch_id} className="mt-5 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{isSaving ? 'Saving...' : editingId ? 'Save changes' : 'Create table'}</button>
        </form>

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {isLoading ? <p className="p-12 text-center text-sm text-slate-500">Loading tables...</p> : tables.length === 0 ? <p className="p-12 text-center text-sm text-slate-500">No tables have been created.</p> : <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-200 text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Table</th><th className="px-5 py-3">Branch</th><th className="px-5 py-3">Capacity</th><th className="px-5 py-3">Seating</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{tables.map((table) => <tr key={table.id}><td className="px-5 py-4 font-bold">{table.table_number}</td><td className="px-5 py-4">{table.restaurant_name}<p className="text-xs text-slate-500">{table.branch_name}</p></td><td className="px-5 py-4">{table.capacity}</td><td className="px-5 py-4">{table.seating_type}</td><td className="px-5 py-4">{table.is_active ? 'Active' : 'Inactive'}</td><td className="px-5 py-4"><div className="flex gap-2"><button type="button" onClick={() => startEditing(table)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold">Edit</button>{table.is_active && <button type="button" onClick={() => deactivate(table)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">Deactivate</button>}</div></td></tr>)}</tbody></table></div>}
        </section>
      </main>
    </ManagerLayout>
  )
}


export default ManagerTables
