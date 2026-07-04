import 'dotenv/config'
import { crawlPage } from './src/crawler.js'
import { loadStore, saveStore } from './src/store.js'
import { sendChangeAlert, sendSummary, sendFirstRun } from './src/notifier.js'
import { URLS } from './src/urls.js'

const DELAY_MS = 2000 // polite delay between requests

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function run() {
  console.log(`\n🔍 Job Tracker — checking ${URLS.length} career pages\n`)

  const store = loadStore()
  const isFirstRun = Object.keys(store).length === 0

  let changed = 0
  let errors = 0

  for (const { name, url } of URLS) {
    process.stdout.write(`  ${name.padEnd(28)} `)

    try {
      const { hash } = await crawlPage(url)
      const prev = store[url]

      if (!prev) {
        store[url] = { hash, firstSeen: new Date().toISOString(), lastChanged: null }
        console.log('✚ added')
      } else if (prev.hash !== hash) {
        store[url] = { ...prev, hash, lastChanged: new Date().toISOString() }
        console.log('🚨 CHANGED')
        changed++
        await sendChangeAlert(name, url)
      } else {
        console.log('✓ no change')
      }
    } catch (err) {
      console.log(`✗ error — ${err.message}`)
      errors++
    }

    await sleep(DELAY_MS)
  }

  saveStore(store)

  if (isFirstRun) {
    await sendFirstRun(URLS.length)
  } else {
    await sendSummary(URLS.length, changed, errors)
  }

  console.log(`\nDone. ${changed} changed, ${errors} errors.\n`)
}

run().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
