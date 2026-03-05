import { useState, useEffect } from 'react'
import { useFeedback } from '../../contexts/FeedbackContext'
import { TEAM_ASSIGNEES, CATEGORY_TO_TYPE } from '../../utils/teamDetection'
import { searchRepoContext, createIssue, addIssueToProject } from '../../services/githubService'

const STORAGE_KEY = 'suzy-admin-config'

function loadGitHubConfig() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)?.github ?? {}
  } catch {}
  return {}
}

function buildIssueBody(item, contextFiles = []) {
  const contextSection = contextFiles.length > 0
    ? `\n\n## Relevant Code\n> Auto-detected from \`crowdtap/suzy.onesuzy\` based on feedback keywords\n\n${contextFiles.map(f => `- [\`${f.path}\`](${f.url})`).join('\n')}`
    : ''

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
${item.author.name}${item.mentioned.length > 0 ? `\n\n## Also Mentioned\n${item.mentioned.map(m => m.name).join(', ')}` : ''}${contextSection}

---
*Created via [Suzy Feedback Hub](https://georginap-rgb.github.io/suzy-feedback-hub/) from ${item.channel}*`
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

const GitHubIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
)

export default function GitHubModal() {
  const { githubModal, setGithubModal, getItem, updateItem } = useFeedback()
  const item = githubModal ? getItem(githubModal) : null

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [selectedAssignees, setSelectedAssignees] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [contextFiles, setContextFiles] = useState([])
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState(null)
  const [createdIssue, setCreatedIssue] = useState(null)

  useEffect(() => {
    if (!item) return
    setTitle(`[${CATEGORY_TO_TYPE[item.category] ?? 'Task'}] ${item.summary}`)
    setBody(buildIssueBody(item, []))
    setSelectedAssignees([])
    setContextFiles([])
    setCreateError(null)
    setCreatedIssue(null)

    // Search repo for relevant context
    const ghConfig = loadGitHubConfig()
    if (ghConfig.token?.trim()) {
      setIsSearching(true)
      const repo = ghConfig.repo || 'crowdtap/suzy.onesuzy'
      searchRepoContext(ghConfig.token.trim(), repo, item.originalMessage || item.summary)
        .then(files => {
          setContextFiles(files)
          setBody(buildIssueBody(item, files))
        })
        .finally(() => setIsSearching(false))
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

  const handleCreate = async () => {
    const ghConfig = loadGitHubConfig()

    if (!ghConfig.token?.trim()) {
      setCreateError('No GitHub token configured. Go to Admin → GitHub to add your Personal Access Token.')
      return
    }

    setIsCreating(true)
    setCreateError(null)

    const token = ghConfig.token.trim()
    const repo = ghConfig.repo || 'crowdtap/suzy.onesuzy'
    const org = ghConfig.org || 'crowdtap'
    const projectNumber = ghConfig.projectNumber ?? 2

    try {
      const issue = await createIssue(token, repo, {
        title,
        body,
        labels,
        assignees: selectedAssignees,
      })

      // Add to project board (non-fatal if it fails)
      try {
        await addIssueToProject(token, org, projectNumber, issue.nodeId)
      } catch (projErr) {
        console.warn('Could not add to project board:', projErr.message)
      }

      updateItem(item.id, { status: 'Pushed', githubIssueUrl: issue.url, githubIssueNumber: issue.number })
      setCreatedIssue(issue)
    } catch (err) {
      setCreateError(err.message)
    } finally {
      setIsCreating(false)
    }
  }

  // ── Success state ─────────────────────────────────────────────────────────
  if (createdIssue) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={handleClose} />
        <div className="relative w-full sm:max-w-md bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-xl shadow-2xl border-0 sm:border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Issue Created</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
            #{createdIssue.number} added to OneSuzy Board
          </p>
          <div className="flex gap-2 justify-center">
            <a
              href={createdIssue.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors"
            >
              View on GitHub
            </a>
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Main modal ────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={handleClose} />

      <div className="relative w-full sm:max-w-2xl bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-xl shadow-2xl border-0 sm:border border-gray-200 dark:border-gray-700 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gray-900 dark:bg-gray-100 flex items-center justify-center">
              <GitHubIcon className="w-4 h-4 text-white dark:text-gray-900" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Push to GitHub</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Create issue on OneSuzy Board</p>
            </div>
          </div>
          <CloseButton onClick={handleClose} />
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Metadata row */}
          <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            {[
              ['Type', issueType],
              ['Team', item.team],
              ['Project', 'OneSuzy Board'],
              ['Status', 'Backlog'],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500 dark:text-gray-400">{k}:</span>
                <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600">{v}</span>
              </div>
            ))}
          </div>

          {/* Labels */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Labels</label>
            <div className="flex flex-wrap gap-1.5">
              {labels.map(label => (
                <span key={label} className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600">
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

          {/* Repo context */}
          {isSearching && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <svg className="w-3.5 h-3.5 text-blue-500 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-xs text-blue-700 dark:text-blue-400">Searching OneSuzy repo for relevant code…</p>
            </div>
          )}

          {!isSearching && contextFiles.length > 0 && (
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-2">
                Relevant files found in OneSuzy repo — included in issue body:
              </p>
              <ul className="space-y-1">
                {contextFiles.map(f => (
                  <li key={f.url} className="flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-blue-600 dark:text-blue-400 hover:underline truncate">
                      {f.path}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

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
              rows={10}
              className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 font-mono leading-relaxed resize-none transition-colors"
            />
          </div>

          {/* Error */}
          {createError && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-red-700 dark:text-red-300">{createError}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
          <button
            onClick={handleClose}
            disabled={isCreating}
            className="px-4 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating || isSearching}
            className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isCreating ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating…
              </>
            ) : (
              <>
                <GitHubIcon className="w-4 h-4" />
                Create Issue
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
