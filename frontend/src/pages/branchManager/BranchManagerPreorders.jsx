
import { useEffect, useState } from 'react'
import {
  getBranchManagerPreorders,
  updateBranchManagerPreorderStatus,
} from '../../api/branchManagerApi'
import BranchManagerLayout from '../../components/branchManager/BranchManagerLayout'
import useBranchManagerShell from '../../components/branchManager/useBranchManagerShell'

const transitions = {
  PLACED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
}

function BranchManagerPreorders() {
  const { profile, branch } = useBranchManagerShell()
  const [rows, setRows] = useState([])
  const [filter, setFilter] = useState('')
  const [message, setMessage] = useState('')

  async function load(status = filter) {
    try {
      setRows(await getBranchManagerPreorders(status))
      setMessage('')
    } catch (err) {
      setMessage(err.message)
    }
  }

  useEffect(() => { load('') }, [])

  async function changeStatus(row, next) {
    try {
      const updated = await updateBranchManagerPreorderStatus(row.id, next)
      setRows((current) => current.map((item) => item.id === updated.id ? updated : item))
    } catch (err) {
      setMessage(err.message)
    }
  }

  return (
    <BranchManagerLayout profile={profile} branch={branch}>
      <header className="border-b border-slate-200 bg-white px-6 py-5 sm:px-9">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600">Branch operations</p>
        <h1 className="mt-1 text-2xl font-bold">Food Pre-orders</h1>
      </header>

      <main className="px-6 py-8 sm:px-9">
        <div className="flex flex-wrap gap-2">
          {['', 'PLACED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'].map((status) => (
            <button
              key={status || 'ALL'}
              type="button"
              onClick={() => { setFilter(status); load(status) }}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${filter === status ? 'bg-orange-500 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}
            >
              {status || 'ALL'}
            </button>
          ))}
        </div>

        {message && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>}

        <section className="mt-6 grid gap-4 xl:grid-cols-2">
          {rows.map((row) => (
            <article key={row.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase text-orange-600">Booking #{row.booking_id}</p>
                  <h3 className="mt-1 text-lg font-bold">{row.customer_name || 'Customer'}</h3>
                  <p className="mt-1 text-sm text-slate-500">{row.reservation_date} · {row.start_time} · Table {row.table_number}</p>
                </div>
                <span className="h-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{row.status}</span>
              </div>

              <div className="mt-5 space-y-2 rounded-xl bg-slate-50 p-4">
                {row.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.food_item_name} × {item.quantity}</span>
                    <span>৳{item.unit_price}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-slate-500">Order total</p><p className="font-bold">৳{row.total_amount}</p></div>
                <div><p className="text-slate-500">Advance</p><p className="font-bold">৳{row.advance_amount}</p></div>
              </div>

              {row.special_request && (
                <div className="mt-4 rounded-xl border border-orange-100 bg-orange-50 p-4 text-sm">
                  <p className="font-semibold text-orange-800">Special request</p>
                  <p className="mt-1 text-orange-700">{row.special_request}</p>
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                {(transitions[row.status] || []).map((next) => (
                  <button key={next} type="button" onClick={() => changeStatus(row, next)} className="rounded-lg border border-orange-200 px-3 py-2 text-xs font-semibold text-orange-700">{next}</button>
                ))}
              </div>
            </article>
          ))}
        </section>

        {rows.length === 0 && <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">No food pre-orders are stored for this branch yet.</div>}
      </main>
    </BranchManagerLayout>
  )
}

export default BranchManagerPreorders
