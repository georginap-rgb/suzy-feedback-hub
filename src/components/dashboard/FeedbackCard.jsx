import { useState } from 'react'
import { useFeedback } from '../../contexts/FeedbackContext'

const PM_ROUTING = {
  UX: 'Brock Prescott',
}

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

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function formatShortDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

/** GitHub icon SVG */
function GitHubIcon() {
  return (
    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  )
}

export default function FeedbackCard({ item, tab = 'active' }) {
  const [threadOpen, setThreadOpen] = useState(false)
  const { setEditModal, setGithubModal, dismissItem, saveForLater, restoreItem } = useFeedback()

  const priorityStyles = PRIORITY_STYLES[item.priority] ?? PRIORITY_STYLES.Medium
  const teamStyle = TEAM_STYLES[item.team] ?? TEAM_STYLES.data

  const isDismissed = item.status === 'Dismissed'
  const isSaved = item.status === 'Saved'
  const isPushed = item.status === 'Pushed'
  const isArchived = isDismissed || isSaved || isPushed

  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 border-l-4 ${priorityStyles.border} overflow-hidden ${isArchived ? 'opacity-80' : ''}`}
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

        {/* Author + Slack link */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-gray-400 dark:text-gray-500 w-[72px] shrink-0">Posted by</span>
          <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">{item.author.name}</span>
          {item.slackUrl && (
            <a
              href={item.slackUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="View in Slack"
              className="ml-0.5 text-[#4A154B] dark:text-purple-400 hover:opacity-70 transition-opacity"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
              </svg>
            </a>
          )}
        </div>

        {/* PM Owner (category-based routing) */}
        {PM_ROUTING[item.category] && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-gray-400 dark:text-gray-500 w-[72px] shrink-0">PM Owner</span>
            <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">{PM_ROUTING[item.category]}</span>
          </div>
        )}

        {/* Affects (tagged users or team) */}
        {item.mentioned.length > 0 && (
          <div className="flex items-start gap-2 mb-1">
            <span className="text-xs text-gray-400 dark:text-gray-500 w-[72px] shrink-0">Affects</span>
            <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
              {item.mentioned.map(p => p.name).join(', ')}
            </span>
          </div>
        )}

        {/* Dismissed attribution */}
        {isDismissed && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <span>
              Dismissed{item.dismissedBy ? ` by ${item.dismissedBy}` : ''}
              {item.dismissedAt ? ` · ${formatShortDate(item.dismissedAt)}` : ''}
            </span>
          </div>
        )}

        {/* Saved attribution */}
        {isSaved && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <span>
              Saved for later{item.savedBy ? ` by ${item.savedBy}` : ''}
              {item.savedAt ? ` · ${formatShortDate(item.savedAt)}` : ''}
            </span>
          </div>
        )}

        {/* Pushed attribution */}
        {isPushed && item.githubIssueUrl && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400">
            <GitHubIcon />
            <a
              href={item.githubIssueUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              #{item.githubIssueNumber} — pushed to GitHub
            </a>
          </div>
        )}

        {/* Thread insights panel — collapsible */}
        {item.replyCount > 0 && (
          <div className="mt-3 rounded-lg border border-blue-100 dark:border-blue-800 overflow-hidden">
            <button
              onClick={() => setThreadOpen(v => !v)}
              className="w-full flex items-center justify-between px-3 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Thread insights · {item.replyCount} repl{item.replyCount === 1 ? 'y' : 'ies'}
              </p>
              <svg
                className={`w-3.5 h-3.5 text-blue-400 transition-transform ${threadOpen ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {threadOpen && (
            <div className="px-3 py-2.5 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-100 dark:border-blue-800">
              {item.threadSummary && typeof item.threadSummary === 'object' ? (
                <>
                  {item.threadSummary.discussion && (
                    <div className="mb-2">
                      <p className="text-[10px] font-semibold text-blue-500 dark:text-blue-400 uppercase tracking-wider mb-0.5">Discussed</p>
                      <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">{item.threadSummary.discussion}</p>
                    </div>
                  )}
                  {item.threadSummary.gaps && (
                    <div className="mb-2">
                      <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider mb-0.5">Open gaps</p>
                      <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">{item.threadSummary.gaps}</p>
                    </div>
                  )}
                  {item.threadSummary.participants?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-blue-500 dark:text-blue-400 uppercase tracking-wider mb-0.5">Participants</p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">{item.threadSummary.participants.join(', ')}</p>
                    </div>
                  )}
                </>
              ) : item.threadSummary && typeof item.threadSummary === 'string' ? (
                /* Legacy string format */
                <p className="text-xs text-blue-700 dark:text-blue-200 leading-relaxed">{item.threadSummary}</p>
              ) : item.threadReplies?.length > 0 ? (
                /* Replies loaded but AI summary not yet available */
                <>
                  <p className="text-xs text-blue-500 dark:text-blue-400 italic mb-2">AI analysis will appear after next sync</p>
                  <div>
                    <p className="text-[10px] font-semibold text-blue-500 dark:text-blue-400 uppercase tracking-wider mb-0.5">Participants</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      {[item.author.name, ...[...new Set(item.threadReplies.map(r => r.author))]].join(', ')}
                    </p>
                  </div>
                </>
              ) : (
                /* Thread exists but not yet loaded */
                <p className="text-xs text-blue-500 dark:text-blue-400 italic">Sync Slack to load thread insights</p>
              )}
            </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">

        {/* Dismissed tab: just restore */}
        {isDismissed ? (
          <div className="flex items-center gap-2 w-full justify-end">
            <button
              onClick={() => restoreItem(item.id)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Restore
            </button>
          </div>
        ) : isPushed ? (
          /* Pushed tab: link to GitHub, restore */
          <div className="flex items-center gap-2 w-full">
            {item.githubIssueUrl && (
              <a
                href={item.githubIssueUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors flex items-center gap-1.5"
              >
                <GitHubIcon />
                View Issue
              </a>
            )}
            <div className="ml-auto">
              <button
                onClick={() => restoreItem(item.id)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                Move back
              </button>
            </div>
          </div>
        ) : (
          /* Active / Saved: full actions */
          <>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Edit */}
              <button
                onClick={() => setEditModal(item.id)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Edit
              </button>

              {/* → GitHub */}
              {!isSaved && (
                <button
                  onClick={() => setGithubModal(item.id)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors flex items-center gap-1.5"
                >
                  <GitHubIcon />
                  → GitHub
                </button>
              )}

              {/* Restore if saved */}
              {isSaved && (
                <button
                  onClick={() => restoreItem(item.id)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Restore
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Save for later */}
              {!isSaved && (
                <button
                  onClick={() => saveForLater(item.id)}
                  title="Good idea — park it for later"
                  className="px-3 py-1.5 text-xs font-medium rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 border border-amber-200 dark:border-amber-800 hover:border-amber-300 transition-colors"
                >
                  Later
                </button>
              )}

              {/* Dismiss */}
              <button
                onClick={() => dismissItem(item.id)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
