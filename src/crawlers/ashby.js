const QUERY = `
query jobBoard($organizationHostedJobsPageName: String!) {
  jobBoard: jobBoardWithTeams(organizationHostedJobsPageName: $organizationHostedJobsPageName) {
    teams {
      name
      jobPostings {
        id
        title
        locationName
        employmentType
        isRemote
        externalLink
      }
    }
  }
}`

export async function fetchAshbyJobs(slug) {
  const res = await fetch('https://jobs.ashbyhq.com/api/non-user-graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operationName: 'jobBoard',
      query: QUERY,
      variables: { organizationHostedJobsPageName: slug },
    }),
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  const teams = data.data?.jobBoard?.teams || []
  return teams.flatMap(team =>
    (team.jobPostings || []).map(job => ({
      id: job.id,
      title: job.title,
      location:
        job.locationName || (job.isRemote ? 'Remote' : 'Not specified'),
      url:
        job.externalLink ||
        `https://jobs.ashbyhq.com/${slug}/${job.id}`,
      postedAt: null,
      department: team.name || '',
    }))
  )
}
