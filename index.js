import 'dotenv/config'
import { fetchGreenhouseJobs }  from './src/crawlers/greenhouse.js'
import { crawlPage }            from './src/crawler.js'
import { loadJobs, saveJobs, detectNewJobs } from './src/jobStore.js'
import { loadStore, saveStore } from './src/store.js'
import { sendJobAlert, sendChangeAlert, sendSummary, sendFirstRun } from './src/notifier.js'
import { isRelevantJob }        from './src/filter.js'
import { ATS_COMPANIES }        from './src/companies.js'
import { URLS }                 from './src/urls.js'

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function checkSecrets() {
  const token  = process.env.TELEGRAM_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  console.log(`\n🔑 TELEGRAM_TOKEN  : ${token  ? '✓ set (' + token.slice(0,6) + '...)' : '✗ MISSING'}`)
  console.log(`🔑 TELEGRAM_CHAT_ID: ${chatId ? '✓ set (' + chatId + ')' : '✗ MISSING'}\n`)
  if (!token || !chatId) throw new Error('Telegram secrets not set — check GitHub Secrets')

  // Verify Telegram works before crawling
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: '🟢 Job Tracker started — crawling now...', parse_mode: 'HTML' }),
  })
  const body = await res.json()
  if (!res.ok) throw new Error(`Telegram failed: ${JSON.stringify(body)}`)
  console.log('✓ Telegram working\n')
}

// ─── Greenhouse Companies ─────────────────────────────────────────────────────

async function runGreenhouse() {
  const ghCompanies = ATS_COMPANIES.filter(c => c.type === 'greenhouse')
  console.log(`\n🏢 Greenhouse API — ${ghCompanies.length} companies\n`)

  const jobStore = loadJobs()
  const isFirstRun = Object.keys(jobStore).length === 0
  let totalNew = 0
  let errors = 0

  for (const { name, slug } of ghCompanies) {
    process.stdout.write(`  ${name.padEnd(26)} `)

    try {
      const jobs = await fetchGreenhouseJobs(slug)
      const key = `greenhouse:${slug}`
      const newJobs = detectNewJobs(jobStore, key, jobs)
      const relevant = newJobs.filter(j => isRelevantJob(j.title))

      if (isFirstRun) {
        console.log(`✚ ${jobs.length} jobs stored`)
      } else if (relevant.length > 0) {
        console.log(`🚨 ${relevant.length} NEW`)
        totalNew += relevant.length
        await sendJobAlert(name, relevant, 'greenhouse', slug)
      } else {
        console.log(`✓ ${jobs.length} jobs, no change`)
      }
    } catch (err) {
      console.log(`✗ ${err.message.slice(0, 50)}`)
      errors++
    }

    await sleep(600)
  }

  saveJobs(jobStore)
  return { totalNew, errors, isFirstRun }
}

// ─── Custom Career Pages ──────────────────────────────────────────────────────

async function runCustom() {
  console.log(`\n🌐 Custom Pages — ${URLS.length} pages\n`)
  const store = loadStore()
  let changed = 0
  let errors = 0

  for (const { name, url } of URLS) {
    process.stdout.write(`  ${name.padEnd(26)} `)

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
      console.log(`✗ ${err.message.slice(0, 50)}`)
      errors++
    }

    await sleep(2000)
  }

  saveStore(store)
  return { changed, errors }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('━'.repeat(52))
  console.log('  Job Tracker')
  console.log('━'.repeat(52))

  await checkSecrets()

  const gh     = await runGreenhouse()
  const custom = await runCustom()

  const totalNew    = gh.totalNew + custom.changed
  const totalErrors = gh.errors + custom.errors

  if (gh.isFirstRun) {
    await sendFirstRun(ATS_COMPANIES.length, URLS.length)
  } else {
    await sendSummary(ATS_COMPANIES.length, URLS.length, totalNew, totalErrors)
  }

  console.log('\n' + '━'.repeat(52))
  console.log(`  Done. ${totalNew} new. ${totalErrors} errors.`)
  console.log('━'.repeat(52) + '\n')
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
