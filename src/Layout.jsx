import { Link, NavLink, Outlet, ScrollRestoration, useLocation, useNavigate } from 'react-router'
import { IconDefs } from './components/icons.jsx'
import { useStuck } from './hooks/useStuck.js'

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

// 內文（角色/料理等條目 html、家庭關係、分類連結、ItemChips）一律是原生 <a href="#/...">，
// 不是 <Link>：原生錨點點擊會被 hash history 判定為 POP，ScrollRestoration 因而誤判成
// 瀏覽器上一頁/下一頁而保留原捲動位置，不會回頂部。攔截這類點擊改走 navigate() 讓它變成
// 真正的 PUSH（2026-07-19 使用者回饋：點內文連結換頁後停在原捲動位置）。
function handleInternalLinkClick(event, navigate) {
  if (event.defaultPrevented || event.button !== 0) return
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  const anchor = event.target.closest('a')
  if (!anchor || (anchor.target && anchor.target !== '_self')) return
  const href = anchor.getAttribute('href')
  if (!href || !href.startsWith('#/')) return
  event.preventDefault()
  navigate(href.slice(1))
}

function Layout() {
  const navigate = useNavigate()
  // header 的固定虛線邊框改成「真的黏頂」才顯示陰影（U65，2026-07-24：使用者
  // 回饋同一小塊畫面疊了 header 虛線／搜尋框虛線／篩選陰影三條線）；靜止狀態
  // 不需要線也能分清楚，main 卡片自己有完整邊框、跟 header 間留了間距。
  const [headerSentinelRef, headerStuck] = useStuck(0)

  return (
    <div
      className="bg-parchment bg-dots text-ink min-h-dvh"
      onClick={(event) => handleInternalLinkClick(event, navigate)}
    >
      {/* 換頁自動捲回頂部；瀏覽器上一頁/下一頁仍還原原位置（2026-07-19 使用者回饋：
          點內文連結換頁後停在原捲動位置，全站唯一無此機制的入口） */}
      <ScrollRestoration />
      <IconDefs />
      {/* 階梯式加寬（2026-07-15 使用者修訂 README 決策 8）：
          行動基準 max-w-lg，md 起加寬讓長表格與格狀列表增欄，不做多欄版型 */}
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col md:max-w-3xl xl:max-w-5xl">
        <div ref={headerSentinelRef} />
        <header
          className={`bg-parchment sticky top-0 z-10 px-4 pt-4 pb-2.5 transition-shadow ${
            headerStuck ? 'shadow-[0_4px_6px_-4px_rgba(74,55,40,0.18)]' : ''
          }`}
        >
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
