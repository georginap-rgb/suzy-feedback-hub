import { getUser } from './_lib/auth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const user = await getUser(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })

  if (!process.env.SLACK_TOKEN) {
    return res.status(500).json({ error: 'Slack token is not configured on the server.' })
  }

  const { method, body: slackBody = {} } = req.body
  if (!method) return res.status(400).json({ error: 'Missing Slack method' })

  console.log(`[AUDIT] ${user.email} → Slack ${method}`)

  const response = await fetch(`https://slack.com/api/${method}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.SLACK_TOKEN}`,
    },
    body: JSON.stringify(slackBody),
  })

  res.json(await response.json())
}
