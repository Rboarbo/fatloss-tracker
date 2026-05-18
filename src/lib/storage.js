const KEYS = {
  entries: 'fatloss:entries',
  settings: 'fatloss:settings',
}

export function getEntries() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.entries) ?? '[]')
  } catch {
    return []
  }
}

export function saveEntries(entries) {
  localStorage.setItem(KEYS.entries, JSON.stringify(entries))
}

export function addEntry(entry) {
  const entries = getEntries()
  // Replace if same date already exists
  const idx = entries.findIndex((e) => e.date === entry.date)
  if (idx >= 0) {
    entries[idx] = entry
  } else {
    entries.push(entry)
  }
  entries.sort((a, b) => a.date.localeCompare(b.date))
  saveEntries(entries)
  return entries
}

export function deleteEntry(date) {
  const entries = getEntries().filter((e) => e.date !== date)
  saveEntries(entries)
  return entries
}

export function getSettings() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.settings) ?? 'null') ?? defaultSettings()
  } catch {
    return defaultSettings()
  }
}

export function saveSettings(settings) {
  localStorage.setItem(KEYS.settings, JSON.stringify(settings))
}

function defaultSettings() {
  return {
    unit: 'kg',
    startWeight: null,
    goalWeight: null,
    startDate: null,
  }
}
