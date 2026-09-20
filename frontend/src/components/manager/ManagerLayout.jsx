import {
  Link,
  NavLink,
  useNavigate,
} from 'react-router-dom'

import { clearManagerAuthentication } from '../../api/managerApi'


const navigationItems = [
  {
    label: 'Dashboard',
    symbol: 'D',
    to: '/manager/dashboard',
  },
  {
    label: 'Restaurant Profile',
    symbol: 'R',
    to: null,
  },
  {
    label: 'Reservations',
    symbol: 'B',
    to: null,
  },
  {
    label: 'Tables',
    symbol: 'T',
    to: null,
  },
  {
    label: 'Menu',
    symbol: 'M',
    to: null,
  },
  {
    label: 'Branches',
    symbol: 'L',
    to: null,
  },
]


function ManagerLayout({ children, profile }) {
  const navigate = useNavigate()

  function handleLogout() {
    clearManagerAuthentication()
    navigate('/manager/login')
  }

  return (
    <div className="min-h-screen bg-[#f7f2e9] lg:flex">
      <a
        href="#manager-main"
        className="fixed left-4 top-4 z-[60] -translate-y-24 rounded-lg bg-white px-4 py-2 text-sm font-bold text-slate-900 shadow-lg transition focus:translate-y-0"
      >
        Skip to Manager content
      </a>
      <aside className="bg-[#1a2332] text-white lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:flex-none">
        <div className="flex h-full flex-col px-5 py-6">
          <Link to="/" className="flex items-center gap-3 px-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 font-bold">
              K
            </span>
            <span className="text-xl font-bold">
              Khabo<span className="text-orange-400">-Koi</span>
            </span>
          </Link>

          <div className="mt-7 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-300">
              Restaurant Management
            </p>
            <p className="mt-1 text-xs text-white/50">
              Assigned operations portal
            </p>
          </div>

          <nav
            aria-label="Restaurant Manager navigation"
            className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-1"
          >
            {navigationItems.map((item) => {
              const content = (
                <>
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-xs font-bold">
                    {item.symbol}
                  </span>
                  {item.label}
                  {!item.to && (
                    <span className="ml-auto text-[10px] uppercase tracking-wide text-white/30">
                      Soon
                    </span>
                  )}
                </>
              )

              return item.to ? (
                <NavLink
                  key={item.label}
                  to={item.to}
                  className={({ isActive }) => (
                    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${isActive
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-950/20'
                      : 'text-white/65 hover:bg-white/5 hover:text-white'
                    }`
                  )}
                >
                  {content}
                </NavLink>
              ) : (
                <button
                  key={item.label}
                  type="button"
                  disabled
                  className="flex cursor-not-allowed items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-white/55"
                  title={`${item.label} needs its real backend workflow`}
                >
                  {content}
                </button>
              )
            })}
          </nav>

          <div className="mt-6 border-t border-white/10 pt-5 lg:mt-auto">
            <div className="rounded-xl bg-white/5 p-4">
              <p className="truncate text-sm font-semibold">
                {profile?.username || 'Restaurant Manager'}
              </p>
              <p className="mt-1 truncate text-xs text-white/50">
                {profile?.email || 'Authorized Manager'}
              </p>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-4 w-full rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
              >
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


export default ManagerLayout
