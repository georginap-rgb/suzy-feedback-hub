import { useState, useEffect } from 'react'
import { DEFAULT_TEAM_MAPPING } from '../utils/teamDetection'
import { testAuth, listChannels } from '../services/slackService'
import { testGitHubAuth } from '../services/githubService'
import { testConnection, hasOpenAIKey } from '../services/aiService'

const STORAGE_KEY = 'suzy-admin-config'

const DEFAULT_PEOPLE = [
  { slackName: 'Georgina Pinou',  githubHandle: 'georginap' },
  { slackName: 'Roop Yekollu',    githubHandle: 'roopy' },
  { slackName: 'Max Kelly',       githubHandle: 'maxkelly' },
  { slackName: 'Bala N',          githubHandle: 'bala-natrayan' },
  { slackName: 'George Bloom',    githubHandle: 'georgebloom' },
  { slackName: 'Erika Bailey',    githubHandle: 'erikabailey' },
  { slackName: 'Haseeb Saeed',    githubHandle: 'haseebsaeed' },
  { slackName: 'Riche Zamor',     githubHandle: 'richezamor' },
  { slackName: 'Eman E',          githubHandle: 'eman-elgouz' },
  { slackName: 'Zachary Krepps',  githubHandle: 'zachkrepps' },
  { slackName: 'Brock Prescott',  githubHandle: '' },
  { slackName: 'Miguel Soler',    githubHandle: '' },
  { slackName: 'Luke Howell',     githubHandle: '' },
  { slackName: 'Thomas Gardiner', githubHandle: '' },
  { slackName: 'Bryan Silverman', githubHandle: '' },
  { slackName: 'Shane Hamilton',  githubHandle: '' },
  { slackName: 'Jessica Corbett', githubHandle: '' },
]

const DEFAULT_CONFIG = {
  yourName: '',
  slack: {
    token: import.meta.env.VITE_SLACK_TOKEN?.trim() ?? '',
    channels: import.meta.env.VITE_SLACK_CHANNEL?.trim() ?? '',
    lookback: '24h',
  },
  github: {
    token: import.meta.env.VITE_GITHUB_TOKEN?.trim() ?? '',
    repo: 'crowdtap/suzy.onesuzy',
    org: 'crowdtap',
    projectNumber: 2,
    defaultLabels: 'slack_feedback',
  },
  teamMapping: DEFAULT_TEAM_MAPPING,
  people: DEFAULT_PEOPLE,
  refresh: {
    enabled: true,
    time: '08:00',
  },
}

function loadConfig() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // For token fields, prefer non-empty value (env var wins over an empty localStorage entry)
      const mergeTokens = (defaults, saved) => ({
        ...defaults,
        ...saved,
        token: saved.token?.trim() || defaults.token,
      })
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        slack: mergeTokens(DEFAULT_CONFIG.slack, parsed.slack ?? {}),
        github: mergeTokens(DEFAULT_CONFIG.github, parsed.github ?? {}),
        refresh: { ...DEFAULT_CONFIG.refresh, ...parsed.refresh },
        people: parsed.people ?? DEFAULT_PEOPLE,
        teamMapping: parsed.teamMapping ?? DEFAULT_TEAM_MAPPING,
      }
    }
  } catch {}
  return DEFAULT_CONFIG
}

// ── Shared UI helpers ─────────────────────────────────────────────────────────

