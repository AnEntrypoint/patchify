import { useState, createContext, useContext } from 'react'

const ToastContext = createContext()

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = (message, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    
    // Auto remove toast after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }, 5000)
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const contextValue = {
    showToast,
    removeToast
  }

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`
              flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm
              ${
                toast.type === 'error'
                  ? 'bg-red-500/90 border border-red-400 text-white'
                  : toast.type === 'success'
                  ? 'bg-green-500/90 border border-green-400 text-white'
                  : toast.type === 'warning'
                  ? 'bg-yellow-500/90 border border-yellow-400 text-white'
                  : 'bg-synth-blue/90 border border-synth-blue text-white'
              }
            `}
          >
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-white/80 hover:text-white"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
