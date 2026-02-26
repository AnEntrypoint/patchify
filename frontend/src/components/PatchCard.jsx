import { Music, Settings, Download, Play } from 'lucide-react'

export function PatchCard({ patch, selected = false, onSelect = null, onEdit = null }) {
  return (
    <div
      className={`
        bg-slate-800 rounded-lg p-6 border border-slate-700 transition-all duration-200 hover:shadow-lg
        ${selected ? 'border-synth-blue bg-synth-blue/10' : 'hover:border-slate-600'}
        cursor-pointer
      `}
      onClick={() => onSelect && onSelect(patch.id)}
    >
      {/* Patch Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1 truncate">{patch.name}</h3>
          <p className="text-xs text-slate-500">{patch.voice_mode}</p>
        </div>
        {patch.category && (
          <span className="inline-block px-2 py-1 bg-slate-700 text-slate-400 text-xs font-medium rounded-full">
            {patch.category}
          </span>
        )}
      </div>

      {/* Patch Preview */}
      <div className="mb-4">
        <div className="h-24 bg-slate-700 rounded-lg flex items-center justify-center">
          <Music className="text-slate-500" size={32} />
        </div>
      </div>

      {/* Patch Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">Timbre 1</span>
          <span className="text-xs text-slate-500">
            {patch.timbres?.[0]?.osc1?.waveform || 'saw'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">Timbre 2</span>
          <span className="text-xs text-slate-500">
            {patch.timbres?.[1]?.osc1?.waveform || 'square'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">Filter</span>
          <span className="text-xs text-slate-500">
            {patch.timbres?.[0]?.filter?.type || '24lpf'}
          </span>
        </div>
      </div>

      {/* Patch Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEdit && onEdit(patch)
          }}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          title="Edit Patch"
        >
          <Settings size={16} />
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation()
            // Load patch to microKORG
          }}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          title="Load to microKORG"
        >
          <Download size={16} />
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation()
            // Play patch (for preview)
          }}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          title="Preview Patch"
        >
          <Play size={16} />
        </button>
      </div>
    </div>
  )
}
