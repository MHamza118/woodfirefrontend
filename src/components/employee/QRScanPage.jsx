import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { QrCode, Download, MapPin } from 'lucide-react'

const QRScanPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [selectedLocation, setSelectedLocation] = useState('bartlesville')
  const [isTestOpen, setIsTestOpen] = useState(false)
  
  // Check if user is admin or employee to show different UI
  const isAdmin = user?.role === 'admin'

  // Available locations (matching the original QR generator)
  const locations = [
    {
      id: 'bartlesville',
      name: 'Bartlesville - Woodfire.food',
      address: '123 Main Street, Bartlesville, OK 74003',
      phone: '(918) 555-0123',
      email: 'bartlesville@309311restaurants.com'
    },
    {
      id: 'tulsa',
      name: 'Tulsa - Woodfire.food', 
      address: '456 Downtown Ave, Tulsa, OK 74101',
      phone: '(918) 555-0124',
      email: 'tulsa@309311restaurants.com'
    }
  ]

  const selectedLocationData = locations.find(loc => loc.id === selectedLocation)

  const getQRCodeURL = (locationId) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}/onboard/${locationId}`)}`
  }

  const handleDownloadQR = () => {
    const link = document.createElement('a')
    link.href = getQRCodeURL(selectedLocation)
    link.download = `${selectedLocationData?.name.split(' - ')[0]}-QR-Code.png`
    link.click()
  }

  const handleTestLocation = (locationId) => {
    navigate(`/onboard/${locationId}`)
  }

  const handleContinueToOnboarding = () => {
    // For employees, directly proceed to onboarding with selected location
    navigate(`/onboard/${selectedLocation}`)
  }

  return (
    <div className="min-h-screen bg-cream text-charcoal py-4 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl mx-auto my-8 mb-16">
          <div className="bg-white rounded-2xl shadow-2xl relative border border-gold/10">
            {/* Header Section - Matching the image exactly */}
            <div className="bg-brand-navy rounded-t-2xl p-6 text-center relative overflow-hidden">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gold-gradient rounded-lg flex items-center justify-center shadow-lg">
                  <QrCode className="w-6 h-6 text-charcoal" />
                </div>
                <h1 className="font-display text-2xl md:text-3xl font-bold text-cream">
                  {isAdmin ? 'QR Code Generator' : 'Welcome to 309+311!'}
                </h1>
              </div>
              <p className="text-cream/90">
                {isAdmin 
                  ? 'Generate QR codes for restaurant locations to enable employee onboarding'
                  : 'Select your location to begin the onboarding process'
                }
              </p>
            </div>

            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-8 items-start">
                {/* Left Column - Location Selection */}
                <div className="space-y-5">
                  <div>
                    <h3 className="font-display text-xl font-semibold text-charcoal mb-3">
                      Select Location
                    </h3>
                    <select
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="w-full px-3 py-2.5 border border-charcoal/20 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent transition-all"
                    >
                      {locations.map(location => (
                        <option key={location.id} value={location.id}>
                          {location.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Location Details */}
                  {selectedLocationData && (
                    <div className="bg-cream/50 rounded-lg p-4">
                      <h4 className="font-semibold text-charcoal mb-2">
                        {selectedLocationData.name.split(' - ')[0]} Location
                      </h4>
                      <p className="text-charcoal/70 text-sm mb-1">
                        📍 {selectedLocationData.address}
                      </p>
                      <p className="text-charcoal/70 text-sm mb-1">
                        📞 {selectedLocationData.phone}
                      </p>
                      <p className="text-charcoal/70 text-sm">
                        ✉️ {selectedLocationData.email}
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    {isAdmin && (
                      <button
                        onClick={handleDownloadQR}
                        className="w-full bg-gold-gradient text-charcoal font-semibold px-4 py-2.5 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download QR Code
                      </button>
                    )}

                    {isAdmin ? (
                      <div className="relative">
                        <button
                          onClick={() => setIsTestOpen(!isTestOpen)}
                          className="w-full bg-charcoal text-cream font-semibold px-4 py-2.5 rounded-lg hover:bg-charcoal/80 transition-all flex items-center justify-center gap-2"
                        >
                          <MapPin className="w-4 h-4" />
                          Test Onboarding
                        </button>

                        {isTestOpen && (
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white rounded-lg shadow-2xl border border-charcoal/10 overflow-hidden min-w-56 z-50">
                            <div className="p-2">
                              <div className="text-xs text-charcoal/60 px-2 py-1.5 font-medium">
                                Select a location to test:
                              </div>
                              {locations.map(location => (
                                <button
                                  key={location.id}
                                  onClick={() => handleTestLocation(location.id)}
                                  className="w-full text-left px-2 py-1.5 hover:bg-gold/10 rounded transition-colors text-sm text-charcoal"
                                >
                                  <div className="font-medium">{location.name.split(' - ')[0]}</div>
                                  <div className="text-xs text-charcoal/60 truncate">
                                    {location.address}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={handleContinueToOnboarding}
                        className="w-full bg-charcoal text-cream font-semibold px-4 py-2.5 rounded-lg hover:bg-charcoal/80 transition-all flex items-center justify-center gap-2"
                      >
                        <MapPin className="w-4 h-4" />
                        Continue to Onboarding
                      </button>
                    )}
                  </div>
                </div>

                {/* Right Column - QR Code Display */}
                <div className="flex flex-col items-center justify-start">
                  <div className="bg-cream p-5 rounded-xl shadow-lg">
                    <img
                      src={getQRCodeURL(selectedLocation)}
                      alt={`QR Code for ${selectedLocationData?.name.split(' - ')[0]} Location`}
                      className="w-48 h-48 rounded-lg"
                    />
                  </div>

                  <div className="mt-3 text-center">
                    <p className="text-charcoal/70 text-sm">
                      Scan this QR code to start the onboarding process for
                    </p>
                    <p className="font-semibold text-charcoal">
                      {selectedLocationData?.name.split(' - ')[0]} Location
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QRScanPage
