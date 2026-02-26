import { Music } from 'lucide-react'

export function LoadingSpinner({ size = 'md' }) {
  const sizeClasses = {
    'sm': 'w-4 h-4',
    'md': 'w-8 h-8',
    'lg': 'w-12 h-12'
  }

  return (
    <div className="flex items-center justify-center">
      <div className={`${sizeClasses[size]} text-synth-blue animate-spin`}>
        <Music size={sizeClasses[size]} className="text-synth-blue" />
      </div>
      <span className="ml-2 text-slate-400 text-sm">Loading...</span>
    </div>
  )
}
