'use client'

interface Props {
  isPublic: boolean
  mapId: string
  onToggle: (newValue: boolean) => void
}

export default function PrivacyToggle({ isPublic, onToggle }: Props) {
  return (
    <button
      onClick={() => onToggle(!isPublic)}
      className="text-xs px-3 py-1 rounded-lg border border-white/15 text-white/40 hover:bg-white/5 hover:text-white/70 transition-colors cursor-pointer"
      title={isPublic ? 'Map is public — click to make private' : 'Map is private — click to make public'}
    >
      {isPublic ? 'Public' : 'Private'}
    </button>
  )
}
