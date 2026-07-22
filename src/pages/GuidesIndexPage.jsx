import guides from '../data/guides.json'
import { Icon } from '../components/icons.jsx'
import { SYSTEM_LABELS } from '../config/systemLabels.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

function GuidesIndexPage() {
  useDocumentTitle('攻略總覽')
  return (
    <div>
      <h1 className="font-hand text-xl font-bold">攻略總覽</h1>
      <div className="mt-4 flex flex-col gap-6">
        {SYSTEM_LABELS.map(({ system, label, icon }) => {
          const items = guides.filter((guide) => guide.system === system)
          if (items.length === 0) return null

          return (
            <section key={system}>
              <div className="flex items-center gap-2.5">
                <span className="stamp">
                  <Icon id={icon} className="h-[18px] w-[18px]" />
                </span>
                <h2 className="font-hand text-base font-bold">{label}</h2>
                <span className="text-ink/50 text-xs">{items.length} 篇</span>
              </div>
              <ul className="mt-1.5">
                {items.map((guide) => (
                  <li key={guide.slug} className="border-ink/40 border-b-[1.5px] border-dotted">
                    <a
                      href={`#/guide/${guide.system}/${guide.slug}`}
                      className="hover:bg-parchment -mx-2 flex items-center justify-between gap-2 rounded-lg px-2 py-2.5 text-sm hover:underline"
                    >
                      <span>{guide.displayTitle ?? guide.title}</span>
                      <span className="arrow-slide text-ink/40 shrink-0" aria-hidden="true">→</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}

export default GuidesIndexPage
