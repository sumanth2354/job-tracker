export async function fetchGreenhouseJobs(slug) {
  const res = await fetch(
    `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`,
    { signal: AbortSignal.timeout(15000) }
  )
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return (data.jobs || []).map(job => ({
    id: String(job.id),
    title: job.title,
    location: job.location?.name || 'Not specified',
    url: job.absolute_url,
    postedAt: job.updated_at || null,
    department: job.departments?.[0]?.name || '',
  }))
}
