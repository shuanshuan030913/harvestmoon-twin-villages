import guides from '../data/guides.json'
import { Icon } from '../components/icons.jsx'
import { SYSTEM_LABELS } from '../config/systemLabels.js'

function GuidesIndexPage() {
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
                  <li
                    key={guide.slug}
                    className="border-ink/40 border-b-[1.5px] border-dotted py-2"
                  >
                    <a href={`#/guide/${guide.system}/${guide.slug}`} className="text-sm hover:underline">
                      {guide.title}
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
