import { useState } from 'react'
import { useFeedback } from '../../contexts/FeedbackContext'

const TYPES = ['All', 'Bug Report', 'Feature Request', 'Process Issue']
const PRIORITIES = ['All', 'High', 'Medium', 'Low']
const TEAMS = ['All', 'intelligence', 'insights', 'impact', 'data']

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
  const [open, setOpen] = useState(false)

  const activeCount = [
    filters.type !== 'All',
    filters.priority !== 'All',
    filters.team !== 'All',
    filters.search.trim() !== '',
  ].filter(Boolean).length

  return (
    <div className="mb-5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          <span>Filters</span>
          {activeCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900">
              {activeCount}
            </span>
          )}
          {activeCount > 0 && !open && (
            <span className="text-gray-400 dark:text-gray-600 text-[11px]">
              {[
                filters.type !== 'All' && filters.type,
                filters.priority !== 'All' && filters.priority,
                filters.team !== 'All' && filters.team,
                filters.search.trim() && `"${filters.search.trim()}"`,
              ].filter(Boolean).join(' · ')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <span
              role="button"
              onClick={e => {
                e.stopPropagation()
                updateFilter('type', 'All')
                updateFilter('priority', 'All')
                updateFilter('team', 'All')
                updateFilter('search', '')
              }}
              className="text-[10px] text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700"
            >
              Clear
            </span>
          )}
          <svg
            className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expandable filters */}
      {open && (
        <div className="px-4 pb-4 pt-1 space-y-2.5 border-t border-gray-100 dark:border-gray-800">
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
                placeholder="Search by name or keyword…"
                value={filters.search}
                onChange={e => updateFilter('search', e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600 w-56 transition-colors"
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
      )}
    </div>
  )
}
