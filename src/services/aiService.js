const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'

function getKey() {
  return import.meta.env.VITE_OPENAI_API_KEY?.trim() ?? ''
}

export function hasOpenAIKey() {
  return Boolean(getKey())
}

async function post(messages, opts = {}) {
  const apiKey = getKey()
  if (!apiKey) return null

  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages, temperature: 0.3, ...opts }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `OpenAI error (${res.status})`)
  }

  const data = await res.json()
  return data.choices[0]?.message?.content?.trim() ?? ''
}

async function ask(prompt) {
  return post([{ role: 'user', content: prompt }])
}

/** Test the API key with a minimal call. Throws with a clear message on failure. */
export async function testConnection() {
  const apiKey = getKey()
  if (!apiKey) throw new Error('No API key in this build — update VITE_OPENAI_API_KEY in GitHub secrets and redeploy')
  const reply = await post(
    [{ role: 'user', content: 'Reply with the single word "ok"' }],
    { temperature: 0, max_tokens: 5 }
  )
  if (!reply) throw new Error('Empty response from OpenAI')
  return 'Connected — gpt-4o-mini is responding correctly'
}

/** Classify a batch of ≤20 items, returning the Set of IDs that are genuine product feedback. */
async function classifyBatch(items) {
  const apiKey = getKey()
  if (!apiKey) return new Set(items.map(i => i.id))

  const numbered = items.map((item, i) => `${i + 1}. ${item.text.slice(0, 250)}`).join('\n\n')

  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0,
      max_tokens: 60,
      messages: [{
        role: 'user',
        content: `You are filtering Slack messages from a product team. Identify which are genuine product feedback: bug reports, feature requests, UX/usability issues, or internal process problems.

EXCLUDE: chit-chat, greetings, emoji-only messages, links to articles or news with no discussion, announcements, meeting notes, and off-topic conversations.

Reply with ONLY the numbers of feedback messages, comma-separated (e.g. "1,3,5"), or "none" if there are none.

Messages:
${numbered}`,
      }],
    }),
  })

  if (!res.ok) return new Set(items.map(i => i.id)) // fallback: keep all

  const data = await res.json()
  const raw = (data.choices[0]?.message?.content ?? '').trim().toLowerCase()

  if (raw === 'none') return new Set()

  const kept = new Set()
  for (const n of raw.split(',')) {
    const idx = parseInt(n.trim(), 10) - 1
    if (idx >= 0 && idx < items.length) kept.add(items[idx].id)
  }
  // If the response was garbled and nothing parsed, fall back to keeping all
  return kept.size > 0 ? kept : new Set(items.map(i => i.id))
}

/**
 * Use AI to filter a list of items down to genuine product feedback.
 * Falls back to keeping all items if the API key is missing or the call fails.
 * @param {{ id: string, text: string }[]} items
 * @returns {Promise<Set<string>>} IDs of items to keep
 */
export async function classifyFeedback(items) {
  if (!items.length) return new Set()
  const BATCH = 20
  const kept = new Set()
  for (let i = 0; i < items.length; i += BATCH) {
    const chunk = items.slice(i, i + BATCH)
    const chunkKept = await classifyBatch(chunk)
    for (const id of chunkKept) kept.add(id)
  }
  return kept
}

/**
 * Summarise a Slack thread into a structured object with discussion, gaps, and participants.
 * Returns null if AI is not configured or call fails.
 * @returns {{ discussion: string, gaps: string|null, participants: string[] } | null}
 */
export async function summarizeThread(originalMessage, replies) {
  const replyText = replies.length > 0
    ? replies.map(r => `${r.author}: ${r.text}`).join('\n')
    : ''

  const fullThread = replyText
    ? `Original message:\n${originalMessage}\n\nReplies:\n${replyText}`
    : `Message:\n${originalMessage}`

  try {
    const raw = await ask(
      `Analyze this Slack product team thread and return a JSON object with exactly these keys:
- "discussion": 1-2 sentences summarizing what was discussed or requested
- "gaps": 1 sentence on unresolved questions or next steps (null if fully resolved)
- "participants": array of unique participant names mentioned in the thread

Return ONLY valid JSON, nothing else.\n\n${fullThread}`
    )
    if (!raw) return null
    const cleaned = raw.replace(/^```(?:json)?\n?|\n?```$/g, '').trim()
    try {
      const parsed = JSON.parse(cleaned)
      return {
        discussion: parsed.discussion ?? null,
        gaps: parsed.gaps ?? null,
        participants: Array.isArray(parsed.participants) ? parsed.participants : [],
      }
    } catch {
      return { discussion: cleaned.slice(0, 300), gaps: null, participants: [] }
    }
  } catch (err) {
    throw new Error(`Thread summary failed: ${err.message}`)
  }
}

/**
 * Generate clean 1-sentence AI summaries for a batch of feedback items.
 * Returns a map of item id → summary string.
 */
export async function batchSummarizeItems(items) {
  if (items.length === 0) return {}

  const numbered = items
    .map((item, i) => `${i + 1}. ${item.originalMessage.slice(0, 400)}`)
    .join('\n\n')

  try {
    const raw = await ask(
      `You are a product manager assistant. For each Slack message below, write exactly 1 sentence that clearly states: what the feedback is about, who/what is affected, and what action or decision is needed. Be specific and professional. Write in third person.

Example: "The login flow has a redirect loop after password reset that is blocking multiple users and needs immediate investigation."

Return ONLY a numbered list matching the input numbers, one item per line, no extra text.\n\n${numbered}`
    )
    if (!raw) return {}
    const entries = raw.split(/\n(?=\d+\.)/)
    const map = {}
    for (const entry of entries) {
      const match = entry.match(/^(\d+)\.\s*([\s\S]+)/)
      if (match) {
        const idx = parseInt(match[1]) - 1
        const text = match[2].replace(/\s+/g, ' ').trim()
        if (idx >= 0 && idx < items.length && text) {
          map[items[idx].id] = text
        }
      }
    }
    return map
  } catch (err) {
    throw new Error(`Item summaries failed: ${err.message}`)
  }
}

/**
 * Generate a top-level summary of all active feedback items.
 * Returns null if AI is not configured or call fails.
 */
export async function summarizeDashboard(items) {
  if (items.length === 0) return null

  const bullets = items
    .slice(0, 30)
    .map(i => `- [${i.priority}] ${i.category}: ${i.summary}`)
    .join('\n')

  try {
    return await ask(
      `You are summarising open product feedback for a PM team. Below are the active feedback items. Write 2-3 sentences covering the main themes, most urgent issues, and any patterns. Be direct and actionable. No preamble.\n\n${bullets}`
    )
  } catch {
    return null
  }
}
