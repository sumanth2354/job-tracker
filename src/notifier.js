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
      disable_web_page_preview: false,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    console.error('Telegram error:', err)
  }
}

export async function sendChangeAlert(name, url) {
  await send(
    `🚨 <b>Career Page Updated!</b>\n\n` +
    `🏢 <b>Company:</b> ${name}\n` +
    `🔗 <b>URL:</b> ${url}\n\n` +
    `The career page content has changed — likely new job openings!\n\n` +
    `👉 <a href="${url}">Visit Career Page Now</a>`
  )
}

export async function sendSummary(total, changed, errors) {
  const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
  await send(
    `📊 <b>Crawl Complete</b>\n\n` +
    `✅ Checked: ${total} pages\n` +
    `🚨 Changed: ${changed}\n` +
    `❌ Errors: ${errors}\n` +
    `🕐 ${now} IST`
  )
}

export async function sendFirstRun(total) {
  await send(
    `🎉 <b>Job Tracker is Live!</b>\n\n` +
    `Now monitoring <b>${total}</b> startup career pages.\n` +
    `You'll get an alert the moment any page changes.\n\n` +
    `Next check: tomorrow 6:00 AM IST`
  )
}
