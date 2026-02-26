import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Library } from './pages/Library'
import { Editor } from './pages/Editor'
import { Settings } from './pages/Settings'
import { LoadingSpinner } from './components/LoadingSpinner'
import { useToast } from './hooks/useToast'

function App() {
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  useEffect(() => {
    // Check if backend is reachable
    const checkBackend = async () => {
      try {
        const response = await fetch('/api/patches')
        if (!response.ok) {
          throw new Error('Backend not reachable')
        }
      } catch (error) {
        showToast('Backend connection failed. Please make sure the backend server is running.', 'error')
      } finally {
        setLoading(false)
      }
    }

    checkBackend()
  }, [showToast])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/library" element={<Library />} />
          <Route path="/editor" element={<Editor />} />
          <Route path="/editor/:patchId" element={<Editor />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
