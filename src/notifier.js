const TOKEN = process.env.TELEGRAM_TOKEN
const CHAT_ID = process.env.TELEGRAM_CHAT_ID

async function send(text) {
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  })
  if (!res.ok) console.error('Telegram error:', await res.text())
}

export async function sendJobAlert(companyName, newJobs, atsType, slug) {
  if (newJobs.length === 0) return

  const boardUrl =
    atsType === 'greenhouse' ? `https://boards.greenhouse.io/${slug}`
    : atsType === 'lever'    ? `https://jobs.lever.co/${slug}`
    : atsType === 'ashby'    ? `https://jobs.ashbyhq.com/${slug}`
    : null

  if (newJobs.length === 1) {
    const job = newJobs[0]
    await send(
      `🚨 <b>New Job at ${companyName}!</b>\n\n` +
      `💼 <b>${job.title}</b>\n` +
      `📍 ${job.location}` +
      (job.department ? `\n🏷️ ${job.department}` : '') +
      `\n\n👉 <a href="${job.url}">Apply Now</a>`
    )
  } else {
    const list = newJobs
      .slice(0, 8)
      .map((j, i) => `${i + 1}. <b>${j.title}</b>\n   📍 ${j.location}`)
      .join('\n\n')

    const more = newJobs.length > 8 ? `\n\n+${newJobs.length - 8} more...` : ''

    await send(
      `🚨 <b>${newJobs.length} New Jobs at ${companyName}!</b>\n\n` +
      list + more +
      (boardUrl ? `\n\n👉 <a href="${boardUrl}">View All Openings</a>` : '')
    )
  }
}

export async function sendChangeAlert(name, url) {
  await send(
    `🔔 <b>Career Page Changed!</b>\n\n` +
    `🏢 <b>${name}</b>\n` +
    `The page content has been updated — likely new openings!\n\n` +
    `👉 <a href="${url}">Visit Career Page</a>`
  )
}

export async function sendSummary(atsChecked, customChecked, newJobs, errors) {
  const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
  await send(
    `📊 <b>Daily Crawl Done</b>\n\n` +
    `🏢 ATS companies: ${atsChecked}\n` +
    `🌐 Custom pages: ${customChecked}\n` +
    `🆕 New jobs found: <b>${newJobs}</b>\n` +
    `❌ Errors: ${errors}\n` +
    `🕐 ${now} IST`
  )
}

export async function sendFirstRun(atsCount, customCount) {
  await send(
    `🎉 <b>Job Tracker is Live!</b>\n\n` +
    `Now monitoring:\n` +
    `🏢 <b>${atsCount}</b> companies via ATS APIs\n` +
    `🌐 <b>${customCount}</b> custom career pages\n\n` +
    `You'll get instant alerts when new jobs are posted.\n` +
    `Runs every day at <b>6 AM</b> and <b>12 PM IST</b>.`
  )
}
