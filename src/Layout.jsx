import { NavLink, Outlet, useLocation, useNavigate } from 'react-router'

const NAV_ITEMS = [
  { to: '/', label: '查詢', end: true },
  { to: '/calendar', label: '行事曆' },
  { to: '/tracker', label: '追蹤器' },
]

function BackButton() {
  const navigate = useNavigate()
  const location = useLocation()
  if (location.pathname === '/') return null

  function handleBack() {
    // 深連結直開（無站內歷史）時退回首頁，避免跳出網站
    if (window.history.state?.idx > 0) navigate(-1)
    else navigate('/')
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label="回上一頁"
      className="text-parchment hover:bg-parchment/20 absolute top-3 left-3 rounded-full px-2 py-0.5 text-lg leading-none"
    >
      ←
    </button>
  )
}

function Layout() {
  return (
    <div className="bg-parchment bg-dots text-ink min-h-dvh">
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col">
        <header className="bg-ink text-parchment sticky top-0 z-10 rounded-b-2xl px-4 pt-3 pb-2 shadow-md">
          <div className="relative">
            <BackButton />
            <h1 className="text-center text-lg font-bold tracking-widest">
              雙子村攻略
            </h1>
          </div>
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
