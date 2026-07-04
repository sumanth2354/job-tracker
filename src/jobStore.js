import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const JOBS_PATH = path.join(__dirname, '..', 'data', 'jobs.json')

export function loadJobs() {
  if (!fs.existsSync(JOBS_PATH)) return {}
  try {
    return JSON.parse(fs.readFileSync(JOBS_PATH, 'utf-8'))
  } catch {
    return {}
  }
}

export function saveJobs(data) {
  fs.writeFileSync(JOBS_PATH, JSON.stringify(data, null, 2))
}

// Returns list of new jobs (not seen before) and updates the store in-place.
// On first run for a company, stores all jobs WITHOUT returning them as new.
export function detectNewJobs(store, key, freshJobs) {
  if (!store[key]) {
    store[key] = {
      seenIds: freshJobs.map(j => j.id),
      lastChecked: new Date().toISOString(),
    }
    return [] // first run — baseline only, no alerts
  }

  const seenSet = new Set(store[key].seenIds)
  const newJobs = freshJobs.filter(j => !seenSet.has(j.id))

  // Update store with new IDs
  store[key] = {
    seenIds: [...seenSet, ...newJobs.map(j => j.id)],
    lastChecked: new Date().toISOString(),
  }

  return newJobs
}
