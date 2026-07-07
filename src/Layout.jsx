import { NavLink, Outlet } from 'react-router'

function Layout() {
  return (
    <div className="bg-parchment text-ink min-h-screen">
      <header className="flex gap-4 border-b border-ink p-4">
        <NavLink to="/" end>
          查詢
        </NavLink>
        <NavLink to="/calendar">行事曆</NavLink>
        <NavLink to="/tracker">追蹤器</NavLink>
      </header>
      <main className="p-8">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
