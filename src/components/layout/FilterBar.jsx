import { useFeedback } from '../../contexts/FeedbackContext'

const TYPES = ['All', 'Bug Report', 'Feature Request', 'Process Issue']
const PRIORITIES = ['All', 'High', 'Medium', 'Low']
const TEAMS = ['All', 'intelligence', 'insights', 'impact', 'data']
const STATUSES = ['All', 'New', 'In Review', 'Pushed', 'Dismissed']

const PRIORITY_ACTIVE = {
  High: 'bg-red-500 text-white',
  Medium: 'bg-amber-500 text-white',
  Low: 'bg-green-500 text-white',
}

const TEAM_ACTIVE = {
  intelligence: 'bg-violet-600 text-white',
  insights: 'bg-blue-600 text-white',
  impact: 'bg-orange-500 text-white',
  data: 'bg-teal-600 text-white',
}

function Pill({ label, active, onClick, activeClass }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap border ${
        active
          ? activeClass ?? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-transparent'
          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-800 dark:hover:text-gray-200'
      }`}
    >
      {label}
    </button>
  )
}

function FilterRow({ label, options, value, onChange, getActiveClass }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-medium text-gray-400 dark:text-gray-500 w-14 shrink-0">{label}</span>
      <div className="flex items-center gap-1.5 flex-wrap">
        {options.map(opt => (
          <Pill
            key={opt}
            label={opt}
            active={value === opt}
            onClick={() => onChange(opt)}
            activeClass={
              value === opt && opt !== 'All' && getActiveClass
                ? getActiveClass(opt)
                : undefined
            }
          />
        ))}
      </div>
    </div>
  )
}

export default function FilterBar() {
  const { filters, updateFilter } = useFeedback()

  return (
    <div className="mb-5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-2.5">
      <FilterRow
        label="Type"
        options={TYPES}
        value={filters.type}
        onChange={val => updateFilter('type', val)}
      />
      <FilterRow
        label="Priority"
        options={PRIORITIES}
        value={filters.priority}
        onChange={val => updateFilter('priority', val)}
        getActiveClass={opt => PRIORITY_ACTIVE[opt]}
      />
      <FilterRow
        label="Team"
        options={TEAMS}
        value={filters.team}
        onChange={val => updateFilter('team', val)}
        getActiveClass={opt => TEAM_ACTIVE[opt]}
      />
      <FilterRow
        label="Status"
        options={STATUSES}
        value={filters.status}
        onChange={val => updateFilter('status', val)}
      />

      {/* Search */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-400 dark:text-gray-500 w-14 shrink-0">Search</span>
        <div className="relative">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Filter by person name…"
            value={filters.search}
            onChange={e => updateFilter('search', e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600 w-52 transition-colors"
          />
          {filters.search && (
            <button
              onClick={() => updateFilter('search', '')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
