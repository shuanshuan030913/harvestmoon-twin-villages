export function buildExportPayload(save, now = new Date()) {
  return { ...save, exportedAt: now.toISOString() }
}

export function buildExportFilename(now = new Date()) {
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `hmtv-save-${yyyy}${mm}${dd}.json`
}

function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function exportSave(save, now = new Date()) {
  const payload = buildExportPayload(save, now)
  downloadJSON(buildExportFilename(now), payload)
  return payload
}
