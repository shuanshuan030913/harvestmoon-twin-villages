export function buildCollectionChecklist(entries) {
  if (!entries) return []
  return entries.map((entry) => ({ id: entry.slug, label: entry.name }))
}

export const BELL_JEWEL_COLORS = ['紅色', '橙色', '黃色', '藍色', '綠色', '紫色']

export function buildBellJewelChecklist() {
  return BELL_JEWEL_COLORS.map((color) => ({ id: color, label: `${color}耀珠` }))
}

// 依 [[好感度與愛情度系統]] 花朵顏色等級表
export const ROMANCE_STAGES = ['白花', '紫花', '青花', '緑花', '橙花', '粉色花苞', '大紅花']

export function buildRomanceEventChecklist(characters) {
  if (!characters) return []
  return characters
    .filter((character) => character.marriageable)
    .flatMap((character) =>
      ROMANCE_STAGES.map((stage) => ({
        id: `${character.slug}-${stage}`,
        label: `${character.name} · ${stage}`,
      })),
    )
}
