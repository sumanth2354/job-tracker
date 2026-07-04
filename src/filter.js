// Jobs matching DEV_KEYWORDS are always alerted.
// Jobs matching only SKIP_KEYWORDS (no dev overlap) are silently ignored.
// You can set FILTER_ENABLED=false in .env to get ALL job alerts.

const DEV_KEYWORDS = [
  'engineer', 'developer', 'software', 'sde', 'swe', 'backend', 'frontend',
  'full stack', 'fullstack', 'devops', 'sre', 'platform', 'infrastructure',
  'data', 'ml ', 'ai ', 'machine learning', 'deep learning', 'intern',
  'mobile', 'ios', 'android', 'web ', 'api', 'cloud', 'security', 'qa',
  'test', 'architect', 'tech lead', 'product engineer', 'founding engineer',
  'generalist', 'python', 'node', 'react', 'java ', 'golang', 'rust',
]

const SKIP_KEYWORDS = [
  'sales', 'account executive', 'account manager', 'marketing',
  'recruiter', 'recruiting', 'talent acquisition', 'legal', 'counsel',
  'accountant', 'accounting', 'controller', 'finance manager',
  'human resources', 'office manager', 'executive assistant',
  'content writer', 'copywriter', 'brand ', 'pr manager',
  'customer success manager', 'customer support', 'support specialist',
  'business development', 'partnerships', 'public relations',
]

const FILTER_ENABLED = process.env.FILTER_JOBS !== 'false'

export function isRelevantJob(title) {
  if (!FILTER_ENABLED) return true
  const t = title.toLowerCase()
  const isDev = DEV_KEYWORDS.some(k => t.includes(k))
  if (isDev) return true
  const isSkip = SKIP_KEYWORDS.some(k => t.includes(k))
  return !isSkip
}
