
import { useEffect, useMemo, useState } from 'react'
import {
  getBranchManagerMenu,
  updateBranchMenuAvailability,
} from '../../api/branchManagerApi'
import BranchManagerLayout from '../../components/branchManager/BranchManagerLayout'
import useBranchManagerShell from '../../components/branchManager/useBranchManagerShell'

function BranchManagerMenu() {
  const { profile, branch } = useBranchManagerShell()
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    getBranchManagerMenu().then(setItems).catch((err) => setMessage(err.message))
  }, [])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return !q ? items : items.filter((item) => (
      item.name.toLowerCase().includes(q)
      || item.category.toLowerCase().includes(q)
    ))
  }, [items, search])

  async function toggle(item) {
    try {
      const updated = await updateBranchMenuAvailability(
        item.food_item_id,
        !item.branch_available,
      )
      setItems((current) => current.map((row) => (
        row.food_item_id === item.food_item_id
          ? { ...row, branch_available: updated.branch_available }
          : row
      )))
    } catch (err) {
      setMessage(err.message)
    }
  }

  return (
    <BranchManagerLayout profile={profile} branch={branch}>
      <header className="border-b border-slate-200 bg-white px-6 py-5 sm:px-9">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600">Branch operations</p>
        <h1 className="mt-1 text-2xl font-bold">Menu Availability</h1>
      </header>

      <main className="px-6 py-8 sm:px-9">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="text-3xl font-bold">Branch-local availability</h2>
            <p className="mt-2 text-sm text-slate-500">The Restaurant Manager owns the master menu. You control only whether each existing item is available at this branch.</p>
          </div>
          <input placeholder="Search menu" value={search} onChange={(e) => setSearch(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" />
        </div>

        {message && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>}

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((item) => (
            <article key={item.food_item_id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase text-orange-600">{item.category}</p>
              <div className="mt-2 flex justify-between gap-4">
                <div><h3 className="text-lg font-bold">{item.name}</h3><p className="mt-1 text-sm text-slate-500">{item.description}</p></div>
                <p className="font-bold">৳{item.price}</p>
              </div>
              <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <div><p className="text-sm font-semibold">Available at branch</p>{!item.restaurant_available && <p className="text-xs text-red-600">Disabled by Restaurant Manager</p>}</div>
                <button type="button" disabled={!item.restaurant_available} onClick={() => toggle(item)} className={`relative h-7 w-12 rounded-full transition ${item.branch_available && item.restaurant_available ? 'bg-emerald-600' : 'bg-slate-300'} disabled:opacity-50`}>
                  <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${item.branch_available && item.restaurant_available ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            </article>
          ))}
        </section>
      </main>
    </BranchManagerLayout>
  )
}

export default BranchManagerMenu
