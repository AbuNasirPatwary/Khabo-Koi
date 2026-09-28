
import { useEffect, useState } from 'react'
import { getBranchManagerDashboard } from '../../api/branchManagerApi'
import BranchManagerLayout from '../../components/branchManager/BranchManagerLayout'
import useBranchManagerShell from '../../components/branchManager/useBranchManagerShell'

function BranchManagerDashboard() {
  const { profile, branch, shellError } = useBranchManagerShell()
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getBranchManagerDashboard()
      .then(setSummary)
      .catch((err) => setError(err.message))
  }, [])

  const cards = [
    ['Today reservations', summary?.reservations?.today ?? 0, `${summary?.reservations?.confirmed ?? 0} confirmed`],
    ['Pending reservations', summary?.reservations?.pending ?? 0, `${summary?.reservations?.total ?? 0} total`],
    ['Active tables', summary?.tables?.active ?? 0, `${summary?.tables?.total ?? 0} total`],
    ['Placed pre-orders', summary?.preorders?.placed ?? 0, `${summary?.preorders?.preparing ?? 0} preparing`],
    ['Ready pre-orders', summary?.preorders?.ready ?? 0, `${summary?.preorders?.total ?? 0} total`],
  ]

  return (
    <BranchManagerLayout profile={profile} branch={branch}>
      <header className="border-b border-slate-200 bg-white px-6 py-5 sm:px-9">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600">Branch operations</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Dashboard</h1>
      </header>
      <main className="px-6 py-8 sm:px-9">
        <h2 className="text-3xl font-bold text-slate-900">Welcome, {profile?.username || 'Branch Manager'}</h2>
        <p className="mt-2 text-sm text-slate-500">{branch ? `${branch.restaurant_name} · ${branch.name}` : 'Loading assigned branch...'}</p>
        {(error || shellError) && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error || shellError}</div>}
        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map(([label, value, detail]) => (
            <article key={label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">{label}</p>
              <p className="mt-3 text-4xl font-bold text-slate-900">{value}</p>
              <p className="mt-2 text-xs text-slate-400">{detail}</p>
            </article>
          ))}
        </section>
      </main>
    </BranchManagerLayout>
  )
}

export default BranchManagerDashboard
