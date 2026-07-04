import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const STORE_PATH = path.join(__dirname, '..', 'data', 'hashes.json')

export function loadStore() {
  if (!fs.existsSync(STORE_PATH)) return {}
  try {
    return JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'))
  } catch {
    return {}
  }
}

export function saveStore(data) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2))
}
