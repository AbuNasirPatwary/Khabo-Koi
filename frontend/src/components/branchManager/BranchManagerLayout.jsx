
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { clearBranchManagerAuthentication } from '../../api/branchManagerApi'

const items = [
  ['Dashboard', 'D', '/branch-manager/dashboard'],
  ['Reservations', 'R', '/branch-manager/reservations'],
  ['Food Pre-orders', 'F', '/branch-manager/preorders'],
  ['Tables', 'T', '/branch-manager/tables'],
  ['Menu Availability', 'M', '/branch-manager/menu'],
  ['Branch Profile', 'B', '/branch-manager/profile'],
  ['Notifications', 'N', '/branch-manager/notifications'],
]

function BranchManagerLayout({ children, profile, branch }) {
  const navigate = useNavigate()

  function logout() {
    clearBranchManagerAuthentication()
    navigate('/branch-manager/login')
  }

  return (
    <div className="min-h-screen bg-[#FDF8F0] lg:flex">
      <aside className="bg-[#1A5C38] text-white lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:flex-none">
        <div className="flex h-full flex-col px-5 py-6">
          <Link to="/" className="flex items-center gap-3 px-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 font-bold">K</span>
            <span className="text-xl font-bold">Khabo<span className="text-orange-300">-Koi</span></span>
          </Link>

          <div className="mt-7 rounded-xl border border-white/10 bg-white/10 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-200">Branch Manager</p>
            <p className="mt-1 text-sm font-semibold">{branch?.restaurant_name || 'Assigned restaurant'}</p>
            <p className="mt-1 text-xs text-white/60">{branch?.name || 'Assigned branch'}</p>
          </div>

          <nav className="mt-7 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {items.map(([label, symbol, to]) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${isActive ? 'bg-orange-500 text-white shadow-lg shadow-emerald-950/20' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-xs font-bold">{symbol}</span>
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-7 border-t border-white/10 pt-5 lg:mt-auto">
            <div className="rounded-xl bg-white/10 p-4">
              <p className="truncate text-sm font-semibold">{profile?.username || 'Branch Manager'}</p>
              <p className="mt-1 truncate text-xs text-white/55">{profile?.email || 'Authorized branch access'}</p>
              <button onClick={logout} className="mt-4 w-full rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold transition hover:bg-white/10">
                Sign out
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

export default BranchManagerLayout
