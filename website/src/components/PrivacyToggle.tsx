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
      className="text-xs px-3 py-1 rounded-md border border-gray-700 text-gray-400 hover:bg-gray-800 cursor-pointer"
      title={isPublic ? 'Map is public — click to make private' : 'Map is private — click to make public'}
    >
      {isPublic ? '🌐 public' : '🔒 private'}
    </button>
  )
}
