import { useState, useEffect } from 'react'
import {
  Save,
  Download,
  Upload,
  Copy,
  Trash2,
  Music,
  Settings2,
  Plus,
  Minus
} from 'lucide-react'
import { api } from '../services/api'
import { LoadingSpinner } from '../components/LoadingSpinner'

export function Editor() {
  const [patch, setPatch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isDirty, setIsDirty] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadPatch()
  }, [])

  const loadPatch = async () => {
    try {
      // For now, create a default patch
      const defaultPatch = {
        id: 1,
        name: 'New Patch',
        voice_mode: 'single',
        parameters: {
          kbd_octave: 0,
          arpeggio_type: 'up',
          arpeggio_range: 1,
          arpeggio_gate: 50,
          modfx_type: 'chorus',
          modfx_depth: 50,
          modfx_rate: 30,
          delay_type: 'stereo',
          delay_time: 40,
          delay_depth: 30,
          eq_low_freq: 100,
          eq_low_gain: 0,
          eq_high_freq: 4000,
          eq_high_gain: 0
        },
        timbres: [
          {
            osc1: {
              waveform: 'saw',
              level: 100,
              semitone: 0,
              tune: 0
            },
            osc2: {
              waveform: 'square',
              level: 80,
              semitone: -12,
              tune: 0
            },
            filter: {
              type: '24lpf',
              cutoff: 80,
              resonance: 30
            },
            eg1: {
              attack: 10,
              decay: 50,
              sustain: 70,
              release: 60
            },
            eg2: {
              attack: 0,
              decay: 30,
              sustain: 100,
              release: 0
            },
            lfo1: {
              waveform: 'triangle',
              frequency: 20,
              sync_note: '1/8'
            },
            lfo2: {
              waveform: 'square',
              frequency: 5,
              sync_note: '1/4'
            }
          }
        ]
      }
      
      setPatch(defaultPatch)
    } catch (error) {
      console.error('Error loading patch:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSavePatch = async () => {
    try {
      if (patch.id) {
        await api.updatePatch(patch.id, patch)
      } else {
        await api.createPatch(patch)
      }
      setIsDirty(false)
    } catch (error) {
      console.error('Error saving patch:', error)
    }
  }

  const handleParameterChange = (section, parameter, value) => {
    setPatch(prev => {
      const newPatch = { ...prev }
      
      if (section === 'patch') {
        newPatch[parameter] = value
      } else if (section === 'parameters') {
        newPatch.parameters[parameter] = value
      } else if (section === 'timbre') {
        newPatch.timbres[0][parameter] = value
      } else if (section === 'osc1' || section === 'osc2' || section === 'filter' || 
                 section === 'eg1' || section === 'eg2' || section === 'lfo1' || section === 'lfo2') {
        newPatch.timbres[0][section][parameter] = value
      }
      
      return newPatch
    })
    setIsDirty(true)
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Patch Info</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Patch Name</label>
                  <input
                    type="text"
                    value={patch.name}
                    onChange={(e) => handleParameterChange('patch', 'name', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-synth-blue"
                    maxLength={12}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Voice Mode</label>
                  <select
                    value={patch.voice_mode}
                    onChange={(e) => handleParameterChange('patch', 'voice_mode', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-synth-blue"
                  >
                    <option value="single">Single</option>
                    <option value="layer">Layer</option>
                    <option value="vocoder">Vocoder</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Global Parameters</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Keyboard Octave</label>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleParameterChange('parameters', 'kbd_octave', Math.max(-3, patch.parameters.kbd_octave - 1))}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      type="number"
                      value={patch.parameters.kbd_octave}
                      onChange={(e) => handleParameterChange('parameters', 'kbd_octave', parseInt(e.target.value))}
                      min="-3"
                      max="3"
                      className="w-20 px-2 py-1 text-center bg-slate-700 border border-slate-600 rounded-lg text-slate-100"
                    />
                    <button
                      onClick={() => handleParameterChange('parameters', 'kbd_octave', Math.min(3, patch.parameters.kbd_octave + 1))}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'oscillators':
        return (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">Oscillator 1</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Waveform</label>
                  <select
                    value={patch.timbres[0].osc1.waveform}
                    onChange={(e) => handleParameterChange('osc1', 'waveform', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-synth-blue"
                  >
                    <option value="saw">Sawtooth</option>
                    <option value="square">Square</option>
                    <option value="triangle">Triangle</option>
                    <option value="sine">Sine</option>
                    <option value="vox">Vox Wave</option>
                    <option value="dwgs">DWGS</option>
                    <option value="noise">Noise</option>
                    <option value="audio">Audio In</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Level</label>
                  <input
                    type="range"
                    value={patch.timbres[0].osc1.level}
                    onChange={(e) => handleParameterChange('osc1', 'level', parseInt(e.target.value))}
                    min="0"
                    max="127"
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>0</span>
                    <span>{patch.timbres[0].osc1.level}</span>
                    <span>127</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Semitone Detune</label>
                  <input
                    type="range"
                    value={patch.timbres[0].osc1.semitone}
                    onChange={(e) => handleParameterChange('osc1', 'semitone', parseInt(e.target.value))}
                    min="-24"
                    max="24"
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>-24</span>
                    <span>{patch.timbres[0].osc1.semitone}</span>
                    <span>24</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">Oscillator 2</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Waveform</label>
                  <select
                    value={patch.timbres[0].osc2.waveform}
                    onChange={(e) => handleParameterChange('osc2', 'waveform', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-synth-blue"
                  >
                    <option value="saw">Sawtooth</option>
                    <option value="square">Square</option>
                    <option value="triangle">Triangle</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Level</label>
                  <input
                    type="range"
                    value={patch.timbres[0].osc2.level}
                    onChange={(e) => handleParameterChange('osc2', 'level', parseInt(e.target.value))}
                    min="0"
                    max="127"
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>0</span>
                    <span>{patch.timbres[0].osc2.level}</span>
                    <span>127</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Semitone Detune</label>
                  <input
                    type="range"
                    value={patch.timbres[0].osc2.semitone}
                    onChange={(e) => handleParameterChange('osc2', 'semitone', parseInt(e.target.value))}
                    min="-24"
                    max="24"
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>-24</span>
                    <span>{patch.timbres[0].osc2.semitone}</span>
                    <span>24</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'filter':
        return (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">Filter</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Type</label>
                  <select
                    value={patch.timbres[0].filter.type}
                    onChange={(e) => handleParameterChange('filter', 'type', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-synth-blue"
                  >
                    <option value="24lpf">24dB LPF</option>
                    <option value="12lpf">12dB LPF</option>
                    <option value="12bpf">12dB BPF</option>
                    <option value="12hpf">12dB HPF</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Cutoff</label>
                  <input
                    type="range"
                    value={patch.timbres[0].filter.cutoff}
                    onChange={(e) => handleParameterChange('filter', 'cutoff', parseInt(e.target.value))}
                    min="0"
                    max="127"
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>0</span>
                    <span>{patch.timbres[0].filter.cutoff}</span>
                    <span>127</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Resonance</label>
                  <input
                    type="range"
                    value={patch.timbres[0].filter.resonance}
                    onChange={(e) => handleParameterChange('filter', 'resonance', parseInt(e.target.value))}
                    min="0"
                    max="127"
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>0</span>
                    <span>{patch.timbres[0].filter.resonance}</span>
                    <span>127</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'envelopes':
        return (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">EG1 (Filter)</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Attack</label>
                  <input
                    type="range"
                    value={patch.timbres[0].eg1.attack}
                    onChange={(e) => handleParameterChange('eg1', 'attack', parseInt(e.target.value))}
                    min="0"
                    max="127"
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>0</span>
                    <span>{patch.timbres[0].eg1.attack}</span>
                    <span>127</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Decay</label>
                  <input
                    type="range"
                    value={patch.timbres[0].eg1.decay}
                    onChange={(e) => handleParameterChange('eg1', 'decay', parseInt(e.target.value))}
                    min="0"
                    max="127"
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>0</span>
                    <span>{patch.timbres[0].eg1.decay}</span>
                    <span>127</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Sustain</label>
                  <input
                    type="range"
                    value={patch.timbres[0].eg1.sustain}
                    onChange={(e) => handleParameterChange('eg1', 'sustain', parseInt(e.target.value))}
                    min="0"
                    max="127"
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>0</span>
                    <span>{patch.timbres[0].eg1.sustain}</span>
                    <span>127</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Release</label>
                  <input
                    type="range"
                    value={patch.timbres[0].eg1.release}
                    onChange={(e) => handleParameterChange('eg1', 'release', parseInt(e.target.value))}
                    min="0"
                    max="127"
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>0</span>
                    <span>{patch.timbres[0].eg1.release}</span>
                    <span>127</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">EG2 (Amp)</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Attack</label>
                  <input
                    type="range"
                    value={patch.timbres[0].eg2.attack}
                    onChange={(e) => handleParameterChange('eg2', 'attack', parseInt(e.target.value))}
                    min="0"
                    max="127"
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>0</span>
                    <span>{patch.timbres[0].eg2.attack}</span>
                    <span>127</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Decay</label>
                  <input
                    type="range"
                    value={patch.timbres[0].eg2.decay}
                    onChange={(e) => handleParameterChange('eg2', 'decay', parseInt(e.target.value))}
                    min="0"
                    max="127"
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>0</span>
                    <span>{patch.timbres[0].eg2.decay}</span>
                    <span>127</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Sustain</label>
                  <input
                    type="range"
                    value={patch.timbres[0].eg2.sustain}
                    onChange={(e) => handleParameterChange('eg2', 'sustain', parseInt(e.target.value))}
                    min="0"
                    max="127"
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>0</span>
                    <span>{patch.timbres[0].eg2.sustain}</span>
                    <span>127</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Release</label>
                  <input
                    type="range"
                    value={patch.timbres[0].eg2.release}
                    onChange={(e) => handleParameterChange('eg2', 'release', parseInt(e.target.value))}
                    min="0"
                    max="127"
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>0</span>
                    <span>{patch.timbres[0].eg2.release}</span>
                    <span>127</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'lfo':
        return (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">LFO 1</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Waveform</label>
                  <select
                    value={patch.timbres[0].lfo1.waveform}
                    onChange={(e) => handleParameterChange('lfo1', 'waveform', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-synth-blue"
                  >
                    <option value="saw">Sawtooth</option>
                    <option value="square">Square</option>
                    <option value="triangle">Triangle</option>
                    <option value="sh">Sample/Hold</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Frequency</label>
                  <input
                    type="range"
                    value={patch.timbres[0].lfo1.frequency}
                    onChange={(e) => handleParameterChange('lfo1', 'frequency', parseInt(e.target.value))}
                    min="0"
                    max="127"
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>0</span>
                    <span>{patch.timbres[0].lfo1.frequency}</span>
                    <span>127</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">LFO 2</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Waveform</label>
                  <select
                    value={patch.timbres[0].lfo2.waveform}
                    onChange={(e) => handleParameterChange('lfo2', 'waveform', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-synth-blue"
                  >
                    <option value="saw">Sawtooth</option>
                    <option value="square">Square</option>
                    <option value="triangle">Triangle</option>
                    <option value="sh">Sample/Hold</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Frequency</label>
                  <input
                    type="range"
                    value={patch.timbres[0].lfo2.frequency}
                    onChange={(e) => handleParameterChange('lfo2', 'frequency', parseInt(e.target.value))}
                    min="0"
                    max="127"
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>0</span>
                    <span>{patch.timbres[0].lfo2.frequency}</span>
                    <span>127</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">{patch.name}</h1>
        <p className="text-slate-400">Edit your patch parameters</p>
      </div>

      {/* Toolbar */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSavePatch}
              disabled={!isDirty}
              className="px-4 py-2 bg-synth-blue hover:bg-synth-blue/90 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              <Save size={16} />
              <span>Save</span>
            </button>
            
            <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg transition-colors flex items-center space-x-2">
              <Download size={16} />
              <span>Save As...</span>
            </button>
            
            <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg transition-colors flex items-center space-x-2">
              <Copy size={16} />
              <span>Duplicate</span>
            </button>
            
            <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-2">
              <Trash2 size={16} />
              <span>Delete</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {isDirty && (
              <span className="text-sm text-yellow-400 animate-pulse">
                Unsaved changes
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="border-b border-slate-700">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: Music },
              { id: 'oscillators', label: 'Oscillators', icon: Settings2 },
              { id: 'filter', label: 'Filter', icon: Settings2 },
              { id: 'envelopes', label: 'Envelopes', icon: Settings2 },
              { id: 'lfo', label: 'LFO', icon: Settings2 },
              { id: 'modulation', label: 'Modulation', icon: Settings2 },
              { id: 'effects', label: 'Effects', icon: Settings2 },
              { id: 'arpeggio', label: 'Arpeggio', icon: Settings2 }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-synth-blue text-synth-blue'
                    : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-500'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {renderTabContent()}
      </div>
    </div>
  )
}
