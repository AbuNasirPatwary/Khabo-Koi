
import { useState } from 'react'
import { updateBranchManagerContext } from '../../api/branchManagerApi'
import BranchManagerLayout from '../../components/branchManager/BranchManagerLayout'
import useBranchManagerShell from '../../components/branchManager/useBranchManagerShell'

function BranchManagerProfile() {
  const { profile, branch, setBranch, shellError } = useBranchManagerShell()
  const [formChanges, setFormChanges] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })

  // Until the user edits a field, derive the form directly from the latest
  // branch context. This removes the need to mirror props into state.
  const form = branch
    ? formChanges || {
        address: branch.address || '',
        phone: branch.phone || '',
        opening_time: (branch.opening_time || '').slice(0, 5),
        closing_time: (branch.closing_time || '').slice(0, 5),
      }
    : null

  function updateField(field, value) {
    setFormChanges({
      ...form,
      [field]: value,
    })
  }

  async function save(event) {
    event.preventDefault()
    try {
      const updated = await updateBranchManagerContext(form)
      setBranch(updated)
      setFormChanges(null)
      setMessage({ type: 'success', text: 'Branch profile updated.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    }
  }

  return (
    <BranchManagerLayout profile={profile} branch={branch}>
      <header className="border-b border-slate-200 bg-white px-6 py-5 sm:px-9">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600">Branch operations</p>
        <h1 className="mt-1 text-2xl font-bold">Branch Profile</h1>
      </header>
      <main className="px-6 py-8 sm:px-9">
        <div className="max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase text-orange-600">{branch?.restaurant_name}</p>
          <h2 className="mt-2 text-3xl font-bold">{branch?.name}</h2>
          <p className="mt-2 text-sm text-slate-500">Update operational contact details and hours. Branch identity stays under Restaurant Manager control.</p>

          {(shellError || message.text) && (
            <div className={`mt-5 rounded-xl border px-4 py-3 text-sm ${(shellError || message.type === 'error') ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
              {shellError || message.text}
            </div>
          )}

          {form && (
            <form onSubmit={save} className="mt-7 grid gap-5 md:grid-cols-2">
              <label className="text-sm font-semibold">Phone<input value={form.phone} onChange={(e) => updateField('phone', e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal" /></label>
              <label className="text-sm font-semibold">Address<input value={form.address} onChange={(e) => updateField('address', e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal" /></label>
              <label className="text-sm font-semibold">Opening time<input type="time" value={form.opening_time} onChange={(e) => updateField('opening_time', e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal" /></label>
              <label className="text-sm font-semibold">Closing time<input type="time" value={form.closing_time} onChange={(e) => updateField('closing_time', e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal" /></label>
              <button className="rounded-xl bg-orange-500 px-5 py-3 font-bold text-white md:col-span-2 md:w-fit">Save branch details</button>
            </form>
          )}
        </div>
      </main>
    </BranchManagerLayout>
  )
}

export default BranchManagerProfile
