import { getUser } from './_lib/auth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const user = await getUser(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OpenAI API key is not configured on the server.' })
  }

  const { messages, ...opts } = req.body
  console.log(`[AUDIT] ${user.email} → OpenAI (${messages?.length ?? 0} messages)`)

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages, temperature: 0.3, ...opts }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    return res.status(response.status).json({ error: err.error?.message || `OpenAI error (${response.status})` })
  }

  res.json(await response.json())
}
