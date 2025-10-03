import { useState } from 'react'
import { Save, Plus, Trash2, QrCode, Download, Copy } from 'lucide-react'

const Settings = ({ userTypes }) => {
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

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-charcoal mb-6">System Settings</h2>
        
        {/* User Types Management */}
        <div className="bg-white rounded-lg shadow p-6">
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
                className="px-4 py-2 bg-gold-gradient text-charcoal rounded-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add
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
        <div className="bg-white rounded-lg shadow p-6 mt-6">
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
        <div className="bg-white rounded-lg shadow p-6 mt-6">
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
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && generateQR()}
                />
                <button
                  onClick={generateQR}
                  disabled={!qrText.trim()}
                  className="px-4 py-2 bg-gold-gradient text-charcoal rounded-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  Generate
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
                      className="px-4 py-2 bg-charcoal text-cream rounded-md hover:bg-charcoal/80 transition-colors flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                    <button
                      onClick={copyQRLink}
                      className="px-4 py-2 bg-gray-100 text-charcoal rounded-md hover:bg-gray-200 transition-colors flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copy Link
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h3 className="text-lg font-medium text-charcoal mb-4">Data Management</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div>
                <h4 className="font-medium text-charcoal">Export Data</h4>
                <p className="text-sm text-charcoal/70">Data export now managed via API</p>
              </div>
              <button 
                disabled
                className="px-4 py-2 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export (API)
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div>
                <h4 className="font-medium text-charcoal">Clear All Data</h4>
                <p className="text-sm text-charcoal/70">Data management now via API - contact administrator</p>
              </div>
              <button 
                disabled
                className="px-4 py-2 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed"
              >
                API Only
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings