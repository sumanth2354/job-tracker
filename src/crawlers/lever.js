export async function fetchLeverJobs(slug) {
  const res = await fetch(
    `https://api.lever.co/v0/postings/${slug}?mode=json`,
    { signal: AbortSignal.timeout(15000) }
  )
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const jobs = await res.json()
  if (!Array.isArray(jobs)) throw new Error('Unexpected response')
  return jobs.map(job => ({
    id: job.id,
    title: job.text,
    location:
      job.categories?.location ||
      job.categories?.allLocations?.[0] ||
      'Not specified',
    url: job.hostedUrl,
    postedAt: job.createdAt ? new Date(job.createdAt).toISOString() : null,
    department: job.categories?.team || job.categories?.department || '',
  }))
}
