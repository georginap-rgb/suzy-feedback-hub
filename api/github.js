import { getUser } from './_lib/auth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const user = await getUser(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })

  if (!process.env.GITHUB_TOKEN) {
    return res.status(500).json({ error: 'GitHub token is not configured on the server.' })
  }

  const { type } = req.body

  if (type === 'graphql') {
    const { query, variables } = req.body
    console.log(`[AUDIT] ${user.email} → GitHub GraphQL`)
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    })
    return res.status(response.status).json(await response.json())
  }

  // REST
  const { path, method = 'GET', body: ghBody } = req.body
  if (!path) return res.status(400).json({ error: 'Missing path' })

  console.log(`[AUDIT] ${user.email} → GitHub ${method} ${path}`)

  const response = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: ghBody ? JSON.stringify(ghBody) : undefined,
  })

  const data = await response.json().catch(() => ({}))
  res.status(response.status).json(data)
}
