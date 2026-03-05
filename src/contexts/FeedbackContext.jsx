import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { SEED_ITEMS, DAILY_DIGEST } from '../data/seedData'
import { fetchUsers, fetchChannelHistory, resolveChannelName } from '../services/slackService'
import { parseMessages, LOOKBACK_MAP } from '../utils/messageParser'

const FeedbackContext = createContext()

const PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 }
const ADMIN_CONFIG_KEY = 'suzy-admin-config'

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
  const [items, setItems] = useState(SEED_ITEMS)
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
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, status: 'Saved' } : item
    ))
  }, [])

  const restoreItem = useCallback((id) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, status: 'New', dismissedBy: null, dismissedAt: null } : item
    ))
  }, [])

  const getItem = useCallback((id) => items.find(item => item.id === id) ?? null, [items])

  // ── Slack sync ──────────────────────────────────────────────────────────────
  const syncFromSlack = useCallback(async () => {
    const config = loadAdminConfig()
    const token = config.slack?.token?.trim()
    const channelLines = (config.slack?.channels ?? '').split('\n').map(s => s.trim()).filter(Boolean)
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
      const usersMap = await fetchUsers(token)
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
          const parsed = parseMessages(messages, usersMap, channelLabel)
          allItems.push(...parsed)
        } catch (err) {
          errors.push(`${line}: ${err.message}`)
        }
      }

      if (allItems.length === 0 && errors.length > 0) {
        throw new Error(errors.join(' | '))
      }

      // Merge: preserve any manual status overrides on matched items
      setItems(prev => {
        const statusMap = new Map(prev.map(i => [i.id, i.status]))
        return allItems.map(item => ({
          ...item,
          status: statusMap.get(item.id) ?? item.status,
        }))
      })

      setLastSynced(new Date())
      if (errors.length > 0) setSyncError(`Partial sync — ${errors.join(' | ')}`)
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
      }}
    >
      {children}
    </FeedbackContext.Provider>
  )
}

export const useFeedback = () => useContext(FeedbackContext)
