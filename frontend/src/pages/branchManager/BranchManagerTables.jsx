
import { useEffect, useMemo, useState } from 'react'
import {
  createBranchManagerTable,
  deactivateBranchManagerTable,
  getBranchManagerTables,
  updateBranchManagerTable,
} from '../../api/branchManagerApi'
import BranchManagerLayout from '../../components/branchManager/BranchManagerLayout'
import useBranchManagerShell from '../../components/branchManager/useBranchManagerShell'
import ConfirmDialog from '../../components/ConfirmDialog'
import PaginationControls from '../../components/PaginationControls'
import { clampPage, paginateItems } from '../../utils/pagination'

const empty = { table_number: '', capacity: 2, seating_type: 'INDOOR', is_active: true }

function BranchManagerTables() {
  const { profile, branch } = useBranchManagerShell()
  const [rows, setRows] = useState([])
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pendingDeactivate, setPendingDeactivate] = useState(null)

  useEffect(() => {
    getBranchManagerTables().then(setRows).catch((err) => setMessage(err.message))
  }, [])

  async function save(event) {
    event.preventDefault()
    try {
      const payload = { ...form, capacity: Number(form.capacity) }
      const saved = editing
        ? await updateBranchManagerTable(editing, payload)
        : await createBranchManagerTable(payload)

      setRows((current) => editing
        ? current.map((row) => row.id === saved.id ? saved : row)
        : [...current, saved])
      setEditing(null)
      setForm(empty)
      setMessage('')
    } catch (err) {
      setMessage(err.message)
    }
  }

  function edit(row) {
    setEditing(row.id)
    setForm({
      table_number: row.table_number,
      capacity: row.capacity,
      seating_type: row.seating_type,
      is_active: row.is_active,
    })
  }

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    return !query ? rows : rows.filter((row) => (
      [row.table_number, row.seating_type, row.capacity]
        .some((value) => String(value).toLowerCase().includes(query))
    ))
  }, [rows, search])
  const safePage = clampPage(currentPage, filteredRows.length)
  const visibleRows = paginateItems(filteredRows, safePage)

  async function deactivate() {
    if (!pendingDeactivate) return
    try {
      await deactivateBranchManagerTable(pendingDeactivate.id)
      setRows((current) => current.map((item) => (
        item.id === pendingDeactivate.id ? { ...item, is_active: false } : item
      )))
      setPendingDeactivate(null)
    } catch (err) {
      setMessage(err.message)
    }
  }

  return (
    <BranchManagerLayout profile={profile} branch={branch}>
      <header className="border-b border-slate-200 bg-white px-6 py-5 sm:px-9">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600">Branch operations</p>
        <h1 className="mt-1 text-2xl font-bold">Tables</h1>
      </header>

      <main className="px-6 py-8 sm:px-9">
        {message && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>}

        <form onSubmit={save} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">{editing ? 'Edit table' : 'Add table'}</h2>
            {editing && <button type="button" onClick={() => { setEditing(null); setForm(empty) }} className="text-sm font-semibold text-slate-500">Cancel</button>}
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <input placeholder="Table number" value={form.table_number} onChange={(e) => setForm({ ...form, table_number: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2.5" required />
            <input type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2.5" required />
            <select value={form.seating_type} onChange={(e) => setForm({ ...form, seating_type: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2.5">
              <option value="INDOOR">Indoor</option><option value="OUTDOOR">Outdoor</option><option value="WINDOW">Window</option>
            </select>
            <button className="rounded-xl bg-orange-500 px-4 py-2.5 font-bold text-white">{editing ? 'Save changes' : 'Add table'}</button>
          </div>
        </form>

        <label className="mt-6 block"><span className="sr-only">Search tables</span><input value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1) }} placeholder="Search table, seating, or capacity" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" /></label>
        <section className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleRows.map((row) => (
            <article key={row.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div><p className="text-xs font-bold uppercase text-orange-600">{row.seating_type}</p><h3 className="mt-1 text-xl font-bold">Table {row.table_number}</h3></div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${row.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{row.is_active ? 'Active' : 'Inactive'}</span>
              </div>
              <p className="mt-3 text-sm text-slate-500">Capacity: {row.capacity} guests</p>
              <div className="mt-5 flex gap-2">
                <button type="button" onClick={() => edit(row)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold">Edit</button>
                {row.is_active && <button type="button" onClick={() => setPendingDeactivate(row)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">Deactivate</button>}
              </div>
            </article>
          ))}
        </section>
        {filteredRows.length === 0 && <p className="mt-5 text-center text-sm text-slate-500">No tables match your search.</p>}
        <PaginationControls currentPage={safePage} itemCount={filteredRows.length} onPageChange={setCurrentPage} itemLabel="tables" />
      </main>
      {pendingDeactivate && <ConfirmDialog title="Deactivate this table?" description={`Table ${pendingDeactivate.table_number} will stop accepting new reservations.`} confirmLabel="Deactivate" onCancel={() => setPendingDeactivate(null)} onConfirm={deactivate} />}
    </BranchManagerLayout>
  )
}

export default BranchManagerTables
