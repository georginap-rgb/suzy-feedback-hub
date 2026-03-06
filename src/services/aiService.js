async function ask(prompt) {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `AI request failed (${res.status})`)
  return data.text ?? ''
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
    if (err.message === 'AI not configured') return null
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
    if (err.message === 'AI not configured') return {}
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
