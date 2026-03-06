import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import { SEED_ITEMS, DAILY_DIGEST } from '../data/seedData'
import { fetchUsers, fetchChannelHistory, resolveChannelName, fetchThreadReplies } from '../services/slackService'
import { parseMessages, cleanSlackText, LOOKBACK_MAP } from '../utils/messageParser'
import { summarizeThread, summarizeDashboard, batchSummarizeItems } from '../services/aiService'

const FeedbackContext = createContext()

const PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 }
const ADMIN_CONFIG_KEY = 'suzy-admin-config'
const ITEMS_KEY = 'suzy-items'

function loadPersistedItems() {
  try {
    const raw = localStorage.getItem(ITEMS_KEY)
    if (!raw) return SEED_ITEMS
    const parsed = JSON.parse(raw)
    // Validate it's an array with at least some items
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_ITEMS
  } catch {
    return SEED_ITEMS
  }
}

function loadAdminConfig() {
  try {
    const raw = localStorage.getItem(ADMIN_CONFIG_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function getYourName() {
  const config = loadAdminConfig()
  return config.yourName?.trim() || null
}

export function FeedbackProvider({ children }) {
  const [items, setItems] = useState(loadPersistedItems)
  const [filters, setFilters] = useState({
    type: 'All',
    priority: 'All',
    team: 'All',
    status: 'All',
    search: '',
  })
  const [editModal, setEditModal] = useState(null)
  const [githubModal, setGithubModal] = useState(null)

  // Slack sync state
  const [isLoading, setIsLoading] = useState(false)
  const [syncError, setSyncError] = useState(null)
  const [lastSynced, setLastSynced] = useState(null)
  const [dashboardSummary, setDashboardSummary] = useState(null)

  // Persist items to localStorage so actions survive a page refresh
  useEffect(() => {
    try { localStorage.setItem(ITEMS_KEY, JSON.stringify(items)) } catch {}
  }, [items])

  // Auto-sync from Slack on mount if token is configured
  useEffect(() => {
    if (import.meta.env.VITE_SLACK_TOKEN?.trim()) {
      syncFromSlack()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const updateItem = useCallback((id, updates) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item))
  }, [])

  const dismissItem = useCallback((id) => {
    const dismissedBy = getYourName()
    const dismissedAt = new Date().toISOString()
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, status: 'Dismissed', dismissedBy, dismissedAt } : item
    ))
  }, [])

  const saveForLater = useCallback((id) => {
    const savedBy = getYourName()
    const savedAt = new Date().toISOString()
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, status: 'Saved', savedBy, savedAt } : item
    ))
  }, [])

  const restoreItem = useCallback((id) => {
    setItems(prev => prev.map(item =>
      item.id === id
        ? { ...item, status: 'New', dismissedBy: null, dismissedAt: null, savedBy: null, savedAt: null }
        : item
    ))
  }, [])

  const getItem = useCallback((id) => items.find(item => item.id === id) ?? null, [items])

  // ── Slack sync ──────────────────────────────────────────────────────────────
  const syncFromSlack = useCallback(async () => {
    const config = loadAdminConfig()
    const token = import.meta.env.VITE_SLACK_TOKEN?.trim() || config.slack?.token?.trim()
    const channelLines = (
      import.meta.env.VITE_SLACK_CHANNEL?.trim() ||
      config.slack?.channels?.trim() ||
      ''
    ).split('\n').map(s => s.trim()).filter(Boolean)
    const lookbackKey = config.slack?.lookback ?? '24h'
    const lookbackHours = LOOKBACK_MAP[lookbackKey] ?? 24

    if (!token) {
      setSyncError('No Slack Bot Token configured. Add one in Admin → Slack.')
      return
    }
    if (channelLines.length === 0) {
      setSyncError('No channels configured. Add channel IDs in Admin → Slack.')
      return
    }

    setIsLoading(true)
    setSyncError(null)

    try {
      // users:read scope is optional — fall back to empty map if missing
      let usersMap = new Map()
      try { usersMap = await fetchUsers(token) } catch {}
      const allItems = []
      const errors = []

      for (const line of channelLines) {
        try {
          const channelId = await resolveChannelName(token, line)
          if (!channelId) {
            errors.push(`Could not resolve channel: ${line}`)
            continue
          }
          const messages = await fetchChannelHistory(token, channelId, lookbackHours)
          const channelLabel = line.startsWith('#') ? line : `#${line}`
          // Pass channelId so items know where to fetch their threads
          const parsed = parseMessages(messages, usersMap, channelLabel, channelId)
          allItems.push(...parsed)
        } catch (err) {
          errors.push(`${line}: ${err.message}`)
        }
      }

      if (allItems.length === 0 && errors.length > 0) {
        throw new Error(errors.join(' | '))
      }

      // Fetch thread replies in parallel for any message that has them
      const threaded = allItems.filter(i => i.replyCount > 0 && i.channelId && i.ts)
      await Promise.allSettled(
        threaded.map(async item => {
          try {
            const replyMsgs = await fetchThreadReplies(token, item.channelId, item.ts)
            // replyMsgs[0] is the parent message itself — skip it
            item.threadReplies = replyMsgs
              .slice(1)
              .filter(msg => !msg.bot_id && msg.text?.trim())
              .map(msg => ({
                author: usersMap.get(msg.user) ?? 'Unknown',
                text: cleanSlackText(msg.text, usersMap),
                date: new Date(parseFloat(msg.ts) * 1000).toISOString(),
              }))
          } catch {
            // Thread fetch failure is non-fatal — item still shows without replies
          }
        })
      )

      // AI: generate thread summaries sequentially to avoid rate limiting
      let aiWarning = null
      for (const item of allItems.filter(i => i.threadReplies?.length > 0)) {
        try {
          const summary = await summarizeThread(item.originalMessage, item.threadReplies)
          if (summary) item.threadSummary = summary
        } catch (err) {
          aiWarning = `AI thread summary: ${err.message}`
          console.error('[AI] thread summary error:', err)
          break
        }
      }

      // Merge: preserve manual status + attribution overrides from previous state
      setItems(prev => {
        const prevMap = new Map(prev.map(i => [i.id, i]))
        return allItems.map(item => {
          const old = prevMap.get(item.id)
          if (!old) return item
          return {
            ...item,
            status: old.status ?? item.status,
            dismissedBy: old.dismissedBy ?? null,
            dismissedAt: old.dismissedAt ?? null,
            savedBy: old.savedBy ?? null,
            savedAt: old.savedAt ?? null,
            githubIssueUrl: old.githubIssueUrl ?? null,
            githubIssueNumber: old.githubIssueNumber ?? null,
            threadSummary: item.threadSummary ?? old.threadSummary ?? null,
          }
        })
      })

      // AI: generate clean 1-sentence summaries for each item
      batchSummarizeItems(allItems)
        .then(summaryMap => {
          if (Object.keys(summaryMap).length > 0) {
            setItems(prev => prev.map(item =>
              summaryMap[item.id] ? { ...item, summary: summaryMap[item.id] } : item
            ))
          }
        })
        .catch(err => {
          console.error('[AI] batch summary error:', err)
          setSyncError(`AI summaries failed: ${err.message}`)
        })

      // AI: generate top-level dashboard summary from active items
      const activeItems = allItems.filter(i => i.status === 'New')
      summarizeDashboard(activeItems)
        .then(s => { if (s) setDashboardSummary(s) })
        .catch(err => console.error('[AI] dashboard summary error:', err))

      setLastSynced(new Date())
      const allWarnings = [
        ...(errors.length > 0 ? [`Partial sync — ${errors.join(' | ')}`] : []),
        ...(aiWarning ? [aiWarning] : []),
      ]
      if (allWarnings.length > 0) setSyncError(allWarnings.join(' · '))
    } catch (err) {
      setSyncError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ── Derived state ───────────────────────────────────────────────────────────
  // Base filter (no status — tabs handle that)
  const applyBaseFilters = useCallback((list) => {
    return list
      .filter(item => {
        if (filters.type !== 'All' && item.category !== filters.type) return false
        if (filters.priority !== 'All' && item.priority !== filters.priority) return false
        if (filters.team !== 'All' && item.team !== filters.team) return false
        if (filters.search.trim()) {
          const s = filters.search.trim().toLowerCase()
          const summaryMatch = item.summary.toLowerCase().includes(s)
          const authorMatch = item.author.name.toLowerCase().includes(s)
          const mentionedMatch = item.mentioned.some(m => m.name.toLowerCase().includes(s))
          if (!summaryMatch && !authorMatch && !mentionedMatch) return false
        }
        return true
      })
      .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
  }, [filters])

  const activeItems = useMemo(() =>
    applyBaseFilters(items.filter(i => i.status === 'New' || i.status === 'In Review')),
  [items, applyBaseFilters])

  const savedItems = useMemo(() =>
    applyBaseFilters(items.filter(i => i.status === 'Saved')),
  [items, applyBaseFilters])

  const pushedItems = useMemo(() =>
    applyBaseFilters(items.filter(i => i.status === 'Pushed')),
  [items, applyBaseFilters])

  const dismissedItems = useMemo(() =>
    items.filter(i => i.status === 'Dismissed')
      .sort((a, b) => new Date(b.dismissedAt ?? b.date) - new Date(a.dismissedAt ?? a.date)),
  [items])

  // Legacy: keep filteredItems for anything that still uses it
  const filteredItems = activeItems

  const stats = useMemo(() => ({
    active: items.filter(i => i.status === 'New' || i.status === 'In Review').length,
    saved: items.filter(i => i.status === 'Saved').length,
    high: items.filter(i => i.priority === 'High' && (i.status === 'New' || i.status === 'In Review')).length,
    medium: items.filter(i => i.priority === 'Medium' && (i.status === 'New' || i.status === 'In Review')).length,
    pushed: items.filter(i => i.status === 'Pushed').length,
    dismissed: items.filter(i => i.status === 'Dismissed').length,
  }), [items])

  return (
    <FeedbackContext.Provider
      value={{
        items,
        filteredItems,
        activeItems,
        savedItems,
        pushedItems,
        dismissedItems,
        filters,
        updateFilter,
        updateItem,
        dismissItem,
        saveForLater,
        restoreItem,
        getItem,
        editModal,
        setEditModal,
        githubModal,
        setGithubModal,
        stats,
        digest: DAILY_DIGEST,
        isLoading,
        syncError,
        setSyncError,
        lastSynced,
        syncFromSlack,
        dashboardSummary,
      }}
    >
      {children}
    </FeedbackContext.Provider>
  )
}

export const useFeedback = () => useContext(FeedbackContext)
