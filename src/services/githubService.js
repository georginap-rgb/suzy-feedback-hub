async function ghFetch(_token, path, options = {}) {
  const res = await fetch('/api/github', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'rest',
      path,
      method: options.method || 'GET',
      body: options.body ? JSON.parse(options.body) : undefined,
    }),
  })

  if (res.status === 401) throw new Error('Session expired — please sign in again.')
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const MESSAGES = {
      401: 'Invalid GitHub token — contact your admin.',
      403: 'Access forbidden — token needs "repo" and "project" scopes.',
      404: 'Not found — check the repo name and that your token has repo access.',
      422: 'Validation error — ' + (err.message ?? 'check issue fields.'),
    }
    throw new Error(MESSAGES[res.status] ?? err.message ?? `GitHub error: ${res.status}`)
  }

  return res.json()
}

async function ghGraphQL(_token, query, variables = {}) {
  const res = await fetch('/api/github', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'graphql', query, variables }),
  })

  if (res.status === 401) throw new Error('Session expired — please sign in again.')
  if (!res.ok) throw new Error(`GitHub GraphQL error: ${res.status}`)

  const data = await res.json()
  if (data.errors?.length) throw new Error(data.errors[0].message)

  return data.data
}

/** Validate token. Returns { login, name }. */
export async function testGitHubAuth(token) {
  const data = await ghFetch(token, '/user')
  return { login: data.login, name: data.name ?? data.login }
}

/**
 * Search the repo for code files relevant to the feedback text.
 * Returns up to 5 results: { name, path, url }.
 */
export async function searchRepoContext(token, repo, feedbackText) {
  const STOP = new Set([
    'this', 'that', 'with', 'from', 'have', 'will', 'when', 'they', 'been', 'some',
    'into', 'more', 'also', 'than', 'then', 'them', 'their', 'there', 'what', 'which',
    'your', 'just', 'about', 'after', 'before', 'could', 'would', 'should', 'these',
    'getting', 'using', 'being', 'going', 'doing', 'think', 'know', 'need',
  ])
  const keywords = feedbackText
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 4 && !STOP.has(w))
    .slice(0, 5)
    .join(' ')

  if (!keywords) return []

  try {
    const q = encodeURIComponent(`${keywords} repo:${repo}`)
    const data = await ghFetch(token, `/search/code?q=${q}&per_page=5`)
    return (data.items ?? []).map(item => ({
      name: item.name,
      path: item.path,
      url: item.html_url,
    }))
  } catch {
    return [] // search failures are non-fatal
  }
}

/**
 * Create a GitHub issue.
 * Returns { number, url, nodeId }.
 */
export async function createIssue(token, repo, { title, body, labels, assignees }) {
  const data = await ghFetch(token, `/repos/${repo}/issues`, {
    method: 'POST',
    body: JSON.stringify({
      title,
      body,
      labels: labels.filter(Boolean),
      assignees: assignees.map(h => h.replace(/^@/, '')).filter(Boolean),
    }),
  })
  return { number: data.number, url: data.html_url, nodeId: data.node_id }
}

/**
 * Add a GitHub issue to a Projects v2 board via GraphQL.
 * org: string, projectNumber: number
 */
export async function addIssueToProject(token, org, projectNumber, issueNodeId) {
  const projectData = await ghGraphQL(token, `
    query($org: String!, $number: Int!) {
      organization(login: $org) {
        projectV2(number: $number) { id }
      }
    }
  `, { org, number: projectNumber })

  const projectId = projectData?.organization?.projectV2?.id
  if (!projectId) throw new Error('Could not find project — check project number and token permissions.')

  await ghGraphQL(token, `
    mutation($projectId: ID!, $contentId: ID!) {
      addProjectV2ItemById(input: { projectId: $projectId, contentId: $contentId }) {
        item { id }
      }
    }
  `, { projectId, contentId: issueNodeId })
}
