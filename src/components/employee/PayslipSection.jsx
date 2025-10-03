import React from 'react'
import { Clock, DollarSign } from 'lucide-react'

const PayslipSection = ({ employeeData }) => {
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-brand-navy rounded-xl shadow-lg overflow-hidden border border-gold/20">
        <div className="bg-gradient-to-r from-gold/10 to-transparent p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gold/20 backdrop-blur-sm rounded-lg">
              <DollarSign className="w-6 h-6 text-gold" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gold mb-2">Payslips & Earnings</h3>
              <p className="text-cream/80 text-sm mb-4 leading-relaxed">
                Access your pay stubs and earnings information
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon Content */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12">
        <div className="max-w-md mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gold/20 to-gold/10 rounded-full mb-6">
            <Clock className="w-8 h-8 text-gold" />
          </div>
          
          <h2 className="text-2xl font-semibold text-charcoal mb-4">
            Feature Under Development
          </h2>
          
          <p className="text-gray-600 leading-relaxed">
            We are currently developing the payslip management system. This feature will be available soon to provide you with convenient access to your pay stubs and earnings history.
          </p>
        </div>
      </div>
    </div>
  )
}

export default PayslipSection
