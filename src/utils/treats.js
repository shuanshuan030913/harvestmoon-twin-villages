export function computeTreatShortfall(treatRequirements, treatsFed) {
  if (!treatRequirements) return null

  const result = {}
  for (const [type, thresholds] of Object.entries(treatRequirements)) {
    if (thresholds === null) continue

    const fed = treatsFed?.[type] ?? 0
    const nextThreshold = thresholds.find((threshold) => fed < threshold)
    result[type] = nextThreshold === undefined ? 0 : Math.max(0, nextThreshold - fed)
  }
  return result
}
