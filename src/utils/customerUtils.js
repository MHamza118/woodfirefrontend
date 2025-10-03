// Customer loyalty tier management utilities

export const LOYALTY_TIERS = {
  BRONZE: {
    name: 'Bronze',
    minPoints: 0,
    maxPoints: 499,
    multiplier: 1,
    color: 'bg-amber-100 text-amber-800',
    icon: 'bronze'
  },
  SILVER: {
    name: 'Silver',
    minPoints: 500,
    maxPoints: 999,
    multiplier: 1.5,
    color: 'bg-gray-100 text-gray-800',
    icon: 'silver'
  },
  GOLD: {
    name: 'Gold',
    minPoints: 1000,
    maxPoints: 2499,
    multiplier: 2,
    color: 'bg-gold/20 text-gold',
    icon: 'gold'
  },
  PLATINUM: {
    name: 'Platinum',
    minPoints: 2500,
    maxPoints: Infinity,
    multiplier: 2.5,
    color: 'bg-purple-100 text-purple-800',
    icon: 'platinum'
  }
}

export const getCustomerTier = (loyaltyPoints = 0) => {
  if (loyaltyPoints >= LOYALTY_TIERS.PLATINUM.minPoints) {
    return LOYALTY_TIERS.PLATINUM
  } else if (loyaltyPoints >= LOYALTY_TIERS.GOLD.minPoints) {
    return LOYALTY_TIERS.GOLD
  } else if (loyaltyPoints >= LOYALTY_TIERS.SILVER.minPoints) {
    return LOYALTY_TIERS.SILVER
  } else {
    return LOYALTY_TIERS.BRONZE
  }
}

export const getCustomerStatus = (customer) => {
  if (!customer) return 'Unknown'
  
  // Check account status first
  if (customer.status === 'Inactive' || customer.status === 'Paused') {
    return customer.status
  }
  
  // Return loyalty tier for active customers
  const tier = getCustomerTier(customer.loyaltyPoints)
  return tier.name
}

export const getAllCustomerStatuses = () => {
  return [
    'All',
    'Bronze',
    'Silver', 
    'Gold',
    'Platinum',
    'Active',
    'Inactive',
    'Paused'
  ]
}

export const filterCustomersByStatus = (customers, statusFilter) => {
  if (statusFilter === 'All') {
    return customers
  }
  
  return customers.filter(customer => {
    const customerStatus = getCustomerStatus(customer)
    const tier = getCustomerTier(customer.loyaltyPoints)
    
    // Check for loyalty tier match
    if (['Bronze', 'Silver', 'Gold', 'Platinum'].includes(statusFilter)) {
      return tier.name === statusFilter
    }
    
    // Check for account status match
    return customer.status === statusFilter || customerStatus === statusFilter
  })
}

export const getNextTierInfo = (loyaltyPoints = 0) => {
  const currentTier = getCustomerTier(loyaltyPoints)
  
  if (currentTier.name === 'Platinum') {
    return {
      nextTier: null,
      pointsNeeded: 0,
      progress: 100
    }
  }
  
  const tiers = Object.values(LOYALTY_TIERS)
  const currentIndex = tiers.findIndex(tier => tier.name === currentTier.name)
  const nextTier = tiers[currentIndex + 1]
  
  if (!nextTier) {
    return {
      nextTier: null,
      pointsNeeded: 0,
      progress: 100
    }
  }
  
  const pointsNeeded = nextTier.minPoints - loyaltyPoints
  const progress = ((loyaltyPoints - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100
  
  return {
    nextTier,
    pointsNeeded: Math.max(0, pointsNeeded),
    progress: Math.min(100, Math.max(0, progress))
  }
}

export const formatCustomerSince = (createdAt) => {
  if (!createdAt) return 'Unknown'
  
  const date = new Date(createdAt)
  const now = new Date()
  const diffInMonths = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth())
  
  if (diffInMonths < 1) {
    return 'New Customer'
  } else if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''}`
  } else {
    const years = Math.floor(diffInMonths / 12)
    return `${years} year${years !== 1 ? 's' : ''}`
  }
}
