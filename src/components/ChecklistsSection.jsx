import { useState } from 'react'
import { Tabs } from 'radix-ui'
import characters from '../data/characters.json'
import fishes from '../data/fishes.json'
import insects from '../data/insects.json'
import minerals from '../data/minerals.json'
import recipes from '../data/recipes.json'
import { toggleChecklistItemUseCase } from '../usecases/checklistUseCase.js'
import { buildBellJewelChecklist, buildCollectionChecklist, buildRomanceEventChecklist } from '../utils/checklist.js'

const ENCYCLOPEDIA_GROUPS = [
  { checklistId: 'encyclopedia-fish', label: '魚類', items: buildCollectionChecklist(fishes) },
  { checklistId: 'encyclopedia-insect', label: '昆蟲', items: buildCollectionChecklist(insects) },
  { checklistId: 'encyclopedia-mineral', label: '礦物', items: buildCollectionChecklist(minerals) },
]

const TABS = [
  { id: 'encyclopedia', label: '圖鑑' },
  { id: 'recipes', label: '食譜', checklistId: 'recipes', items: buildCollectionChecklist(recipes) },
  { id: 'bell-jewels', label: '六色耀珠', checklistId: 'bell-jewels', items: buildBellJewelChecklist() },
  { id: 'romance-events', label: '戀愛事件', checklistId: 'romance-events', items: buildRomanceEventChecklist(characters) },
]

function ChecklistItems({ checklistId, items, checked, onToggle }) {
  if (items.length === 0) {
    return <p className="text-ink/50 mt-2 text-xs">此清單目前尚無條目。</p>
  }

  return (
    <ul className="mt-2 flex flex-col gap-1">
      {items.map((item) => (
        <li key={item.id}>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={checked.includes(item.id)}
              onChange={() => onToggle(checklistId, item.id)}
            />
            {item.label}
          </label>
        </li>
      ))}
    </ul>
  )
}

export function ChecklistsSection({ save, onSave }) {
  const [activeTab, setActiveTab] = useState(TABS[0].id)
  const [activeEncyclopedia, setActiveEncyclopedia] = useState(ENCYCLOPEDIA_GROUPS[0].checklistId)

  function handleToggle(checklistId, itemId) {
    onSave(toggleChecklistItemUseCase(save, checklistId, itemId))
  }

  return (
    <section className="mt-4">
      <h2 className="text-sm font-bold">收集清單</h2>

      <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="mt-2">
        <Tabs.List className="flex flex-wrap gap-1">
          {TABS.map((tab) => (
            <Tabs.Trigger
              key={tab.id}
              value={tab.id}
              className="border-ink/30 data-[state=active]:bg-ink data-[state=active]:text-parchment rounded-full border px-3 py-1 text-xs"
            >
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="encyclopedia" className="mt-2">
          <div className="flex flex-wrap gap-1">
            {ENCYCLOPEDIA_GROUPS.map((group) => (
              <button
                key={group.checklistId}
                type="button"
                onClick={() => setActiveEncyclopedia(group.checklistId)}
                className={`rounded-full border px-2 py-0.5 text-xs ${
                  activeEncyclopedia === group.checklistId
                    ? 'bg-ink text-parchment border-ink'
                    : 'border-ink/30 bg-cream'
                }`}
              >
                {group.label}
              </button>
            ))}
          </div>
          {ENCYCLOPEDIA_GROUPS.filter((group) => group.checklistId === activeEncyclopedia).map((group) => (
            <ChecklistItems
              key={group.checklistId}
              checklistId={group.checklistId}
              items={group.items}
              checked={save.checklists[group.checklistId] ?? []}
              onToggle={handleToggle}
            />
          ))}
        </Tabs.Content>

        {TABS.filter((tab) => tab.checklistId).map((tab) => (
          <Tabs.Content key={tab.id} value={tab.id} className="mt-2">
            <ChecklistItems
              checklistId={tab.checklistId}
              items={tab.items}
              checked={save.checklists[tab.checklistId] ?? []}
              onToggle={handleToggle}
            />
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </section>
  )
}
