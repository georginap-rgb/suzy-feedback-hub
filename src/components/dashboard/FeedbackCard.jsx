import { useState } from 'react'
import { useFeedback } from '../../contexts/FeedbackContext'
import Avatar from '../shared/Avatar'

const PRIORITY_STYLES = {
  High: {
    border: 'border-l-red-500',
    badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  },
  Medium: {
    border: 'border-l-amber-500',
    badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  },
  Low: {
    border: 'border-l-green-500',
    badge: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  },
}

const TEAM_STYLES = {
  intelligence: 'text-violet-600 dark:text-violet-400',
  insights: 'text-blue-600 dark:text-blue-400',
  impact: 'text-orange-600 dark:text-orange-400',
  data: 'text-teal-600 dark:text-teal-400',
}

const STATUS_STYLES = {
  New: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  'In Review': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  Pushed: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400',
  Dismissed: 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600',
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default function FeedbackCard({ item }) {
  const [expanded, setExpanded] = useState(false)
  const { setEditModal, setGithubModal, dismissItem } = useFeedback()

  const priorityStyles = PRIORITY_STYLES[item.priority] ?? PRIORITY_STYLES.Medium
  const teamStyle = TEAM_STYLES[item.team] ?? TEAM_STYLES.data
  const statusStyle = STATUS_STYLES[item.status] ?? STATUS_STYLES.New

  const isDismissed = item.status === 'Dismissed'

  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 border-l-4 ${priorityStyles.border} overflow-hidden transition-opacity ${isDismissed ? 'opacity-50' : ''}`}
    >
      {/* Card header */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-start justify-between gap-3 mb-3">
          {/* Left: category + priority */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              {item.category}
            </span>
            <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold ${priorityStyles.badge}`}>
              {item.priority}
            </span>
            <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${statusStyle}`}>
              {item.status}
            </span>
          </div>
          {/* Right: team + date */}
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-xs font-semibold uppercase tracking-wider ${teamStyle}`}>
              {item.team}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-600 hidden sm:block">
              {formatDate(item.date)}
            </span>
          </div>
        </div>

        {/* Summary */}
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-relaxed mb-4">
          {item.summary}
        </p>

        {/* Author */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-gray-400 dark:text-gray-500 w-[72px] shrink-0">Posted by</span>
          <div className="flex items-center gap-1.5">
            <Avatar name={item.author.name} size="sm" />
            <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">{item.author.name}</span>
          </div>
        </div>

        {/* Mentioned */}
        {item.mentioned.length > 0 && (
          <div className="flex items-start gap-2 mb-1">
            <span className="text-xs text-gray-400 dark:text-gray-500 w-[72px] shrink-0 mt-0.5">Mentioned</span>
            <div className="flex items-center gap-2 flex-wrap">
              {item.mentioned.map((person, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <Avatar name={person.name} size="sm" />
                  <span className="text-xs text-gray-700 dark:text-gray-300">{person.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Collapsible original message */}
      <div className="px-5 pb-1">
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors py-1"
        >
          <svg
            className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span>{expanded ? 'Hide' : 'Show'} original Slack message</span>
        </button>

        {expanded && (
          <div className="mt-1.5 mb-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap font-mono">
              {item.originalMessage}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditModal(item.id)}
            disabled={isDismissed}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Edit
          </button>
          <button
            onClick={() => setGithubModal(item.id)}
            disabled={isDismissed || item.status === 'Pushed'}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            → GitHub
          </button>
        </div>
        <button
          onClick={() => dismissItem(item.id)}
          disabled={isDismissed}
          className="px-3 py-1.5 text-xs font-medium rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
