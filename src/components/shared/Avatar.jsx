const AVATAR_COLORS = [
  'bg-violet-500',
  'bg-blue-500',
  'bg-teal-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-emerald-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-amber-600',
]

function getColorIndex(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash) % AVATAR_COLORS.length
}

function getInitials(name) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

const SIZE_CLASSES = {
  xs: 'w-5 h-5 text-[9px]',
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
}

export default function Avatar({ name, size = 'sm' }) {
  const colorClass = AVATAR_COLORS[getColorIndex(name)]
  const initials = getInitials(name)
  const sizeClass = SIZE_CLASSES[size] ?? SIZE_CLASSES.sm

  return (
    <div
      className={`${colorClass} ${sizeClass} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 select-none`}
      title={name}
    >
      {initials}
    </div>
  )
}
