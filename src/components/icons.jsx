// 手帳線條圖示 sprite（DESIGN.md：禁止 emoji 當圖示；新圖示先加進這裡）
// 24×24 viewBox、stroke 1.8、圓端點，由 <Icon> 以 currentColor 上色。
const SYMBOLS = {
  person: (
    <>
      <circle cx="12" cy="8.5" r="3.2" />
      <path d="M5.5 19.5c1.4-3.4 3.8-5 6.5-5s5.1 1.6 6.5 5" />
    </>
  ),
  wheat: (
    <>
      <path d="M12 20.5V7.5" />
      <path d="M12 12.5l-3.5-2M12 12.5l3.5-2M12 9.5l-3.5-2M12 9.5l3.5-2M12 15.5l-3.5-2M12 15.5l3.5-2" />
    </>
  ),
  sheep: (
    <>
      <ellipse cx="13" cy="12.5" rx="6.5" ry="4.8" />
      <circle cx="6.5" cy="10.5" r="2.3" />
      <path d="M10 17v3M16 17v3" />
    </>
  ),
  pot: (
    <>
      <path d="M4.5 11h15" />
      <path d="M6 11v4.5a4 4 0 004 4h4a4 4 0 004-4V11" />
      <path d="M12 8c0-1.6 1.2-2 1.2-3.5" />
    </>
  ),
  fish: (
    <>
      <path d="M6 12c2.3-3 5-4.5 8-4.5 2.4 0 4.4 1.5 6 4.5-1.6 3-3.6 4.5-6 4.5-3 0-5.7-1.5-8-4.5z" />
      <path d="M6 12L3 9.5v5z" />
      <circle cx="16.5" cy="11" r=".5" fill="currentColor" />
    </>
  ),
  bug: (
    <>
      <circle cx="12" cy="7.5" r="2.2" />
      <ellipse cx="12" cy="14.5" rx="4.3" ry="5" />
      <path d="M12 10v9M9.7 5.8L8 3.5M14.3 5.8L16 3.5M7.7 12.5H4.7M7.7 16.5H5.2M16.3 12.5h3M16.3 16.5h2.5" />
    </>
  ),
  gem: (
    <>
      <path d="M7.5 4.5h9l4 5-8.5 10-8.5-10z" />
      <path d="M3.5 9.5h17M12 19.5L8.8 9.5l3.2-5 3.2 5z" />
    </>
  ),
  flag: (
    <>
      <path d="M6.5 21V4" />
      <path d="M6.5 5c4-2 7 2 11.5 0v7.5c-4.5 2-7.5-2-11.5 0" />
    </>
  ),
  village: (
    <>
      <path d="M3 20v-6.5L7.5 9l4.5 4.5V20H3z" />
      <path d="M12.5 20v-8L17 7.5l4.5 4.5v8h-9z" />
    </>
  ),
  cal: (
    <>
      <rect x="4" y="6" width="16" height="14" rx="2.5" />
      <path d="M4 10.5h16M8.5 3.5V7M15.5 3.5V7" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="M15.5 15.5L20 20" />
    </>
  ),
  heart: (
    <path d="M12 20s-7.5-4.8-7.5-9.8C4.5 7 6.5 5.5 8.5 5.5c1.5 0 2.9.9 3.5 2.2.6-1.3 2-2.2 3.5-2.2 2 0 4 1.5 4 4.7 0 5-7.5 9.8-7.5 9.8z" />
  ),
  cake: (
    <>
      <path d="M5.5 20.5h13V15a2 2 0 00-2-2h-9a2 2 0 00-2 2z" />
      <path d="M5.5 16.5c1.4 1.1 2.9 1.1 4.3 0s2.9-1.1 4.4 0 2.9 1.1 4.3 0" />
      <path d="M12 13v-2.5" />
      <path d="M12 8.5c-.8-.9-.8-1.9 0-2.8.8.9.8 1.9 0 2.8z" />
    </>
  ),
  // 攻略總覽入口／guide 分類共用（U18，2026-07-19）
  book: (
    <>
      <path d="M4 6.5c2.2-1.3 5-1.3 8 0v13c-3-1.3-5.8-1.3-8 0z" />
      <path d="M20 6.5c-2.2-1.3-5-1.3-8 0v13c3-1.3 5.8-1.3 8 0z" />
    </>
  ),
  house: (
    <>
      <path d="M4 11.5L12 4l8 7.5" />
      <path d="M6 10v10h12V10" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M15 9l-2 6-6 2 2-6z" />
    </>
  ),
}

// 掛一次在 Layout，之後全站用 <Icon id> 引用
export function IconDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        {Object.entries(SYMBOLS).map(([id, content]) => (
          <symbol key={id} id={`icon-${id}`} viewBox="0 0 24 24">
            {content}
          </symbol>
        ))}
      </defs>
    </svg>
  )
}

export function Icon({ id, className }) {
  return (
    <svg
      className={className}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <use href={`#icon-${id}`} />
    </svg>
  )
}
