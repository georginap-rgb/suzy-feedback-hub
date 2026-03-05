import { useState, useEffect } from 'react'
import { useFeedback } from '../../contexts/FeedbackContext'
import { TEAM_ASSIGNEES, CATEGORY_TO_TYPE } from '../../utils/teamDetection'

function buildIssueBody(item) {
  return `## Summary
${item.summary}

## Details
- **Category:** ${item.category}
- **Team:** ${item.team}
- **Priority:** ${item.priority}
- **Channel:** ${item.channel}
- **Reported:** ${new Date(item.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}

## Original Slack Message
\`\`\`
${item.originalMessage}
\`\`\`

## Reported By
${item.author.name}${item.mentioned.length > 0 ? `\n\n## Also Mentioned\n${item.mentioned.map(m => m.name).join(', ')}` : ''}

---
*Created via Suzy Feedback Hub from ${item.channel}*`
}

function CloseButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  )
}

export default function GitHubModal() {
  const { githubModal, setGithubModal, getItem, updateItem } = useFeedback()
  const item = githubModal ? getItem(githubModal) : null

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [selectedAssignees, setSelectedAssignees] = useState([])

  useEffect(() => {
    if (item) {
      setTitle(`[${CATEGORY_TO_TYPE[item.category] ?? 'Task'}] ${item.summary}`)
      setBody(buildIssueBody(item))
      setSelectedAssignees([])
    }
  }, [githubModal]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!item) return null

  const issueType = CATEGORY_TO_TYPE[item.category] ?? 'Task'
  const suggestedAssignees = TEAM_ASSIGNEES[item.team] ?? []
  const labels = ['slack_feedback', item.team, issueType.toLowerCase()]

  const handleClose = () => setGithubModal(null)

  const toggleAssignee = (handle) => {
    setSelectedAssignees(prev =>
      prev.includes(handle) ? prev.filter(h => h !== handle) : [...prev, handle]
    )
  }

  const handleCreate = () => {
    updateItem(item.id, { status: 'Pushed' })
    handleClose()
    // Phase 2: GitHub API will auto-create the issue
    alert('✓ Marked as Pushed.\n\nPhase 2: GitHub API integration will auto-create this issue.')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-2xl bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-xl shadow-2xl border-0 sm:border border-gray-200 dark:border-gray-700 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gray-900 dark:bg-gray-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-white dark:text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Push to GitHub</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Create issue on One Suzy Board</p>
            </div>
          </div>
          <CloseButton onClick={handleClose} />
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Auto-detected metadata row */}
          <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            {[
              ['Type', issueType],
              ['Team', item.team],
              ['Project', 'One Suzy Board'],
              ['Status', 'Backlog'],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500 dark:text-gray-400">{k}:</span>
                <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600">
                  {v}
                </span>
              </div>
            ))}
          </div>

          {/* Labels */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Labels</label>
            <div className="flex flex-wrap gap-1.5">
              {labels.map(label => (
                <span
                  key={label}
                  className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Assignees */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Suggested Assignees{' '}
              <span className="text-gray-400 dark:text-gray-500 font-normal">— {item.team} team</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {suggestedAssignees.map(handle => (
                <button
                  key={handle}
                  onClick={() => toggleAssignee(handle)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    selectedAssignees.includes(handle)
                      ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-transparent'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  {handle}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Issue Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 transition-colors"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Issue Body</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={9}
              className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 font-mono leading-relaxed resize-none transition-colors"
            />
          </div>

          {/* Phase 2 notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              <strong>Phase 2:</strong> GitHub API auto-create not yet wired. Clicking "Create Issue" will mark the item as Pushed and log the payload.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            Create Issue
          </button>
        </div>
      </div>
    </div>
  )
}
