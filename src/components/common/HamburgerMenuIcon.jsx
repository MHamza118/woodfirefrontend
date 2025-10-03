import React from 'react'

const HamburgerMenuIcon = ({ isOpen, onClick }) => {
  return (
    <button
      className="flex flex-col justify-center items-center w-8 h-8 rounded-md focus:outline-none focus:ring-2 focus:ring-gold hover:bg-gold/10 transition-all duration-200"
      onClick={onClick}
      aria-label={isOpen ? "Close menu" : "Open menu"}
    >
      <span 
        className={`block w-5 h-0.5 bg-cream transition-all duration-300 ease-in-out ${
          isOpen ? 'transform rotate-45 translate-y-1' : ''
        }`}
      />
      <span 
        className={`block w-5 h-0.5 bg-cream mt-1 transition-all duration-300 ease-in-out ${
          isOpen ? 'opacity-0' : ''
        }`}
      />
      <span 
        className={`block w-5 h-0.5 bg-cream mt-1 transition-all duration-300 ease-in-out ${
          isOpen ? 'transform -rotate-45 -translate-y-1' : ''
        }`}
      />
    </button>
  )
}

export default HamburgerMenuIcon
