const SLACK_API = 'https://slack.com/api'

async function slackPost(token, method, body = {}) {
  const res = await fetch(`${SLACK_API}/${method}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) throw new Error(`HTTP ${res.status} from Slack`)

  const data = await res.json()
  if (!data.ok) {
    // Map common Slack errors to helpful messages
    const MESSAGES = {
      invalid_auth: 'Invalid Slack token — check your Bot Token in Admin → Slack.',
      not_authed: 'No Slack token provided — add a Bot Token in Admin → Slack.',
      channel_not_found: 'Channel not found. Make sure you\'re using the channel ID (e.g. C08XXXXXXX), not the name.',
      missing_scope: 'Bot token is missing required scopes. Needs: channels:history, channels:read, users:read.',
      account_inactive: 'Slack account or token is inactive.',
      token_revoked: 'Slack token has been revoked — generate a new one.',
    }
    throw new Error(MESSAGES[data.error] ?? `Slack error: ${data.error}`)
  }

  return data
}

/** Test that a token is valid. Returns { user, team }. */
export async function testAuth(token) {
  const data = await slackPost(token, 'auth.test')
  return { user: data.user, team: data.team, userId: data.user_id }
}

/**
 * Fetch all (non-bot, non-deleted) workspace members.
 * Returns a Map of { userId → displayName }.
 */
export async function fetchUsers(token) {
  const map = new Map()
  let cursor = undefined

  do {
    const body = { limit: 200 }
    if (cursor) body.cursor = cursor

    const data = await slackPost(token, 'users.list', body)

    for (const member of data.members ?? []) {
      if (member.deleted || member.is_bot || member.id === 'USLACKBOT') continue
      const display =
        member.profile?.display_name_normalized ||
        member.profile?.display_name ||
        member.profile?.real_name_normalized ||
        member.real_name ||
        member.name
      map.set(member.id, display)
    }

    cursor = data.response_metadata?.next_cursor
  } while (cursor)

  return map
}

/**
 * List all channels the bot can see.
 * Returns [{ id, name }].
 */
export async function listChannels(token) {
  const channels = []
  let cursor = undefined

  do {
    const body = { types: 'public_channel,private_channel', limit: 200, exclude_archived: true }
    if (cursor) body.cursor = cursor

    const data = await slackPost(token, 'conversations.list', body)
    for (const ch of data.channels ?? []) {
      channels.push({ id: ch.id, name: ch.name })
    }
    cursor = data.response_metadata?.next_cursor
  } while (cursor)

  return channels
}

/**
 * Fetch messages from a channel within the lookback window.
 * channelIdOrName: can be a channel ID (C08...) or resolved via listChannels.
 * lookbackHours: 24 | 48 | 168 (7d)
 */
export async function fetchChannelHistory(token, channelId, lookbackHours = 24) {
  const oldest = Math.floor(Date.now() / 1000) - lookbackHours * 3600
  const messages = []
  let cursor = undefined

  do {
    const body = { channel: channelId, oldest: String(oldest), limit: 100, inclusive: false }
    if (cursor) body.cursor = cursor

    const data = await slackPost(token, 'conversations.history', body)
    messages.push(...(data.messages ?? []))
    cursor = data.has_more ? data.response_metadata?.next_cursor : undefined
  } while (cursor)

  return messages
}

/**
 * Fetch all replies in a thread.
 * Returns the full array including the parent message (index 0).
 * Callers should skip index 0 if they already have the parent.
 */
export async function fetchThreadReplies(token, channelId, threadTs) {
  const messages = []
  let cursor = undefined

  do {
    const body = { channel: channelId, ts: threadTs, limit: 100 }
    if (cursor) body.cursor = cursor

    const data = await slackPost(token, 'conversations.replies', body)
    messages.push(...(data.messages ?? []))
    cursor = data.has_more ? data.response_metadata?.next_cursor : undefined
  } while (cursor)

  return messages
}

/** Resolve a channel name (#tech_team_all) to its ID. Returns null if not found. */
export async function resolveChannelName(token, nameOrId) {
  // If it looks like an ID already, return as-is
  if (/^[CGD][A-Z0-9]+$/.test(nameOrId)) return nameOrId

  const clean = nameOrId.replace(/^#/, '').toLowerCase()
  const channels = await listChannels(token)
  const match = channels.find(c => c.name.toLowerCase() === clean)
  return match?.id ?? null
}
