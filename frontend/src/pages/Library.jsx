import { useState, useEffect } from 'react'
import {
  Search,
  Filter,
  SortAsc,
  Import,
  Export,
  Plus,
  Download,
  Upload,
  Music,
  Settings
} from 'lucide-react'
import { api } from '../services/api'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { PatchCard } from '../components/PatchCard'

export function Library() {
  const [patches, setPatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedPatches, setSelectedPatches] = useState([])

  useEffect(() => {
    loadPatches()
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
      const patchIds = selectedPatches
      const response = await api.exportPatches(patchIds)
      if (response.success) {
        console.log('Export successful')
      }
    } catch (error) {
      console.error('Error exporting patches:', error)
    }
  }

  const handleSelectPatch = (patchId) => {
    setSelectedPatches(prev => 
      prev.includes(patchId)
        ? prev.filter(id => id !== patchId)
        : [...prev, patchId]
    )
  }

  const handleSelectAll = () => {
    if (selectedPatches.length === filteredPatches.length) {
      setSelectedPatches([])
    } else {
      setSelectedPatches(filteredPatches.map(p => p.id))
    }
  }

  const filteredPatches = patches.filter(patch => {
    const matchesSearch = patch.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || patch.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categories = ['all', 'bass', 'lead', 'pad', 'arp', 'fx']

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Patch Library</h1>
        <p className="text-slate-400">Manage your microKORG patches</p>
      </div>

      {/* Toolbar */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search patches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-synth-blue"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-synth-blue"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>

          <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg transition-colors flex items-center justify-center space-x-2">
            <SortAsc size={16} />
            <span>Sort</span>
          </button>

          <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg transition-colors flex items-center justify-center space-x-2">
            <Filter size={16} />
            <span>Filter</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleImportPatches}
            className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-1"
          >
            <Import size={14} />
            <span>Import</span>
          </button>

          <button
            onClick={handleExportPatches}
            disabled={selectedPatches.length === 0}
            className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-1"
          >
            <Export size={14} />
            <span>Export</span>
          </button>

          <button className="px-3 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center space-x-1">
            <Download size={14} />
            <span>Save</span>
          </button>

          <button className="px-3 py-1 text-xs bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors flex items-center space-x-1">
            <Upload size={14} />
            <span>Load</span>
          </button>

          <button className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-1">
            <Plus size={14} />
            <span>New</span>
          </button>
        </div>
      </div>

      {/* Patch Grid */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">
            {filteredPatches.length} patch{filteredPatches.length !== 1 ? 'es' : ''} found
          </h2>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-slate-400">Select:</label>
            <button
              onClick={handleSelectAll}
              className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg transition-colors"
            >
              {selectedPatches.length === filteredPatches.length ? 'None' : 'All'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner />
          </div>
        ) : filteredPatches.length === 0 ? (
          <div className="text-center py-12 bg-slate-800 rounded-lg border border-slate-700">
            <Music className="mx-auto text-slate-500 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-white mb-2">No patches found</h3>
            <p className="text-slate-400 mb-4">
              {searchQuery || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filter settings'
                : 'Import patches from your microKORG to get started'}
            </p>
            {!searchQuery && selectedCategory === 'all' && (
              <button
                onClick={handleImportPatches}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Import from microKORG
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPatches.map(patch => (
              <PatchCard
                key={patch.id}
                patch={patch}
                selected={selectedPatches.includes(patch.id)}
                onSelect={() => handleSelectPatch(patch.id)}
                onEdit={() => console.log('Edit patch:', patch)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Statistics */}
      {filteredPatches.length > 0 && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Library Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-100">{filteredPatches.length}</p>
              <p className="text-sm text-slate-400">Total Patches</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-100">{selectedPatches.length}</p>
              <p className="text-sm text-slate-400">Selected</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-100">
                {Math.round(filteredPatches.length / patches.length * 100)}%
              </p>
              <p className="text-sm text-slate-400">of Library</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-100">0</p>
              <p className="text-sm text-slate-400">Modified</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
