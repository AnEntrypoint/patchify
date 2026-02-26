import { useState, useEffect } from 'react'
import {
  Upload,
  Download,
  Database,
  Search,
  Play,
  Settings,
  Filter,
  SortAsc,
  Mic2,
  Plus,
  Music
} from 'lucide-react'
import { api } from '../services/api'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { PatchCard } from '../components/PatchCard'

export function Dashboard() {
  const [patches, setPatches] = useState([])
  const [midiStatus, setMidiStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    loadPatches()
    checkMidiStatus()
  }, [])

  const loadPatches = async () => {
    try {
      const response = await api.getPatches()
      setPatches(response.data)
    } catch (error) {
      console.error('Error loading patches:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkMidiStatus = async () => {
    try {
      const response = await api.getMidiStatus()
      setMidiStatus(response.data)
    } catch (error) {
      console.error('Error checking MIDI status:', error)
    }
  }

  const handleImportPatches = async () => {
    try {
      const response = await api.importPatches()
      if (response.success) {
        loadPatches()
      }
    } catch (error) {
      console.error('Error importing patches:', error)
    }
  }

  const handleExportPatches = async () => {
    try {
      const patchIds = patches.map(p => p.id)
      const response = await api.exportPatches(patchIds)
      if (response.success) {
        console.log('Export successful')
      }
    } catch (error) {
      console.error('Error exporting patches:', error)
    }
  }

  const filteredPatches = patches.filter(patch => {
    const matchesSearch = patch.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || patch.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-slate-400">Manage your microKORG patch library</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Library Size</p>
              <p className="text-3xl font-bold text-white">{patches.length} patches</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Database className="text-blue-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">MIDI Connection</p>
              <p className={`text-3xl font-bold ${midiStatus?.connected ? 'text-green-400' : 'text-red-400'}`}>
                {midiStatus?.connected ? 'Connected' : 'Disconnected'}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${midiStatus?.connected ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              <Mic2 className={`${midiStatus?.connected ? 'text-green-400' : 'text-red-400'}`} size={24} />
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Active Presets</p>
              <p className="text-3xl font-bold text-white">0</p>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Music className="text-purple-400" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={handleImportPatches}
              disabled={!midiStatus?.connected}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <Download size={20} />
              <span>Import from microKORG</span>
            </button>
            
            <button
              onClick={handleExportPatches}
              disabled={!midiStatus?.connected || patches.length === 0}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <Upload size={20} />
              <span>Export to microKORG</span>
            </button>
            
            <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
              <Plus size={20} />
              <span>Create New Patch</span>
            </button>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Patches</h3>
          <div className="space-y-2">
            {patches.slice(0, 5).map(patch => (
              <div key={patch.id} className="flex items-center justify-between p-2 hover:bg-slate-700 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Music className="text-slate-400" size={16} />
                  <span className="text-sm text-slate-300">{patch.name}</span>
                </div>
                <button className="text-xs text-slate-400 hover:text-white">Load</button>
              </div>
            ))}
            {patches.length === 0 && (
              <div className="text-center py-4 text-slate-500">
                No patches in library. Import from microKORG to get started.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Patches Grid */}
      {patches.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Patch Library</h3>
            <div className="flex items-center space-x-2">
              <button className="p-2 text-slate-400 hover:text-white">
                <SortAsc size={20} />
              </button>
              <button className="p-2 text-slate-400 hover:text-white">
                <Filter size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPatches.slice(0, 6).map(patch => (
              <PatchCard key={patch.id} patch={patch} onSelect={() => console.log('Patch selected:', patch)} />
            ))}
          </div>

          {filteredPatches.length > 6 && (
            <div className="mt-8 flex justify-center">
              <button className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
                View All Patches
              </button>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      )}
    </div>
  )
}
