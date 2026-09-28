
import { useEffect, useState } from 'react'
import { getBranchManagerNotifications } from '../../api/branchManagerApi'
import BranchManagerLayout from '../../components/branchManager/BranchManagerLayout'
import useBranchManagerShell from '../../components/branchManager/useBranchManagerShell'

function BranchManagerNotifications() {
  const { profile, branch } = useBranchManagerShell()
  const [events, setEvents] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    getBranchManagerNotifications().then(setEvents).catch((err) => setError(err.message))
  }, [])

  return (
    <BranchManagerLayout profile={profile} branch={branch}>
      <header className="border-b border-slate-200 bg-white px-6 py-5 sm:px-9">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600">Branch operations</p>
        <h1 className="mt-1 text-2xl font-bold">Notifications</h1>
      </header>
      <main className="px-6 py-8 sm:px-9">
        <h2 className="text-3xl font-bold">Recent branch activity</h2>
        <p className="mt-2 text-sm text-slate-500">Generated from persisted reservation and pre-order records.</p>
        {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <section className="mt-6 max-w-4xl space-y-3">
          {events.map((event) => (
            <article key={event.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex gap-4">
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-orange-50 font-bold text-orange-700">{event.kind === 'preorder' ? 'F' : 'R'}</span>
                <div><h3 className="font-bold">{event.title}</h3><p className="mt-1 text-sm text-slate-500">{event.message}</p><p className="mt-2 text-xs text-slate-400">{new Date(event.timestamp).toLocaleString()}</p></div>
              </div>
            </article>
          ))}
          {events.length === 0 && !error && <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">No recent branch activity.</div>}
        </section>
      </main>
    </BranchManagerLayout>
  )
}

export default BranchManagerNotifications
