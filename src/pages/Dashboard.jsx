import { Link } from 'react-router-dom'
import { useFeedback } from '../contexts/FeedbackContext'
import DailyDigest from '../components/dashboard/DailyDigest'
import FilterBar from '../components/layout/FilterBar'
import FeedbackCard from '../components/dashboard/FeedbackCard'
import GitHubModal from '../components/modals/GitHubModal'
import EditModal from '../components/modals/EditModal'

function SyncBar({ isLoading, syncError, lastSynced, onSync, onDismissError }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <button
          onClick={onSync}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-[#4A154B] hover:bg-[#3d1040] disabled:opacity-60 text-white transition-colors"
        >
          {isLoading ? (
            <>
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Syncing Slack…
            </>
          ) : (
            <>
              {/* Slack hash icon */}
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
              </svg>
              Sync Slack
            </>
          )}
        </button>

        {lastSynced && !isLoading && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Last synced {lastSynced.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </span>
        )}
      </div>

      <Link
        to="/admin"
        className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
      >
        Configure →
      </Link>
    </div>
  )
}

function ErrorBanner({ message, onDismiss }) {
  if (!message) return null
  return (
    <div className="mb-4 flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
      <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-red-700 dark:text-red-300">Sync error</p>
        <p className="text-xs text-red-600 dark:text-red-400 mt-0.5 break-words">{message}</p>
      </div>
      <button onClick={onDismiss} className="text-red-400 hover:text-red-600 dark:hover:text-red-200 transition-colors flex-shrink-0">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

function EmptyState({ hasFilters }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <svg className="w-7 h-7 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {hasFilters ? 'No items match your filters' : 'No feedback items'}
      </p>
      <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
        {hasFilters ? 'Try adjusting your filters or search' : 'Click "Sync Slack" to pull the latest messages'}
      </p>
    </div>
  )
}

export default function Dashboard() {
  const {
    filteredItems, filters,
    githubModal, editModal,
    isLoading, syncError, setSyncError, lastSynced,
    syncFromSlack,
  } = useFeedback()

  const hasActiveFilters =
    filters.type !== 'All' ||
    filters.priority !== 'All' ||
    filters.team !== 'All' ||
    filters.status !== 'All' ||
    filters.search.trim() !== ''

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <SyncBar
        isLoading={isLoading}
        syncError={syncError}
        lastSynced={lastSynced}
        onSync={syncFromSlack}
        onDismissError={() => setSyncError(null)}
      />

      <ErrorBanner message={syncError} onDismiss={() => setSyncError(null)} />

      <DailyDigest />
      <FilterBar />

      {filteredItems.length === 0 ? (
        <EmptyState hasFilters={hasActiveFilters} />
      ) : (
        <div className="space-y-3">
          {filteredItems.map(item => (
            <FeedbackCard key={item.id} item={item} />
          ))}
          <p className="text-center text-xs text-gray-400 dark:text-gray-600 py-4">
            {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} · sorted by priority
          </p>
        </div>
      )}

      {githubModal && <GitHubModal />}
      {editModal && <EditModal />}
    </main>
  )
}
