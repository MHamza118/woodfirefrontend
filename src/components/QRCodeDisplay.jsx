import QRCodeSVG from 'react-qr-code'

const QRCodeDisplay = ({ data, size = 150 }) => {
  return (
    <div className="flex flex-col items-center space-y-2">
      <div 
        className="bg-white border-2 border-gray-300 p-3 rounded-lg shadow-sm"
        style={{ width: size + 24, height: size + 24 }}
      >
        <QRCodeSVG
          value={data}
          size={size}
          level="M"
          includeMargin={false}
          className="w-full h-full"
        />
      </div>
      <p className="text-xs text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded">{data}</p>
    </div>
  )
}

export default QRCodeDisplay
