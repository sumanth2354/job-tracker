import { createHash } from 'crypto'
import * as cheerio from 'cheerio'
import { chromium } from 'playwright'

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return await res.text()
}

async function fetchWithPlaywright(url) {
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage()
    await page.setExtraHTTPHeaders({ 'User-Agent': USER_AGENT })
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(2000)
    return await page.content()
  } finally {
    await browser.close()
  }
}

function extractText(html) {
  const $ = cheerio.load(html)
  $('script, style, nav, header, footer, noscript, iframe, svg').remove()

  // Prefer career-specific containers
  const selectors = [
    '[class*="career"]', '[id*="career"]',
    '[class*="job"]',    '[id*="job"]',
    '[class*="opening"]','[id*="opening"]',
    '[class*="position"]',
    'main', 'article', '#content', '.content',
  ]

  for (const sel of selectors) {
    const el = $(sel).first()
    if (el.length && el.text().trim().length > 80) {
      return el.text().replace(/\s+/g, ' ').trim().slice(0, 6000)
    }
  }

  return $('body').text().replace(/\s+/g, ' ').trim().slice(0, 6000)
}

export async function crawlPage(url) {
  let html
  let usedPlaywright = false

  try {
    html = await fetchHtml(url)
    const quick = extractText(html)
    // If content is too thin, page is likely JS-rendered
    if (quick.length < 80) {
      html = await fetchWithPlaywright(url)
      usedPlaywright = true
    }
  } catch {
    html = await fetchWithPlaywright(url)
    usedPlaywright = true
  }

  const text = extractText(html)
  const hash = createHash('md5').update(text).digest('hex')

  return { hash, text, usedPlaywright }
}
