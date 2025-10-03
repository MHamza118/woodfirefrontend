import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

const FloatingLabelInput = ({ 
  type = 'text', 
  name, 
  value, 
  onChange, 
  label, 
  required = false, 
  error = '',
  className = '',
  ...props 
}) => {
  const [isFocused, setIsFocused] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const hasValue = value && value.length > 0
  const isActive = isFocused || hasValue
  const isPasswordField = type === 'password'
  const inputType = isPasswordField && showPassword ? 'text' : type

  return (
    <div className={`relative ${className}`}>
      <input
        type={inputType}
        name={name}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        required={required}
        className={`
          w-full px-4 pt-6 pb-2 border rounded-xl transition-all duration-200
          focus:ring-2 focus:ring-gold focus:border-transparent
          ${error ? 'border-accent' : 'border-charcoal/20'}
          ${isActive ? 'border-gold/50' : ''}
          ${isPasswordField ? 'pr-12' : ''}
        `}
        {...props}
      />
      
      {isPasswordField && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/50 hover:text-charcoal transition-colors duration-200 focus:outline-none"
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
        </button>
      )}
      
      <label
        className={`
          absolute left-4 transition-all duration-200 pointer-events-none
          ${isActive 
            ? 'top-2 text-xs text-gold font-medium' 
            : 'top-4 text-sm text-charcoal/50'
          }
          max-w-[calc(100%-2rem)] overflow-hidden text-ellipsis
        `}
      >
        {label}
        {required && <span className="text-accent ml-1">*</span>}
      </label>
      
      {error && (
        <p className="text-accent text-xs mt-1 ml-1">{error}</p>
      )}
    </div>
  )
}

export default FloatingLabelInput
