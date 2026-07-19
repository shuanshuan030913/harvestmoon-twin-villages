import { Link, NavLink, Outlet, ScrollRestoration, useLocation, useNavigate } from 'react-router'
import { IconDefs } from './components/icons.jsx'

// 行事曆自導覽降級（2026-07-14 使用者裁決）：定位為生日/節慶索引頁，入口在首頁九宮格
const NAV_ITEMS = [
  { to: '/', label: '查詢', end: true },
  { to: '/tracker', label: '存檔' },
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
      className="text-ink/70 hover:bg-ink/10 absolute top-1/2 left-0 -translate-y-1/2 rounded-full px-2 py-0.5 text-lg leading-none"
    >
      ←
    </button>
  )
}

function Layout() {
  return (
    <div className="bg-parchment bg-dots text-ink min-h-dvh">
      {/* 換頁自動捲回頂部；瀏覽器上一頁/下一頁仍還原原位置（2026-07-19 使用者回饋：
          點內文連結換頁後停在原捲動位置，全站唯一無此機制的入口） */}
      <ScrollRestoration />
      <IconDefs />
      {/* 階梯式加寬（2026-07-15 使用者修訂 README 決策 8）：
          行動基準 max-w-lg，md 起加寬讓長表格與格狀列表增欄，不做多欄版型 */}
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col md:max-w-3xl xl:max-w-5xl">
        <header className="bg-parchment border-ink/30 sticky top-0 z-10 border-b-2 border-dashed px-4 pt-4 pb-2.5">
          <div className="relative">
            <BackButton />
            <Link to="/" className="sticker mx-auto block w-fit px-6 py-1 text-center" aria-label="回首頁">
              <h1 className="font-hand text-lg font-bold tracking-[0.2em]">
                雙子村攻略手帳
              </h1>
            </Link>
          </div>
          <nav className="mt-3 flex justify-center gap-2">
            {NAV_ITEMS.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `font-hand rounded-full px-4 py-1 text-sm font-bold transition-colors ${
                    isActive
                      ? 'bg-ink text-cream'
                      : 'border-ink/40 text-ink/70 hover:bg-ink/10 border border-dashed'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </header>
        <main className="bg-cream border-ink/70 mx-3 mt-5 mb-6 flex-1 rounded-2xl border-[1.5px] p-4 shadow-[3px_4px_0_rgba(74,55,40,0.15)] md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
