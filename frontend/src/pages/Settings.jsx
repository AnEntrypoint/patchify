import { useState, useEffect } from 'react'
import {
  Settings,
  Connection,
  Upload,
  Download,
  Play,
  Save,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { api } from '../services/api'
import { LoadingSpinner } from '../components/LoadingSpinner'

export function Settings() {
  const [settings, setSettings] = useState({
    midi: {
      inputDevice: null,
      outputDevice: null,
      connected: false
    },
    library: {
      autoSave: true,
      backupInterval: 30,
      defaultFormat: 'sysex'
    },
    ui: {
      theme: 'dark',
      language: 'en'
    },
    midiDevices: {
      inputs: [],
      outputs: []
    }
  })

  const [loading, setLoading] = useState(false)
  const [midiStatus, setMidiStatus] = useState('idle')

  useEffect(() => {
    loadSettings()
    loadMidiDevices()
  }, [])

  const loadSettings = async () => {
    try {
      // Load settings from localStorage or backend
      const savedSettings = localStorage.getItem('patchify-settings')
      if (savedSettings) {
        setSettings(prev => ({
          ...prev,
          ...JSON.parse(savedSettings)
        }))
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const loadMidiDevices = async () => {
    try {
      const response = await api.getMidiDevices()
      setSettings(prev => ({
        ...prev,
        midiDevices: response.data
      }))
    } catch (error) {
      console.error('Error loading MIDI devices:', error)
    }
  }

  const saveSettings = async () => {
    try {
      localStorage.setItem('patchify-settings', JSON.stringify(settings))
    } catch (error) {
      console.error('Error saving settings:', error)
    }
  }

  const handleMidiConnect = async () => {
    setLoading(true)
    setMidiStatus('connecting')

    try {
      const response = await api.connectMidi(
        settings.midi.inputDevice,
        settings.midi.outputDevice
      )

      if (response.success) {
        setSettings(prev => ({
          ...prev,
          midi: {
            ...prev.midi,
            connected: true
          }
        }))
        setMidiStatus('success')
      } else {
        setMidiStatus('error')
      }
    } catch (error) {
      setMidiStatus('error')
      console.error('Error connecting to MIDI:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMidiDisconnect = async () => {
    try {
      await api.disconnectMidi()
      setSettings(prev => ({
        ...prev,
        midi: {
          ...prev.midi,
          connected: false
        }
      }))
      setMidiStatus('idle')
    } catch (error) {
      console.error('Error disconnecting from MIDI:', error)
    }
  }

  const handleInputChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-slate-400">Configure your Patchify preferences</p>
      </div>

      {/* Settings Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* MIDI Settings */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
            <Connection size={20} />
            <span>MIDI Settings</span>
          </h2>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-300">Connection Status</span>
              <div className="flex items-center space-x-2">
                <span className={`text-sm ${
                  settings.midi.connected ? 'text-green-400' : 'text-red-400'
                }`}>
                  {settings.midi.connected ? 'Connected' : 'Disconnected'}
                </span>
                <div className={`w-2 h-2 rounded-full ${
                  settings.midi.connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Input Device
                </label>
                <select
                  value={settings.midi.inputDevice || ''}
                  onChange={(e) => handleInputChange('midi', 'inputDevice', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-synth-blue"
                >
                  <option value="">Select Input Device</option>
                  {settings.midiDevices.inputs.map(device => (
                    <option key={device.id} value={device.id}>
                      {device.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Output Device
                </label>
                <select
                  value={settings.midi.outputDevice || ''}
                  onChange={(e) => handleInputChange('midi', 'outputDevice', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-synth-blue"
                >
                  <option value="">Select Output Device</option>
                  {settings.midiDevices.outputs.map(device => (
                    <option key={device.id} value={device.id}>
                      {device.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex space-x-3">
              {settings.midi.connected ? (
                <button
                  onClick={handleMidiDisconnect}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <XCircle size={16} />
                  <span>Disconnect</span>
                </button>
              ) : (
                <button
                  onClick={handleMidiConnect}
                  disabled={!settings.midi.inputDevice || !settings.midi.outputDevice || loading}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <CheckCircle size={16} />
                  )}
                  <span>{loading ? 'Connecting...' : 'Connect'}</span>
                </button>
              )}

              <button
                onClick={loadMidiDevices}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg transition-colors flex items-center justify-center"
                title="Refresh Devices"
              >
                <Connection size={16} />
              </button>
            </div>

            {midiStatus === 'success' && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center space-x-2 text-sm text-green-400">
                <CheckCircle size={16} />
                <span>Successfully connected to microKORG</span>
              </div>
            )}

            {midiStatus === 'error' && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center space-x-2 text-sm text-red-400">
                <AlertTriangle size={16} />
                <span>Failed to connect to microKORG</span>
              </div>
            )}
          </div>
        </div>

        {/* Library Settings */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
            <Settings size={20} />
            <span>Library Settings</span>
          </h2>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Auto Save
                </label>
                <p className="text-xs text-slate-500">
                  Automatically save changes to patches
                </p>
              </div>
              <button
                onClick={() => handleInputChange('library', 'autoSave', !settings.library.autoSave)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.library.autoSave ? 'bg-synth-blue' : 'bg-slate-600'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${
                  settings.library.autoSave ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Auto Save Interval (seconds)
              </label>
              <input
                type="number"
                value={settings.library.backupInterval}
                onChange={(e) => handleInputChange('library', 'backupInterval', parseInt(e.target.value))}
                min="10"
                max="300"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-synth-blue"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Default File Format
              </label>
              <select
                value={settings.library.defaultFormat}
                onChange={(e) => handleInputChange('library', 'defaultFormat', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-synth-blue"
              >
                <option value="sysex">SYSEX (.syx)</option>
                <option value="prg">PRG (.prg)</option>
                <option value="json">JSON (.json)</option>
              </select>
            </div>
          </div>
        </div>

        {/* UI Settings */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
            <Settings size={20} />
            <span>UI Settings</span>
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Theme
              </label>
              <select
                value={settings.ui.theme}
                onChange={(e) => handleInputChange('ui', 'theme', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-synth-blue"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="system">System</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Language
              </label>
              <select
                value={settings.ui.language}
                onChange={(e) => handleInputChange('ui', 'language', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-synth-blue"
              >
                <option value="en">English</option>
                <option value="ja">日本語</option>
                <option value="de">Deutsch</option>
                <option value="fr">Français</option>
              </select>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
            <Settings size={20} />
            <span>About Patchify</span>
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Version</h3>
              <p className="text-slate-400">1.0.0</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
              <p className="text-slate-400 text-sm">
                Patchify is a comprehensive patch library editor for the KORG microKORG synthesizer, 
                allowing you to import, export, and organize your patches with ease.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Dependencies</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-center space-x-2">
                  <CheckCircle size={14} className="text-green-400" />
                  <span>Open-microKORG</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle size={14} className="text-green-400" />
                  <span>Python-RtMidi</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle size={14} className="text-green-400" />
                  <span>React</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle size={14} className="text-green-400" />
                  <span>Tailwind CSS</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex justify-end space-x-3">
        <button
          onClick={saveSettings}
          className="px-6 py-2 bg-synth-blue hover:bg-synth-blue/90 text-white rounded-lg transition-colors flex items-center space-x-2"
        >
          <Save size={16} />
          <span>Save Settings</span>
        </button>
      </div>
    </div>
  )
}
