import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Home,
  Library,
  Edit3,
  Settings,
  Mic2,
  ArrowLeft,
  ArrowRight,
  Search,
  Plus,
  Save,
  Upload,
  Download,
  Music,
  Settings2
} from 'lucide-react'
import { useToast } from '../hooks/useToast'
import { api } from '../services/api'

export function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const location = useLocation()
  const { showToast } = useToast()

  useEffect(() => {
    checkMidiConnection()
  }, [])

  const checkMidiConnection = async () => {
    try {
      const response = await api.getMidiStatus()
      setIsConnected(response.data.connected)
    } catch (error) {
      setIsConnected(false)
    }
  }

  const navItems = [
    {
      path: '/dashboard',
      name: 'Dashboard',
      icon: Home
    },
    {
      path: '/library',
      name: 'Patch Library',
      icon: Library
    },
    {
      path: '/editor',
      name: 'Patch Editor',
      icon: Edit3
    },
    {
      path: '/settings',
      name: 'Settings',
      icon: Settings
    }
  ]

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Top Navigation */}
      <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-slate-400 hover:text-white"
            >
              {sidebarOpen ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-synth-blue to-synth-purple rounded-lg flex items-center justify-center">
                <Music className="text-white" size={20} />
              </div>
              <h1 className="text-xl font-bold text-white">Patchify</h1>
            </div>

            <div className="hidden md:flex items-center space-x-2 ml-6">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
              <span className={`text-sm ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                {isConnected ? 'microKORG Connected' : 'microKORG Disconnected'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search patches..."
                className="pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-synth-blue"
              />
            </div>
            
            <button
              onClick={() => checkMidiConnection()}
              className="p-2 text-slate-400 hover:text-white"
              title="Refresh Connection Status"
            >
              <Settings2 size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <aside
          className={`
            bg-slate-800 border-r border-slate-700
            transition-all duration-300 ease-in-out
            ${sidebarOpen ? 'w-64' : 'w-0 lg:w-0'}
            overflow-hidden fixed lg:static z-20
            h-full
          `}
        >
          <div className="p-4">
            <nav className="space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `
                    flex items-center space-x-3 px-4 py-3 rounded-lg
                    transition-all duration-200
                    ${
                      isActive
                        ? 'bg-synth-blue/20 text-synth-blue border border-synth-blue/30'
                        : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                    }
                    `
                  }
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.name}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="text-xs text-slate-400 mb-2">SYSTEM STATUS</div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">microKORG</span>
                <span className={`px-2 py-1 text-xs rounded-full ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-900">
          {children}
        </main>
      </div>
    </div>
  )
}
