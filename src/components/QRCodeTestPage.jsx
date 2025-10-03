import QRCodeSVG from 'react-qr-code'

const QRCodeTestPage = () => {
  const trainingModules = [
    {
      id: 'food-safety-001',
      title: 'Basic Food Safety',
      qrCode: 'TRAIN_FOOD_SAFETY_001'
    },
    {
      id: 'customer-service-001',
      title: 'Customer Service Excellence',
      qrCode: 'TRAIN_CUSTOMER_001'
    },
    {
      id: 'pos-system-001',
      title: 'POS System Training',
      qrCode: 'TRAIN_POS_001'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Training Station QR Codes
        </h1>
        <p className="text-center text-gray-600 mb-12">
          Scan these QR codes with the employee training system to unlock modules
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {trainingModules.map((module) => (
            <div key={module.id} className="bg-white rounded-lg shadow-lg p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {module.title}
              </h3>
              
              <div className="flex justify-center mb-4">
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                  <QRCodeSVG
                    value={module.qrCode}
                    size={200}
                    level="M"
                    includeMargin={false}
                  />
                </div>
              </div>
              
              <p className="text-sm text-gray-600 font-mono bg-gray-100 px-3 py-2 rounded">
                {module.qrCode}
              </p>
              
              <p className="text-xs text-gray-500 mt-2">
                Station Code: {module.id}
              </p>
            </div>
          ))}
        </div>
        
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-3">
            How to Use These QR Codes
          </h2>
          <ol className="text-blue-700 space-y-2">
            <li>1. Print or display these QR codes at different training stations in your restaurant</li>
            <li>2. Employees can scan them using the "Scan QR Code" feature in their training section</li>
            <li>3. Each QR code unlocks the corresponding training module</li>
            <li>4. Employees must scan the QR code before they can access the training content</li>
          </ol>
        </div>
        
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-green-800 mb-3">
            Manual Testing Codes
          </h2>
          <p className="text-green-700 mb-3">
            You can also manually enter these codes in the scanner:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {trainingModules.map((module) => (
              <div key={module.id} className="bg-white p-3 rounded border">
                <p className="font-semibold text-sm text-gray-800">{module.title}</p>
                <p className="font-mono text-xs text-green-600">{module.qrCode}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default QRCodeTestPage
