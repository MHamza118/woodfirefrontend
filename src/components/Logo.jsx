const Logo = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-16 h-16 xs:w-12 xs:h-12',
    md: 'w-28 h-28 xs:w-24 xs:h-24',
    lg: 'w-36 h-36 xs:w-32 xs:h-32',
    xl: 'w-44 h-44 xs:w-40 xs:h-40'
  }

  return (
    <div className={`${sizes[size]} ${className} flex items-center justify-center`}>
      <img
        src="/Picture1.png"
        alt="Woodfire.food Logo"
        className={`${sizes[size]} object-contain`}
      />
    </div>
  )
}

export default Logo
