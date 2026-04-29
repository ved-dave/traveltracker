import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#0a0a0a' }}>
      <h1 className="text-4xl font-semibold text-gray-100 mb-2">404</h1>
      <p className="text-gray-500 mb-6">Page not found.</p>
      <Link href="/" className="text-sm text-gray-400 hover:text-gray-200 hover:underline">
        ← Back to map
      </Link>
    </main>
  )
}