function SectionHeader({ title, description }) {
  return (
    <div className="mb-5">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
      {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {label}
        {hint && <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">— {hint}</span>}
      </label>
      {children}
    </div>
  )
}

const inputClass =
  'w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 transition-colors placeholder-gray-400 dark:placeholder-gray-600'

const textareaClass = inputClass + ' resize-none leading-relaxed font-mono'

// ── Slack Config ──────────────────────────────────────────────────────────────
function SlackConfig({ slack, onChange }) {
  const [showToken, setShowToken] = useState(false)
  const [testState, setTestState] = useState(null) // null | 'loading' | { ok, message, channels }
  const [channels, setChannels] = useState(null)

  const handleTestConnection = async () => {
    if (!slack.token?.trim()) {
      setTestState({ ok: false, message: 'Enter a Bot Token first.' })
      return
    }
    setTestState('loading')
    try {
      const auth = await testAuth(slack.token.trim())
      const chList = await listChannels(slack.token.trim())
      setChannels(chList)
      setTestState({ ok: true, message: `Connected as ${auth.user} on ${auth.team}. Found ${chList.length} channels.` })
    } catch (err) {
      setTestState({ ok: false, message: err.message })
    }
  }

  return (
    <div className="space-y-4">
      {/* Token */}
      <Field
        label="Bot Token"
        hint="starts with xoxb-"
      >
        <div className="relative">
          <input
            type={showToken ? 'text' : 'password'}
            value={slack.token ?? ''}
            onChange={e => onChange('token', e.target.value)}
            className={inputClass + ' pr-20'}
            placeholder="xoxb-XXXXXXXXXXXXXXXXXXXXXXXX"
            autoComplete="off"
            spellCheck="false"
          />
          <button
            type="button"
            onClick={() => setShowToken(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium transition-colors"
          >
            {showToken ? 'Hide' : 'Show'}
          </button>
        </div>
        <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
          Create a Slack app at{' '}
          <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600 dark:hover:text-gray-300">
            api.slack.com/apps
          </a>
          {' '}with scopes:{' '}
          <code className="font-mono text-[11px] bg-gray-100 dark:bg-gray-800 px-1 rounded">channels:history</code>{' '}
          <code className="font-mono text-[11px] bg-gray-100 dark:bg-gray-800 px-1 rounded">channels:read</code>{' '}
          <code className="font-mono text-[11px] bg-gray-100 dark:bg-gray-800 px-1 rounded">users:read</code>{' '}
          <code className="font-mono text-[11px] bg-gray-100 dark:bg-gray-800 px-1 rounded">groups:history</code>
        </p>
      </Field>

      {/* Test connection */}
      <div>
        <button
          onClick={handleTestConnection}
          disabled={testState === 'loading'}
          className="px-4 py-2 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          {testState === 'loading' ? (
            <span className="flex items-center gap-1.5">
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Testing…
            </span>
          ) : 'Test Connection'}
        </button>

        {testState && testState !== 'loading' && (
          <div className={`mt-2 flex items-start gap-2 text-xs px-3 py-2 rounded-lg ${
            testState.ok
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
          }`}>
            <span className="mt-0.5">{testState.ok ? '✓' : '✗'}</span>
            <span>{testState.message}</span>
          </div>
        )}

        {/* Channel picker */}
        {channels && channels.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Click a channel to add its ID to the list below:
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              {channels.map(ch => (
                <button
                  key={ch.id}
                  onClick={() => {
                    const current = slack.channels ?? ''
                    const lines = current.split('\n').map(s => s.trim()).filter(Boolean)
                    if (!lines.includes(ch.id)) {
                      onChange('channels', [...lines, ch.id].join('\n'))
                    }
                  }}
                  className="px-2 py-0.5 text-xs rounded-md bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-400 transition-colors font-mono"
                  title={`ID: ${ch.id}`}
                >
                  #{ch.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Channels */}
      <Field label="Channel IDs to monitor" hint="one per line — use IDs like C08XXXXXXX, or click channels above">
        <textarea
          rows={4}
          value={slack.channels ?? ''}
          onChange={e => onChange('channels', e.target.value)}
          className={textareaClass}
          placeholder={'C08ABC1234\nC08DEF5678'}
        />
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          Find channel IDs in Slack: right-click a channel → View channel details → scroll to bottom.
        </p>
      </Field>

      {/* Lookback */}
      <Field label="Lookback window">
        <div className="flex gap-4">
          {['24h', '48h', '7d'].map(opt => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="lookback"
                value={opt}
                checked={slack.lookback === opt}
                onChange={() => onChange('lookback', opt)}
                className="w-3.5 h-3.5 accent-gray-900 dark:accent-gray-100"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{opt}</span>
            </label>
          ))}
        </div>
      </Field>
    </div>
  )
}

// ── GitHub Config ─────────────────────────────────────────────────────────────
function GitHubConfig({ github, onChange }) {
  const [showToken, setShowToken] = useState(false)
  const [testState, setTestState] = useState(null)

  const handleTest = async () => {
    if (!github.token?.trim()) {
      setTestState({ ok: false, message: 'Enter a Personal Access Token first.' })
      return
    }
    setTestState('loading')
    try {
      const { login } = await testGitHubAuth(github.token.trim())
      setTestState({ ok: true, message: `Connected as @${login}` })
    } catch (err) {
      setTestState({ ok: false, message: err.message })
    }
  }

  return (
    <div className="space-y-4">
      <Field label="Personal Access Token" hint="needs repo + project scopes">
        <div className="relative">
          <input
            type={showToken ? 'text' : 'password'}
            value={github.token ?? ''}
            onChange={e => onChange('token', e.target.value)}
            className={inputClass + ' pr-20'}
            placeholder="ghp_XXXXXXXXXXXXXXXXXXXX"
            autoComplete="off"
            spellCheck="false"
          />
          <button
            type="button"
            onClick={() => setShowToken(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium transition-colors"
          >
            {showToken ? 'Hide' : 'Show'}
          </button>
        </div>
        <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
          Create at{' '}
          <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600 dark:hover:text-gray-300">
            github.com/settings/tokens
          </a>
          {' '}with scopes:{' '}
          <code className="font-mono text-[11px] bg-gray-100 dark:bg-gray-800 px-1 rounded">repo</code>{' '}
          <code className="font-mono text-[11px] bg-gray-100 dark:bg-gray-800 px-1 rounded">project</code>
        </p>
      </Field>

      <div>
        <button
          onClick={handleTest}
          disabled={testState === 'loading'}
          className="px-4 py-2 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          {testState === 'loading' ? (
            <span className="flex items-center gap-1.5">
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Testing…
            </span>
          ) : 'Test Connection'}
        </button>
        {testState && testState !== 'loading' && (
          <div className={`mt-2 flex items-start gap-2 text-xs px-3 py-2 rounded-lg ${
            testState.ok
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
          }`}>
            <span className="mt-0.5">{testState.ok ? '✓' : '✗'}</span>
            <span>{testState.message}</span>
          </div>
        )}
      </div>

      <Field label="Repository" hint="org/repo">
        <input type="text" value={github.repo ?? 'crowdtap/suzy.onesuzy'} onChange={e => onChange('repo', e.target.value)} className={inputClass} placeholder="crowdtap/suzy.onesuzy" />
      </Field>
      <Field label="Organization" hint="for project board lookup">
        <input type="text" value={github.org ?? 'crowdtap'} onChange={e => onChange('org', e.target.value)} className={inputClass} placeholder="crowdtap" />
      </Field>
      <Field label="Project number" hint="from the project URL — e.g. /projects/2">
        <input type="number" value={github.projectNumber ?? 2} onChange={e => onChange('projectNumber', parseInt(e.target.value, 10))} className={inputClass + ' w-32'} min="1" />
      </Field>
      <Field label="Default labels" hint="comma-separated">
        <input type="text" value={github.defaultLabels ?? 'slack_feedback'} onChange={e => onChange('defaultLabels', e.target.value)} className={inputClass} placeholder="slack_feedback" />
      </Field>
    </div>
  )
}

// ── Team Mapping ──────────────────────────────────────────────────────────────
const TEAM_COLORS = {
  intelligence: 'text-violet-600 dark:text-violet-400',
  insights: 'text-blue-600 dark:text-blue-400',
  impact: 'text-orange-600 dark:text-orange-400',
  data: 'text-teal-600 dark:text-teal-400',
}

function TeamMappingTable({ mapping, onChange }) {
  const [editingRow, setEditingRow] = useState(null)
  const [editForm, setEditForm] = useState({})

  const startEdit = i => { setEditingRow(i); setEditForm({ ...mapping[i] }) }
  const saveEdit = () => { onChange(mapping.map((r, i) => i === editingRow ? editForm : r)); setEditingRow(null) }
  const cancelEdit = () => setEditingRow(null)

  const cellInput = (field) => (
    <input
      value={editForm[field] ?? ''}
      onChange={e => setEditForm(f => ({ ...f, [field]: e.target.value }))}
      className="w-full px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600"
    />
  )

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            {['Team', 'Keywords', 'PMs', 'GitHub Handles', ''].map(h => (
              <th key={h} className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {mapping.map((row, i) => (
            <tr key={row.team} className="group">
              {editingRow === i ? (
                <>
                  <td className="py-2.5 px-3">
                    <span className={`font-semibold uppercase text-[11px] tracking-wider ${TEAM_COLORS[row.team]}`}>{row.team}</span>
                  </td>
                  <td className="py-2.5 px-3">{cellInput('keywords')}</td>
                  <td className="py-2.5 px-3">{cellInput('pms')}</td>
                  <td className="py-2.5 px-3">{cellInput('handles')}</td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <button onClick={saveEdit} className="text-gray-900 dark:text-gray-100 font-medium mr-2 hover:underline text-xs">Save</button>
                    <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs">Cancel</button>
                  </td>
                </>
              ) : (
                <>
                  <td className="py-2.5 px-3">
                    <span className={`font-semibold uppercase text-[11px] tracking-wider ${TEAM_COLORS[row.team]}`}>{row.team}</span>
                  </td>
                  <td className="py-2.5 px-3 text-gray-500 dark:text-gray-400 max-w-[160px] truncate" title={row.keywords}>{row.keywords}</td>
                  <td className="py-2.5 px-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">{row.pms}</td>
                  <td className="py-2.5 px-3 text-gray-700 dark:text-gray-300 font-mono whitespace-nowrap">{row.handles}</td>
                  <td className="py-2.5 px-3">
                    <button onClick={() => startEdit(i)} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-medium">Edit</button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── People Mapping ────────────────────────────────────────────────────────────
function PeopleMapping({ people, onChange }) {
  const [editingRow, setEditingRow] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [newRow, setNewRow] = useState({ slackName: '', githubHandle: '' })
  const [showAdd, setShowAdd] = useState(false)

  const startEdit = i => { setEditingRow(i); setEditForm({ ...people[i] }) }
  const saveEdit = () => {
    onChange(people.map((r, i) => i === editingRow ? editForm : r))
    setEditingRow(null)
  }
  const cancelEdit = () => setEditingRow(null)
  const deleteRow = i => onChange(people.filter((_, idx) => idx !== i))
  const addRow = () => {
    if (!newRow.slackName.trim()) return
    onChange([...people, { slackName: newRow.slackName.trim(), githubHandle: newRow.githubHandle.trim() }])
    setNewRow({ slackName: '', githubHandle: '' })
    setShowAdd(false)
  }

  return (
    <div>
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Slack Display Name</th>
              <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">GitHub Handle</th>
              <th className="py-2 px-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {people.map((row, i) => (
              <tr key={i} className="group">
                {editingRow === i ? (
                  <>
                    <td className="py-2 px-3">
                      <input
                        value={editForm.slackName}
                        onChange={e => setEditForm(f => ({ ...f, slackName: e.target.value }))}
                        className="w-full px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-300"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400 dark:text-gray-500 text-xs">@</span>
                        <input
                          value={editForm.githubHandle}
                          onChange={e => setEditForm(f => ({ ...f, githubHandle: e.target.value.replace(/^@/, '') }))}
                          className="w-full px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-300 font-mono"
                          placeholder="github-username"
                        />
                      </div>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <button onClick={saveEdit} className="text-gray-900 dark:text-white font-medium mr-2 hover:underline">Save</button>
                      <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-2.5 px-3 text-gray-800 dark:text-gray-200">{row.slackName}</td>
                    <td className="py-2.5 px-3">
                      {row.githubHandle ? (
                        <span className="font-mono text-gray-700 dark:text-gray-300">@{row.githubHandle}</span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600 italic">not set</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(i)} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium">Edit</button>
                        <button onClick={() => deleteRow(i)} className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400">Remove</button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add row */}
      {showAdd ? (
        <div className="mt-3 flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <input
            value={newRow.slackName}
            onChange={e => setNewRow(r => ({ ...r, slackName: e.target.value }))}
            className="flex-1 px-2 py-1.5 text-xs rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600"
            placeholder="Slack display name"
            autoFocus
          />
          <div className="flex items-center gap-1 flex-1">
            <span className="text-xs text-gray-400">@</span>
            <input
              value={newRow.githubHandle}
              onChange={e => setNewRow(r => ({ ...r, githubHandle: e.target.value.replace(/^@/, '') }))}
              className="flex-1 px-2 py-1.5 text-xs rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600 font-mono"
              placeholder="github-username"
              onKeyDown={e => e.key === 'Enter' && addRow()}
            />
          </div>
          <button onClick={addRow} className="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors">Add</button>
          <button onClick={() => setShowAdd(false)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">Cancel</button>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="mt-3 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add person
        </button>
      )}
    </div>
  )
}

// ── AI Config ─────────────────────────────────────────────────────────────────
function AIConfig() {
  const keyPresent = hasOpenAIKey()
  const [testState, setTestState] = useState(null)

  const handleTest = async () => {
    setTestState('loading')
    try {
      const msg = await testConnection()
      setTestState({ ok: true, message: msg })
    } catch (err) {
      setTestState({ ok: false, message: err.message })
    }
  }

  return (
    <div className="space-y-5">
      {/* Key status */}
      <div className="flex items-center gap-2.5">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${keyPresent ? 'bg-green-500' : 'bg-red-400'}`} />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {keyPresent ? 'API key is present in this build' : 'No API key found in this build'}
        </span>
      </div>

      {!keyPresent && (
        <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2.5 space-y-1">
          <p className="font-medium">Key missing from build</p>
          <p>Go to your GitHub repo → Settings → Secrets and variables → Actions, then update <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">VITE_OPENAI_API_KEY</code> and re-run the deploy workflow.</p>
        </div>
      )}

      {/* Test button */}
      <div>
        <button
          onClick={handleTest}
          disabled={testState === 'loading' || !keyPresent}
          className="px-4 py-2 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          {testState === 'loading' ? (
            <span className="flex items-center gap-1.5">
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Testing…
            </span>
          ) : 'Test AI Connection'}
        </button>

        {testState && testState !== 'loading' && (
          <div className={`mt-2 flex items-start gap-2 text-xs px-3 py-2 rounded-lg ${
            testState.ok
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
          }`}>
            <span className="mt-0.5">{testState.ok ? '✓' : '✗'}</span>
            <span>{testState.message}</span>
          </div>
        )}
      </div>

      {/* What AI does */}
      <div className="pt-1 border-t border-gray-100 dark:border-gray-800">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2.5">AI is used for:</p>
        <ul className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
          <li className="flex items-start gap-2"><span className="text-gray-300 dark:text-gray-600 mt-0.5">→</span>Filtering Slack messages to genuine product feedback only (removes chit-chat, link shares)</li>
          <li className="flex items-start gap-2"><span className="text-gray-300 dark:text-gray-600 mt-0.5">→</span>Generating action-focused 1-sentence summaries for each feedback item</li>
          <li className="flex items-start gap-2"><span className="text-gray-300 dark:text-gray-600 mt-0.5">→</span>Summarizing thread discussions into key points and open questions</li>
          <li className="flex items-start gap-2"><span className="text-gray-300 dark:text-gray-600 mt-0.5">→</span>Dashboard digest of active feedback themes</li>
        </ul>
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          The key is baked into the build at deploy time. To change it, update the GitHub secret and redeploy.
        </p>
      </div>
    </div>
  )
}

// ── Refresh Schedule ──────────────────────────────────────────────────────────
function RefreshSchedule({ refresh, onChange }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Daily auto-refresh</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Automatically pull new Slack feedback on a schedule (Phase 2)</p>
        </div>
        <button
          onClick={() => onChange('enabled', !refresh.enabled)}
          className={`relative rounded-full transition-colors flex-shrink-0 ${refresh.enabled ? 'bg-gray-900 dark:bg-gray-100' : 'bg-gray-200 dark:bg-gray-700'}`}
          style={{ width: 40, height: 22 }}
        >
          <span
            className={`absolute top-0.5 rounded-full bg-white dark:bg-gray-900 shadow transition-transform ${refresh.enabled ? 'translate-x-[19px]' : 'translate-x-0.5'}`}
            style={{ width: 18, height: 18 }}
          />
        </button>
      </div>
      {refresh.enabled && (
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Refresh time <span className="font-normal text-gray-400">— 24h format</span></label>
          <input type="time" value={refresh.time} onChange={e => onChange('time', e.target.value)} className={inputClass + ' w-40'} />
        </div>
      )}
    </div>
  )
}

// ── Save banner ───────────────────────────────────────────────────────────────
function SaveBanner({ saved }) {
  if (!saved) return null
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full text-xs font-medium shadow-lg flex items-center gap-2 pointer-events-none">
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      Settings saved
    </div>
  )
}

// ── Admin Page ────────────────────────────────────────────────────────────────
const TABS = ['Slack', 'GitHub', 'AI', 'Teams', 'People', 'Schedule']

export default function Admin() {
  const [config, setConfig] = useState(loadConfig)
  const [activeTab, setActiveTab] = useState('Slack')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)) } catch {}
  }, [config])

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const updateSlack    = (key, val) => setConfig(c => ({ ...c, slack: { ...c.slack, [key]: val } }))
  const updateGitHub   = (key, val) => setConfig(c => ({ ...c, github: { ...c.github, [key]: val } }))
  const updateTeams    = updated   => setConfig(c => ({ ...c, teamMapping: updated }))
  const updatePeople   = updated   => setConfig(c => ({ ...c, people: updated }))
  const updateRefresh  = (key, val) => setConfig(c => ({ ...c, refresh: { ...c.refresh, [key]: val } }))
  const updateYourName = val       => setConfig(c => ({ ...c, yourName: val }))

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Admin Config</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Settings are auto-saved to localStorage. API-backed persistence in Phase 2.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 px-1 pt-1 overflow-x-auto scrollbar-hide">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? 'text-gray-900 dark:text-gray-100 border-b-2 border-gray-900 dark:border-gray-100'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'Slack' && (
            <>
              <SectionHeader title="Slack Configuration" description="Bot token and channels to monitor when syncing feedback" />
              {/* Your name — used to attribute Dismiss/Save actions */}
              <div className="mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
                <Field label="Your name" hint="shown when you dismiss or save items">
                  <input
                    type="text"
                    value={config.yourName ?? ''}
                    onChange={e => updateYourName(e.target.value)}
                    className={inputClass + ' max-w-xs'}
                    placeholder="e.g. Georgina"
                  />
                </Field>
              </div>
              <SlackConfig slack={config.slack} onChange={updateSlack} />
            </>
          )}
          {activeTab === 'GitHub' && (
            <>
              <SectionHeader title="GitHub Configuration" description="Target repo and project board for pushed issues" />
              <GitHubConfig github={config.github} onChange={updateGitHub} />
            </>
          )}
          {activeTab === 'AI' && (
            <>
              <SectionHeader title="OpenAI Configuration" description="Verify your API key and understand how AI is used during Slack sync" />
              <AIConfig />
            </>
          )}
          {activeTab === 'Teams' && (
            <>
              <SectionHeader title="Team Keyword Mapping" description="Keywords used to auto-detect team from feedback text. Hover a row to edit." />
              <TeamMappingTable mapping={config.teamMapping} onChange={updateTeams} />
            </>
          )}
          {activeTab === 'People' && (
            <>
              <SectionHeader
                title="People → GitHub Mapping"
                description="Maps Slack display names to GitHub handles. Used when suggesting assignees on push."
              />
              <PeopleMapping people={config.people ?? DEFAULT_PEOPLE} onChange={updatePeople} />
            </>
          )}
          {activeTab === 'Schedule' && (
            <>
              <SectionHeader title="Refresh Schedule" description="Configure automatic Slack polling" />
              <RefreshSchedule refresh={config.refresh} onChange={updateRefresh} />
            </>
          )}

          <div className="flex justify-end mt-6 pt-5 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={handleSave}
              className="px-5 py-2 text-sm font-medium rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>

      <SaveBanner saved={saved} />
    </main>
  )
}
