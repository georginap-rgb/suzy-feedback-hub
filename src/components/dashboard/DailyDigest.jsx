import { useFeedback } from '../../contexts/FeedbackContext'

const SENTIMENT_CONFIG = {
  Positive: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    badge: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    text: 'text-green-700 dark:text-green-400',
  },
  Neutral: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
      </svg>
    ),
    text: 'text-blue-700 dark:text-blue-400',
  },
  Concerned: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    ),
    text: 'text-amber-700 dark:text-amber-400',
  },
  Critical: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    badge: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    text: 'text-red-700 dark:text-red-400',
  },
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function StatChip({ value, label, color }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`text-sm font-bold tabular-nums ${color}`}>{value}</span>
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
    </div>
  )
}

export default function DailyDigest() {
  const { digest, stats } = useFeedback()
  const cfg = SENTIMENT_CONFIG[digest.sentiment] ?? SENTIMENT_CONFIG.Neutral

  return (
    <div className={`mb-5 rounded-xl border ${cfg.border} bg-white dark:bg-gray-900 overflow-hidden`}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {formatDate(digest.date)}
          </span>
          <span className="px-2 py-0.5 rounded-md text-xs font-mono font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            {digest.channel}
          </span>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.badge}`}>
          {cfg.icon}
          <span>{digest.sentiment}</span>
        </div>
      </div>

      {/* Priority counts */}
      <div className="flex items-center gap-3 px-5 py-2.5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{digest.counts.high} High</span>
        </div>
        <span className="text-gray-200 dark:text-gray-700">·</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{digest.counts.medium} Medium</span>
        </div>
        <span className="text-gray-200 dark:text-gray-700">·</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{digest.counts.low} Low</span>
        </div>
      </div>

      {/* Summary */}
      <div className="px-5 py-4">
        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
          {digest.summary}
        </p>
        <p className={`mt-2 text-xs font-medium ${cfg.text}`}>
          {digest.sentimentReason}
        </p>
      </div>

      {/* Status stats */}
      <div className="flex items-center gap-5 px-5 py-3 bg-gray-50 dark:bg-gray-800/40 border-t border-gray-100 dark:border-gray-800 flex-wrap">
        <StatChip value={stats.active} label="Active" color="text-gray-800 dark:text-gray-100" />
        <span className="text-gray-200 dark:text-gray-700 hidden sm:block">·</span>
        <StatChip value={stats.high} label="High" color="text-red-600 dark:text-red-400" />
        <StatChip value={stats.medium} label="Medium" color="text-amber-600 dark:text-amber-400" />
        <span className="text-gray-200 dark:text-gray-700 hidden sm:block">·</span>
        <StatChip value={stats.pushed} label="Pushed" color="text-blue-600 dark:text-blue-400" />
        <StatChip value={stats.dismissed} label="Dismissed" color="text-gray-400 dark:text-gray-600" />
      </div>
    </div>
  )
}
