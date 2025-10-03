export const locations = {
  bartlesville: {
    id: 'bartlesville',
    name: 'Bartlesville',
    restaurantName: 'Woodfire.food',
    address: '123 Main Street, Bartlesville, OK 74003',
    phone: '(918) 555-0123',
    email: 'bartlesville@309311restaurants.com',
    manager: 'Sarah Johnson',
    description: 'Our flagship location in the heart of downtown Bartlesville',
    features: [
      'Full-service dining',
      'Private event space',
      'Craft cocktail bar',
      'Outdoor patio seating'
    ],
    positions: [
      { id: 'server', name: 'Server', department: 'Front of House' },
      { id: 'host', name: 'Host/Hostess', department: 'Front of House' },
      { id: 'bartender', name: 'Bartender', department: 'Front of House' },
      { id: 'cook', name: 'Line Cook', department: 'Back of House' },
      { id: 'prep', name: 'Prep Cook', department: 'Back of House' },
      { id: 'dishwasher', name: 'Dishwasher', department: 'Back of House' }
    ]
  },
  tulsa: {
    id: 'tulsa',
    name: 'Tulsa',
    restaurantName: 'Woodfire.food',
    address: '456 Downtown Ave, Tulsa, OK 74103',
    phone: '(918) 555-0124',
    email: 'tulsa@309311restaurants.com',
    manager: 'Michael Rodriguez',
    description: 'Our modern location in Tulsa\'s vibrant downtown district',
    features: [
      'Contemporary dining',
      'Rooftop bar',
      'Live music venue',
      'Corporate catering'
    ],
    positions: [
      { id: 'server', name: 'Server', department: 'Front of House' },
      { id: 'host', name: 'Host/Hostess', department: 'Front of House' },
      { id: 'bartender', name: 'Bartender', department: 'Front of House' },
      { id: 'sommelier', name: 'Sommelier', department: 'Front of House' },
      { id: 'cook', name: 'Line Cook', department: 'Back of House' },
      { id: 'sous', name: 'Sous Chef', department: 'Back of House' },
      { id: 'prep', name: 'Prep Cook', department: 'Back of House' },
      { id: 'dishwasher', name: 'Dishwasher', department: 'Back of House' }
    ]
  }
}

export const getLocationById = (id) => {
  return locations[id] || locations.bartlesville
}

export const getAllLocations = () => {
  return Object.values(locations)
}

export const getLocationsByState = (state = 'OK') => {
  return Object.values(locations).filter(location => 
    location.address.includes(state)
  )
}
