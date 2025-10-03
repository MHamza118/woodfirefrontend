import { useState } from 'react'
import { QrCode, Download, MapPin, ChevronDown } from 'lucide-react'
import { getAllLocations } from '../data/locations'

const QRCodeGenerator = () => {
  const [selectedLocation, setSelectedLocation] = useState('bartlesville')
  const [isTestOpen, setIsTestOpen] = useState(false)
  const locations = getAllLocations()

  // Generate QR code URL for the selected location
  const getQRCodeURL = (locationId) => {
    // Always use current domain - works for both development and production
    const baseURL = window.location.origin
    const targetURL = `${baseURL}/onboard/${locationId}`

    // Using QR Server API for QR code generation
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(targetURL)}&bgcolor=FAF9F6&color=1C1C1C&margin=20`
  }



  const handleDownloadQR = () => {
    const qrURL = getQRCodeURL(selectedLocation)
    const link = document.createElement('a')
    link.href = qrURL
    link.download = `qr-code-${selectedLocation}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleTestLocation = (locationId) => {
    const baseURL = window.location.origin
    const testURL = `${baseURL}/onboard/${locationId}`
    window.open(testURL, '_blank')
    setIsTestOpen(false)
  }

  const selectedLocationData = locations.find(loc => loc.id === selectedLocation)

  return (
    <div className="min-h-screen bg-cream text-charcoal py-6 xs:py-12 px-3 xs:px-4 pb-6 xs:pb-8">
      <div className="max-w-3xl mx-auto my-4 xs:my-8 mb-6 xs:mb-8">
        <div className="bg-white rounded-xl xs:rounded-2xl shadow-2xl relative border border-gold/10">

          {/* Header */}
          <div className="bg-brand-navy p-4 xs:p-6 md:p-8 text-center border-b border-gold/20 rounded-t-xl xs:rounded-t-2xl">
            <div className="flex items-center justify-center gap-2 xs:gap-3 mb-2 xs:mb-3">
              <div className="w-8 h-8 xs:w-10 xs:h-10 bg-gold-gradient rounded-lg flex items-center justify-center shadow-lg">
                <QrCode className="w-5 h-5 xs:w-6 xs:h-6 text-charcoal" />
              </div>
              <h1 className="font-display text-xl xs:text-2xl md:text-3xl font-bold text-cream">
                QR Code Generator
              </h1>
            </div>
            <p className="text-cream/90 text-sm xs:text-base px-2 xs:px-0">
              Generate QR codes for restaurant locations to enable employee onboarding
            </p>
          </div>

          <div className="p-4 xs:p-6 md:p-8 pb-8 xs:pb-12 md:pb-16">
            <div className="grid md:grid-cols-2 gap-6 xs:gap-8">

              {/* Location Selection */}
              <div className="space-y-4 xs:space-y-5">
                <div>
                  <h3 className="font-display text-lg xs:text-xl font-semibold text-charcoal mb-2 xs:mb-3">
                    Select Location
                  </h3>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full px-3 py-2.5 border border-charcoal/20 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent transition-all text-sm xs:text-base"
                  >
                    {locations.map(location => (
                      <option key={location.id} value={location.id}>
                        {location.name} - Woodfire.food
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location Details */}
                {selectedLocationData && (
                  <div className="bg-cream/50 rounded-lg p-3 xs:p-4">
                    <h4 className="font-semibold text-charcoal mb-2 text-sm xs:text-base">
                      {selectedLocationData.name} Location
                    </h4>
                    <p className="text-charcoal/70 text-xs xs:text-sm mb-1 whitespace-nowrap overflow-hidden text-ellipsis">
                      📍 {selectedLocationData.address}
                    </p>
                    <p className="text-charcoal/70 text-xs xs:text-sm mb-1 whitespace-nowrap">
                      📞 {selectedLocationData.phone}
                    </p>
                    <p className="text-charcoal/70 text-xs xs:text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                      ✉️ {selectedLocationData.email}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-3">
                  <button
                    onClick={handleDownloadQR}
                    className="w-full bg-gold-gradient text-charcoal font-semibold px-3 xs:px-4 py-2 xs:py-2.5 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm xs:text-base"
                  >
                    <Download className="w-4 h-4" />
                    Download QR Code
                  </button>

                  {/* Test Onboarding Button */}
                  <div className="relative z-50">
                    <button
                      onClick={() => setIsTestOpen(!isTestOpen)}
                      className="w-full bg-charcoal text-cream font-semibold px-3 xs:px-4 py-2 xs:py-2.5 rounded-lg hover:bg-charcoal/80 transition-all flex items-center justify-center gap-2 text-sm xs:text-base"
                    >
                      <MapPin className="w-4 h-4" />
                      Test Onboarding
                      <ChevronDown className={`w-4 h-4 transition-transform ${isTestOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isTestOpen && (
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white rounded-lg shadow-2xl border border-charcoal/10 overflow-hidden min-w-52 xs:min-w-56 z-50">
                        <div className="p-2">
                          <div className="text-xs text-charcoal/60 px-2 py-1.5 font-medium">
                            Select a location to test:
                          </div>
                          {locations.map((location) => (
                            <button
                              key={location.id}
                              onClick={() => handleTestLocation(location.id)}
                              className="w-full text-left px-2 py-1.5 hover:bg-gold/10 rounded transition-colors text-sm text-charcoal"
                            >
                              <div className="font-medium text-xs xs:text-sm">{location.name}</div>
                              <div className="text-xs text-charcoal/60 truncate whitespace-nowrap">
                                {location.address}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* QR Code Display */}
              <div className="flex flex-col items-center justify-start">
                <div className="bg-cream p-3 xs:p-5 rounded-xl shadow-lg">
                  <img
                    src={getQRCodeURL(selectedLocation)}
                    alt={`QR Code for ${selectedLocationData?.name} location`}
                    className="w-40 h-40 xs:w-52 xs:h-52 rounded-lg"
                  />
                </div>

                <div className="mt-3 text-center px-2">
                  <p className="text-charcoal/70 text-xs xs:text-sm">
                    Scan this QR code to start the onboarding process for
                  </p>
                  <p className="font-semibold text-charcoal text-sm xs:text-base whitespace-nowrap">
                    {selectedLocationData?.name} Location
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QRCodeGenerator
