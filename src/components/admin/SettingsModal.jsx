import { useState } from 'react'
import { X, Save, Plus, Trash2, QrCode, Download, Copy } from 'lucide-react'

const SettingsModal = ({ isOpen, onClose, userTypes }) => {
  const [customUserTypes, setCustomUserTypes] = useState(() => {
    const stored = localStorage.getItem('customUserTypes')
    return stored ? JSON.parse(stored) : []
  })
  const [newUserType, setNewUserType] = useState('')
  const [qrText, setQrText] = useState('')
  const [generatedQR, setGeneratedQR] = useState('')

  const addUserType = () => {
    if (newUserType.trim() && !userTypes.includes(newUserType) && !customUserTypes.includes(newUserType)) {
      const updated = [...customUserTypes, newUserType.trim()]
      setCustomUserTypes(updated)
      localStorage.setItem('customUserTypes', JSON.stringify(updated))
      setNewUserType('')
    }
  }

  const removeUserType = (typeToRemove) => {
    const updated = customUserTypes.filter(type => type !== typeToRemove)
    setCustomUserTypes(updated)
    localStorage.setItem('customUserTypes', JSON.stringify(updated))
  }

  const allUserTypes = [...userTypes, ...customUserTypes]

  const generateQR = () => {
    if (qrText.trim()) {
      // Using QR Server API for QR code generation
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrText)}`
      setGeneratedQR(qrUrl)
    }
  }

  const downloadQR = () => {
    if (generatedQR) {
      const link = document.createElement('a')
      link.href = generatedQR
      link.download = 'qr-code.png'
      link.click()
    }
  }

  const copyQRLink = () => {
    if (generatedQR) {
      navigator.clipboard.writeText(generatedQR)
      alert('QR code link copied to clipboard!')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-xl sm:text-2xl font-bold text-charcoal">System Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
          {/* User Types Management */}
          <div className="bg-gray-50 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-charcoal mb-4">User Types</h3>
            
            {/* Default User Types */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-charcoal/70 mb-3">Default User Types</h4>
              <div className="flex flex-wrap gap-2">
                {userTypes.map(type => (
                  <span
                    key={type}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>

            {/* Custom User Types */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-charcoal/70 mb-3">Custom User Types</h4>
              {customUserTypes.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-4">
                  {customUserTypes.map(type => (
                    <span
                      key={type}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gold/10 text-gold-dark"
                    >
                      {type}
                      <button
                        onClick={() => removeUserType(type)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mb-4">No custom user types added yet.</p>
              )}

              {/* Add New User Type */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newUserType}
                  onChange={(e) => setNewUserType(e.target.value)}
                  placeholder="Enter new user type"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && addUserType()}
                />
                <button
                  onClick={addUserType}
                  disabled={!newUserType.trim()}
                  className="px-4 py-2 bg-gold-gradient text-charcoal rounded-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mobile-hide-button-icons"
                >
                  <Plus className="w-4 h-4" />
                  <span className="mobile-text-content">Add</span>
                </button>
              </div>
            </div>

            {/* All User Types Summary */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-charcoal/70 mb-3">
                All Available User Types ({allUserTypes.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {allUserTypes.map(type => (
                  <span
                    key={type}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                      userTypes.includes(type)
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-gold/10 text-gold-dark'
                    }`}
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* System Information */}
          <div className="bg-gray-50 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-charcoal mb-4">System Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-charcoal/70">Version:</span>
                <span className="ml-2 text-charcoal">1.0.0</span>
              </div>
              <div>
                <span className="font-medium text-charcoal/70">Last Updated:</span>
                <span className="ml-2 text-charcoal">{new Date().toLocaleDateString()}</span>
              </div>
              <div>
                <span className="font-medium text-charcoal/70">Storage:</span>
                <span className="ml-2 text-charcoal">Local Storage</span>
              </div>
              <div>
                <span className="font-medium text-charcoal/70">Environment:</span>
                <span className="ml-2 text-charcoal">Development</span>
              </div>
            </div>
          </div>

          {/* QR Code Generator */}
          <div className="bg-gray-50 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-charcoal mb-4 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-gold" />
              QR Code Generator
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal/70 mb-2">
                  Enter text or URL to generate QR code:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={qrText}
                    onChange={(e) => setQrText(e.target.value)}
                    placeholder="Enter text, URL, or data for QR code"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent min-w-0"
                    onKeyPress={(e) => e.key === 'Enter' && generateQR()}
                  />
                  <button
                    onClick={generateQR}
                    disabled={!qrText.trim()}
                    className="px-4 py-2 bg-gold-gradient text-charcoal rounded-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mobile-hide-button-icons whitespace-nowrap"
                  >
                    <QrCode className="w-4 h-4" />
                    <span className="mobile-text-content">Generate</span>
                  </button>
                </div>
              </div>

              {generatedQR && (
                <div className="border-t pt-4">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                      <img 
                        src={generatedQR} 
                        alt="Generated QR Code" 
                        className="w-48 h-48"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={downloadQR}
                        className="px-4 py-2 bg-charcoal text-cream rounded-md hover:bg-charcoal/80 transition-colors flex items-center gap-2 mobile-hide-button-icons"
                      >
                        <Download className="w-4 h-4" />
                        <span className="mobile-text-content">Download</span>
                      </button>
                      <button
                        onClick={copyQRLink}
                        className="px-4 py-2 bg-gray-100 text-charcoal rounded-md hover:bg-gray-200 transition-colors flex items-center gap-2 mobile-hide-button-icons"
                      >
                        <Copy className="w-4 h-4" />
                        <span className="mobile-text-content">Copy Link</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-gray-50 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-charcoal mb-4">Data Management</h3>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-yellow-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-charcoal">Export Data</h4>
                  <p className="text-sm text-charcoal/70">Download all admin users and locations data</p>
                </div>
                <button 
                  onClick={() => {
                    const data = {
                      adminUsers: JSON.parse(localStorage.getItem('adminUsers') || '[]'),
                      adminLocations: JSON.parse(localStorage.getItem('adminLocations') || '[]'),
                      customUserTypes: JSON.parse(localStorage.getItem('customUserTypes') || '[]'),
                      employees: JSON.parse(localStorage.getItem('employees') || '[]'),
                      exportDate: new Date().toISOString()
                    }
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const link = document.createElement('a')
                    link.href = url
                    link.download = `restaurant-data-${new Date().toISOString().split('T')[0]}.json`
                    link.click()
                    URL.revokeObjectURL(url)
                  }}
                  className="px-4 py-2 bg-charcoal text-cream rounded-md hover:bg-charcoal/80 transition-colors flex items-center gap-2 mobile-hide-button-icons whitespace-nowrap"
                >
                  <Download className="w-4 h-4" />
                  <span className="mobile-text-content">Export</span>
                </button>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-red-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-charcoal">Clear All Data</h4>
                  <p className="text-sm text-charcoal/70">Remove all admin users and locations (cannot be undone)</p>
                </div>
                <button 
                  onClick={() => {
                    if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
                      localStorage.removeItem('adminUsers')
                      localStorage.removeItem('adminLocations')
                      localStorage.removeItem('customUserTypes')
                      window.location.reload()
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors whitespace-nowrap"
                >
                  Clear Data
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsModal
