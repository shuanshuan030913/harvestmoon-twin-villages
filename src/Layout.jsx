import { NavLink, Outlet } from 'react-router'

const NAV_ITEMS = [
  { to: '/', label: '查詢', end: true },
  { to: '/calendar', label: '行事曆' },
  { to: '/tracker', label: '追蹤器' },
]

function Layout() {
  return (
    <div className="bg-parchment bg-dots text-ink min-h-dvh">
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col">
        <header className="bg-ink text-parchment sticky top-0 z-10 rounded-b-2xl px-4 pt-3 pb-2 shadow-md">
          <h1 className="text-center text-lg font-bold tracking-widest">
            雙子村攻略
          </h1>
          <nav className="mt-2 flex justify-center gap-2">
            {NAV_ITEMS.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `rounded-full px-4 py-1 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-cream text-ink'
                      : 'text-parchment/80 hover:bg-parchment/20'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </header>
        <main className="bg-cream mx-3 mt-4 mb-6 flex-1 rounded-3xl p-4 shadow-sm">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
