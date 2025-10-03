// Network Location Verification Utility
// Simulates checking if the employee is connected to the restaurant's network

/**
 * Simulates network detection for restaurant locations
 * In a real implementation, this would check actual network conditions
 */
export const getNetworkInfo = () => {
  // Simulate network detection with different scenarios
  const scenarios = [
    {
      isOnSite: true,
      networkName: 'Restaurant_WiFi_Bartlesville',
      location: 'Bartlesville',
      locationId: 'bartlesville',
      ipRange: '192.168.1.x',
      confidence: 0.95
    },
    {
      isOnSite: true,
      networkName: 'Restaurant_WiFi_Tulsa',
      location: 'Tulsa',
      locationId: 'tulsa',
      ipRange: '192.168.2.x',
      confidence: 0.98
    },
    {
      isOnSite: false,
      networkName: 'Public_WiFi',
      location: 'Unknown',
      locationId: null,
      ipRange: '10.0.0.x',
      confidence: 0.0
    },
    {
      isOnSite: false,
      networkName: 'Home_Network',
      location: 'Home',
      locationId: null,
      ipRange: '192.168.0.x',
      confidence: 0.0
    }
  ];

  // For simulation, we'll cycle through scenarios or use a stored preference
  const storedScenario = localStorage.getItem('simulatedNetworkScenario');
  let scenarioIndex = 0;
  
  if (storedScenario) {
    scenarioIndex = parseInt(storedScenario, 10) % scenarios.length;
  } else {
    // Default to on-site for initial demo
    scenarioIndex = Math.floor(Math.random() * 2); // 50% chance of being on-site initially
  }

  return scenarios[scenarioIndex];
};

/**
 * Checks if the current network allows location-based operations
 */
export const isOnRestaurantNetwork = () => {
  const networkInfo = getNetworkInfo();
  return networkInfo.isOnSite;
};

/**
 * Gets the current restaurant location based on network
 */
export const getCurrentLocation = () => {
  const networkInfo = getNetworkInfo();
  return {
    locationId: networkInfo.locationId,
    locationName: networkInfo.location,
    networkName: networkInfo.networkName,
    verified: networkInfo.isOnSite,
    confidence: networkInfo.confidence
  };
};


/**
 * Simulates checking GPS coordinates (for mobile implementation)
 * In a real app, this would use actual GPS data
 */
export const getGPSLocation = () => {
  const restaurantLocations = {
    bartlesville: {
      lat: 36.7537,
      lng: -95.9406,
      address: '123 Main St, Bartlesville, OK',
      radius: 100 // meters
    },
    tulsa: {
      lat: 36.1540,
      lng: -95.9928,
      address: '456 Downtown Ave, Tulsa, OK',
      radius: 100 // meters
    }
  };

  const networkInfo = getNetworkInfo();
  
  if (networkInfo.isOnSite && networkInfo.locationId) {
    const location = restaurantLocations[networkInfo.locationId];
    return {
      latitude: location.lat + (Math.random() - 0.5) * 0.001, // Small random offset
      longitude: location.lng + (Math.random() - 0.5) * 0.001,
      accuracy: 10,
      timestamp: Date.now()
    };
  }

  // Return a random location if not on-site
  return {
    latitude: 36.0 + Math.random() * 2,
    longitude: -96.0 + Math.random() * 2,
    accuracy: 50,
    timestamp: Date.now()
  };
};

/**
 * Calculates distance between two GPS coordinates
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in meters
};

/**
 * Verifies GPS location against restaurant locations
 */
export const verifyGPSLocation = () => {
  const currentGPS = getGPSLocation();
  const restaurantLocations = {
    bartlesville: { lat: 36.7537, lng: -95.9406, radius: 100 },
    tulsa: { lat: 36.1540, lng: -95.9928, radius: 100 }
  };

  for (const [locationId, restaurant] of Object.entries(restaurantLocations)) {
    const distance = calculateDistance(
      currentGPS.latitude, 
      currentGPS.longitude,
      restaurant.lat,
      restaurant.lng
    );

    if (distance <= restaurant.radius) {
      return {
        success: true,
        locationId,
        distance: Math.round(distance),
        coordinates: {
          lat: currentGPS.latitude,
          lng: currentGPS.longitude
        }
      };
    }
  }

  return {
    success: false,
    distance: null,
    coordinates: {
      lat: currentGPS.latitude,
      lng: currentGPS.longitude
    }
  };
};

/**
 * Sets the simulated network scenario for testing
 */
export const setSimulatedNetworkScenario = (scenarioIndex) => {
  localStorage.setItem('simulatedNetworkScenario', scenarioIndex.toString());
};

/**
 * Gets available network scenarios for testing
 */
export const getAvailableNetworkScenarios = () => {
  return [
    { id: 0, name: 'Bartlesville Restaurant', onSite: true },
    { id: 1, name: 'Tulsa Restaurant', onSite: true },
    { id: 2, name: 'Public WiFi (Off-site)', onSite: false },
    { id: 3, name: 'Home Network (Off-site)', onSite: false }
  ];
};

/**
 * Comprehensive location verification that combines network and GPS
 */
export const performComprehensiveLocationVerification = () => {
  const networkInfo = getCurrentLocation();
  const gpsVerification = verifyGPSLocation();
  
  // Both network and GPS should confirm on-site status for high confidence
  const isVerified = networkInfo.verified && gpsVerification.success;
  
  return {
    success: isVerified,
    network: {
      success: networkInfo.verified,
      location: networkInfo,
      message: networkInfo.verified 
        ? `Location verified: ${networkInfo.locationName}` 
        : 'Not on restaurant premises',
      timestamp: new Date().toISOString()
    },
    gps: gpsVerification,
    confidence: isVerified ? 0.95 : (networkInfo.verified ? 0.7 : 0.1),
    timestamp: new Date().toISOString(),
    verificationMethod: isVerified ? 'network_and_gps' : 
                        networkInfo.verified ? 'network_only' : 'none'
  };
};

// Export default comprehensive verification function
export default performComprehensiveLocationVerification;
