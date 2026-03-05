import { detectTeam } from './teamDetection'

// ── Text cleaning ─────────────────────────────────────────────────────────────

/** Replace <@USERID> with @displayName using the users map */
function resolveMentionTokens(text, usersMap) {
  return text.replace(/<@([A-Z0-9]+)>/g, (_, id) => `@${usersMap.get(id) ?? id}`)
}

/** Strip all Slack mrkdwn / special tokens, decode HTML entities */
export function cleanSlackText(text, usersMap) {
  return text
    .replace(/<@([A-Z0-9]+)>/g, (_, id) => `@${usersMap.get(id) ?? id}`)   // user mentions
    .replace(/<#([A-Z0-9]+)\|([^>]+)>/g, '#$2')                             // channel refs
    .replace(/<([^|>]+)\|([^>]+)>/g, '$2')                                  // links with label
    .replace(/<([^>]+)>/g, '$1')                                             // bare URLs
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\*([^*]+)\*/g, '$1')                                           // bold
    .replace(/_([^_]+)_/g, '$1')                                             // italic
    .replace(/~([^~]+)~/g, '$1')                                             // strikethrough
    .replace(/`{3}[^`]*`{3}/gs, '[code block]')                             // code blocks
    .replace(/`([^`]+)`/g, '$1')                                             // inline code
    .trim()
}

// ── Mention extraction ────────────────────────────────────────────────────────

function getInitials(name) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

/** Extract unique mentioned users from raw Slack text */
export function extractMentions(rawText, usersMap, authorId) {
  const matches = [...rawText.matchAll(/<@([A-Z0-9]+)>/g)]
  const seen = new Set([authorId]) // exclude author from mentioned list
  return matches
    .filter(([, id]) => {
      if (seen.has(id)) return false
      seen.add(id)
      return true
    })
    .map(([, id]) => {
      const name = usersMap.get(id) ?? id
      return { name, initials: getInitials(name) }
    })
}

// ── Category detection ────────────────────────────────────────────────────────

const BUG_KW = [
  'error', 'broken', 'not work', "doesn't work", "isn't work", 'failing', 'failed',
  'crash', 'crashed', 'bug', 'wrong', 'incorrect', 'loop', 'stall', 'stalling',
  'not load', 'not showing', 'blank', 'missing', 'stuck', 'getting an error',
  'login loop', 'not chang', 'does not change', 'not updat',
]

const FEATURE_KW = [
  'feature', 'add', 'could we', 'can we', 'would be nice', 'would love',
  'suggestion', 'request', 'swap', 'replace', 'redirect', 'retrain',
  'consolidate', 'worth', 'evaluate', 'should we', 'opportunity',
  'what if', 'consider', 'came across',
]

const PROCESS_KW = [
  'process', 'access', 'how do we', 'centralized', 'centralised', 'documentation',
  'where do we', 'workflow', 'who owns', 'permission', 'who should',
  'get access', 'could i get', 'do we have', 'shared place', 'place where',
]

function scoreKeywords(text, keywords) {
  const lower = text.toLowerCase()
  return keywords.filter(kw => lower.includes(kw)).length
}

export function detectCategory(text) {
  const bugScore = scoreKeywords(text, BUG_KW)
  const featureScore = scoreKeywords(text, FEATURE_KW)
  const processScore = scoreKeywords(text, PROCESS_KW)

  const max = Math.max(bugScore, featureScore, processScore)
  if (max === 0) return 'Bug Report' // default
  if (bugScore === max) return 'Bug Report'
  if (featureScore === max) return 'Feature Request'
  return 'Process Issue'
}

// ── Priority detection ────────────────────────────────────────────────────────

const HIGH_KW = [
  'urgent', 'critical', 'blocking', 'blocker', 'production', ' prod ',
  'emergency', 'asap', 'immediately', 'not scal', 'will not scale',
  'stall', 'crash', 'down', 'outage', 'broken in prod', 'breaking', 'qa blocked',
]

const LOW_KW = [
  'nice to have', 'low priority', 'when you have time', 'no rush',
  'worth discussing', 'evaluate', 'came across', 'could be useful',
  'future', 'eventually', 'someday', 'suggestion',
]

export function detectPriority(text) {
  const highScore = scoreKeywords(text, HIGH_KW)
  const lowScore = scoreKeywords(text, LOW_KW)

  if (highScore >= 1) return 'High'
  if (lowScore >= 1) return 'Low'
  return 'Medium'
}

// ── Summary generation ────────────────────────────────────────────────────────

/** Take the first 1-2 meaningful sentences, cap at 160 chars */
export function generateSummary(cleanText) {
  const text = cleanText
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // Split on sentence-ending punctuation
  const parts = text.split(/(?<=[.!?])\s+/)
  let summary = ''
  for (const part of parts) {
    if ((summary + part).length > 160) break
    summary += (summary ? ' ' : '') + part
    if (summary.length >= 60) break // at least one sentence worth
  }

  if (!summary) summary = text

  if (summary.length > 160) return summary.slice(0, 157) + '…'
  return summary
}

// ── Full message parser ───────────────────────────────────────────────────────

const LOOKBACK_MAP = { '24h': 24, '48h': 48, '7d': 168 }

/**
 * Convert raw Slack API messages into feedback items.
 *
 * @param {object[]} messages  - raw messages from conversations.history
 * @param {Map}      usersMap  - userId → displayName from fetchUsers()
 * @param {string}   channelName - '#tech_team_all' or channel ID
 * @returns {object[]} feedback items matching the app schema
 */
export function parseMessages(messages, usersMap, channelName) {
  return messages
    .filter(msg =>
      msg.type === 'message' &&
      !msg.subtype &&          // skip joins, topic changes, etc.
      !msg.bot_id &&           // skip bot messages
      msg.text?.trim().length > 20  // skip very short messages
    )
    .map(msg => {
      const authorName = usersMap.get(msg.user) ?? 'Unknown'
      const mentioned = extractMentions(msg.text, usersMap, msg.user)
      const clean = cleanSlackText(msg.text, usersMap)
      const category = detectCategory(clean)
      const priority = detectPriority(clean)
      const team = detectTeam(clean)
      const date = new Date(parseFloat(msg.ts) * 1000).toISOString()

      return {
        id: msg.ts.replace('.', '-'),
        date,
        channel: channelName,
        category,
        priority,
        status: 'New',
        team,
        summary: generateSummary(clean),
        author: { name: authorName, initials: getInitials(authorName) },
        mentioned,
        originalMessage: clean,
      }
    })
    .sort((a, b) => {
      const ORDER = { High: 0, Medium: 1, Low: 2 }
      return ORDER[a.priority] - ORDER[b.priority]
    })
}

export { LOOKBACK_MAP }
