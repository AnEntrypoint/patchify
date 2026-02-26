import axios from 'axios'

// Create API instance
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add response interceptor
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

// Patch Management
export const getPatches = () => api.get('/patches')
export const getPatch = (id) => api.get(`/patches/${id}`)
export const createPatch = (patchData) => api.post('/patches', patchData)
export const updatePatch = (id, patchData) => api.put(`/patches/${id}`, patchData)
export const deletePatch = (id) => api.delete(`/patches/${id}`)

// Patch Operations
export const importPatches = () => api.post('/patches/import')
export const exportPatches = (patchIds) => api.post('/patches/export', { patch_ids: patchIds })
export const importFromFile = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/patches/import/file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
export const exportToFile = (patchIds, format = 'sysex', filePath = null) =>
  api.post('/patches/export/file', { patch_ids: patchIds, format, file_path: filePath })

// Search and Filter
export const searchPatches = (query, field = 'name') =>
  api.get(`/search?q=${encodeURIComponent(query)}&field=${field}`)
export const sortPatches = (field = 'name', direction = 'asc') =>
  api.post('/sort', { field, direction })
export const filterPatches = (filters) =>
  api.post('/filter', { filters })

// MIDI Operations
export const getMidiDevices = () => api.get('/midi/devices')
export const connectMidi = (inputDevice, outputDevice) =>
  api.post('/midi/connect', { input_device: inputDevice, output_device: outputDevice })
export const disconnectMidi = () => api.post('/midi/disconnect')
export const getMidiStatus = () => api.get('/midi/status')

// Export all API functions
export default {
  getPatches,
  getPatch,
  createPatch,
  updatePatch,
  deletePatch,
  importPatches,
  exportPatches,
  importFromFile,
  exportToFile,
  searchPatches,
  sortPatches,
  filterPatches,
  getMidiDevices,
  connectMidi,
  disconnectMidi,
  getMidiStatus
}
