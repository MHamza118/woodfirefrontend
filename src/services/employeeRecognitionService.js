// Employee Recognition Service
// Handles rewards, shout-outs, achievements, and performance tracking

export class EmployeeRecognitionService {
  constructor() {
    this.storageKeys = {
      shoutouts: 'employeeShoutouts',
      rewards: 'employeeRewards',
      achievements: 'employeeAchievements',
      performance: 'employeePerformance',
      rewardTypes: 'rewardTypes',
      badges: 'employeeBadges'
    }
    this.initializeDefaultData()
  }

  initializeDefaultData() {
    // Initialize default reward types if not exists
    if (!localStorage.getItem(this.storageKeys.rewardTypes)) {
      const defaultRewardTypes = [
        {
          id: 'points_50',
          name: '50 Points',
          type: 'points',
          value: 50,
          description: 'Recognition points for good performance',
          icon: '⭐'
        },
        {
          id: 'points_100',
          name: '100 Points',
          type: 'points',
          value: 100,
          description: 'Recognition points for excellent performance',
          icon: '🌟'
        },
        {
          id: 'gift_card_10',
          name: '$10 Gift Card',
          type: 'gift_card',
          value: 10,
          description: 'Restaurant gift card reward',
          icon: '🎁'
        },
        {
          id: 'extra_break',
          name: 'Extra 15min Break',
          type: 'benefit',
          value: 15,
          description: 'Additional break time',
          icon: '☕'
        },
        {
          id: 'parking_spot',
          name: 'Premium Parking Spot',
          type: 'benefit',
          value: 1,
          description: 'Reserved parking spot for the week',
          icon: '🚗'
        }
      ]
      localStorage.setItem(this.storageKeys.rewardTypes, JSON.stringify(defaultRewardTypes))
    }

    // Initialize default badges if not exists
    if (!localStorage.getItem(this.storageKeys.badges)) {
      const defaultBadges = [
        {
          id: 'customer_service_star',
          name: 'Customer Service Star',
          description: 'Exceptional customer service',
          icon: '⭐',
          color: 'gold',
          criteria: 'Outstanding customer feedback and service quality'
        },
        {
          id: 'team_player',
          name: 'Team Player',
          description: 'Excellent teamwork and collaboration',
          icon: '🤝',
          color: 'blue',
          criteria: 'Consistently helps colleagues and works well in teams'
        },
        {
          id: 'efficiency_expert',
          name: 'Efficiency Expert',
          description: 'Outstanding efficiency and productivity',
          icon: '⚡',
          color: 'yellow',
          criteria: 'Consistently meets and exceeds performance targets'
        },
        {
          id: 'innovation_champion',
          name: 'Innovation Champion',
          description: 'Creative problem solving and innovation',
          icon: '💡',
          color: 'purple',
          criteria: 'Brings innovative ideas and solutions to the workplace'
        },
        {
          id: 'mentor_master',
          name: 'Mentor Master',
          description: 'Excellent at training and mentoring new staff',
          icon: '👨‍🏫',
          color: 'green',
          criteria: 'Successfully mentors and trains new employees'
        },
        {
          id: 'attendance_ace',
          name: 'Attendance Ace',
          description: 'Perfect attendance record',
          icon: '📅',
          color: 'orange',
          criteria: 'Maintains excellent attendance and punctuality'
        }
      ]
      localStorage.setItem(this.storageKeys.badges, JSON.stringify(defaultBadges))
    }
  }

  // Shout-outs Management
  createShoutout(shoutout) {
    const shoutouts = this.getAllShoutouts()
    const newShoutout = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      ...shoutout,
      createdAt: new Date().toISOString(),
      likes: 0,
      likedBy: [],
      comments: []
    }
    shoutouts.push(newShoutout)
    localStorage.setItem(this.storageKeys.shoutouts, JSON.stringify(shoutouts))

    // Update employee performance
    this.updateEmployeePerformance(shoutout.employeeId, 'shoutout_received', {
      shoutoutId: newShoutout.id,
      recognizedBy: shoutout.recognizedBy,
      category: shoutout.category
    })

    return newShoutout
  }

  getAllShoutouts() {
    return JSON.parse(localStorage.getItem(this.storageKeys.shoutouts) || '[]')
  }

  getShoutoutsByEmployee(employeeId) {
    return this.getAllShoutouts().filter(shoutout => shoutout.employeeId === employeeId)
  }

  getRecentShoutouts(limit = 10) {
    return this.getAllShoutouts()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit)
  }

  likeShoutout(shoutoutId, userId) {
    const shoutouts = this.getAllShoutouts()
    const shoutout = shoutouts.find(s => s.id === shoutoutId)
    
    if (shoutout && !shoutout.likedBy.includes(userId)) {
      shoutout.likes += 1
      shoutout.likedBy.push(userId)
      localStorage.setItem(this.storageKeys.shoutouts, JSON.stringify(shoutouts))
    }
    
    return shoutout
  }

  // Rewards Management
  giveReward(reward) {
    const rewards = this.getAllRewards()
    const newReward = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      ...reward,
      createdAt: new Date().toISOString(),
      status: 'pending',
      redeemedAt: null
    }
    rewards.push(newReward)
    localStorage.setItem(this.storageKeys.rewards, JSON.stringify(rewards))

    // Update employee performance
    this.updateEmployeePerformance(reward.employeeId, 'reward_received', {
      rewardId: newReward.id,
      rewardType: reward.type,
      value: reward.value
    })

    return newReward
  }

  getAllRewards() {
    return JSON.parse(localStorage.getItem(this.storageKeys.rewards) || '[]')
  }

  getRewardsByEmployee(employeeId) {
    return this.getAllRewards().filter(reward => reward.employeeId === employeeId)
  }

  getPendingRewards(employeeId) {
    return this.getRewardsByEmployee(employeeId).filter(reward => reward.status === 'pending')
  }

  redeemReward(rewardId, employeeId) {
    const rewards = this.getAllRewards()
    const reward = rewards.find(r => r.id === rewardId && r.employeeId === employeeId)
    
    if (reward && reward.status === 'pending') {
      reward.status = 'redeemed'
      reward.redeemedAt = new Date().toISOString()
      localStorage.setItem(this.storageKeys.rewards, JSON.stringify(rewards))
      
      // Update employee performance
      this.updateEmployeePerformance(employeeId, 'reward_redeemed', {
        rewardId: rewardId,
        redeemedAt: reward.redeemedAt
      })
    }
    
    return reward
  }

  getRewardTypes() {
    return JSON.parse(localStorage.getItem(this.storageKeys.rewardTypes) || '[]')
  }

  // Badges and Achievements
  awardBadge(employeeId, badgeId, awardedBy, reason) {
    const achievements = this.getAllAchievements()
    const badges = this.getBadgeTypes()
    const badge = badges.find(b => b.id === badgeId)
    
    if (!badge) return null

    // Check if employee already has this badge
    const existingAchievement = achievements.find(
      a => a.employeeId === employeeId && a.badgeId === badgeId
    )
    
    if (existingAchievement) return null

    const newAchievement = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      employeeId,
      badgeId,
      badge,
      awardedBy,
      reason,
      awardedAt: new Date().toISOString()
    }
    
    achievements.push(newAchievement)
    localStorage.setItem(this.storageKeys.achievements, JSON.stringify(achievements))

    // Update employee performance
    this.updateEmployeePerformance(employeeId, 'badge_earned', {
      badgeId,
      badgeName: badge.name,
      awardedBy
    })

    return newAchievement
  }

  getAllAchievements() {
    return JSON.parse(localStorage.getItem(this.storageKeys.achievements) || '[]')
  }

  getEmployeeBadges(employeeId) {
    return this.getAllAchievements().filter(achievement => achievement.employeeId === employeeId)
  }

  getBadgeTypes() {
    return JSON.parse(localStorage.getItem(this.storageKeys.badges) || '[]')
  }

  // Performance Tracking
  updateEmployeePerformance(employeeId, action, data) {
    const performanceData = this.getAllPerformance()
    let employeePerformance = performanceData.find(p => p.employeeId === employeeId)
    
    if (!employeePerformance) {
      employeePerformance = {
        employeeId,
        totalPoints: 0,
        totalShoutouts: 0,
        totalRewards: 0,
        totalBadges: 0,
        activities: [],
        lastUpdated: new Date().toISOString()
      }
      performanceData.push(employeePerformance)
    }

    const activity = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      action,
      data,
      timestamp: new Date().toISOString()
    }
    
    employeePerformance.activities.push(activity)
    employeePerformance.lastUpdated = new Date().toISOString()

    // Update counters based on action
    switch (action) {
      case 'shoutout_received':
        employeePerformance.totalShoutouts += 1
        employeePerformance.totalPoints += 25 // Base points for shoutout
        break
      case 'reward_received':
        employeePerformance.totalRewards += 1
        if (data.rewardType === 'points') {
          employeePerformance.totalPoints += data.value
        }
        break
      case 'badge_earned':
        employeePerformance.totalBadges += 1
        employeePerformance.totalPoints += 100 // Base points for badge
        break
    }

    localStorage.setItem(this.storageKeys.performance, JSON.stringify(performanceData))
    return employeePerformance
  }

  getAllPerformance() {
    return JSON.parse(localStorage.getItem(this.storageKeys.performance) || '[]')
  }

  getEmployeePerformance(employeeId) {
    const performanceData = this.getAllPerformance()
    return performanceData.find(p => p.employeeId === employeeId) || {
      employeeId,
      totalPoints: 0,
      totalShoutouts: 0,
      totalRewards: 0,
      totalBadges: 0,
      activities: []
    }
  }

  getTopPerformers(limit = 10) {
    return this.getAllPerformance()
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, limit)
  }

  // Analytics and Statistics
  getRecognitionStats(employeeId = null) {
    const shoutouts = employeeId ? this.getShoutoutsByEmployee(employeeId) : this.getAllShoutouts()
    const rewards = employeeId ? this.getRewardsByEmployee(employeeId) : this.getAllRewards()
    const badges = employeeId ? this.getEmployeeBadges(employeeId) : this.getAllAchievements()

    return {
      totalShoutouts: shoutouts.length,
      totalRewards: rewards.length,
      totalBadges: badges.length,
      recentActivity: [...shoutouts, ...rewards, ...badges]
        .sort((a, b) => new Date(b.createdAt || b.awardedAt) - new Date(a.createdAt || a.awardedAt))
        .slice(0, 10)
    }
  }

  // Utility methods
  getShoutoutCategories() {
    return [
      { id: 'customer_service', name: 'Customer Service Excellence', icon: '👥', color: 'blue' },
      { id: 'teamwork', name: 'Outstanding Teamwork', icon: '🤝', color: 'green' },
      { id: 'efficiency', name: 'Exceptional Efficiency', icon: '⚡', color: 'yellow' },
      { id: 'leadership', name: 'Leadership Skills', icon: '👑', color: 'purple' },
      { id: 'innovation', name: 'Creative Innovation', icon: '💡', color: 'orange' },
      { id: 'reliability', name: 'Dependability', icon: '🎯', color: 'red' },
      { id: 'training', name: 'Mentoring & Training', icon: '📚', color: 'indigo' },
      { id: 'attitude', name: 'Positive Attitude', icon: '😊', color: 'pink' }
    ]
  }

  searchRecognition(query, type = 'all') {
    const normalizedQuery = query.toLowerCase()
    let results = []

    if (type === 'all' || type === 'shoutouts') {
      const shoutouts = this.getAllShoutouts().filter(
        s => s.message.toLowerCase().includes(normalizedQuery) ||
             s.employeeName.toLowerCase().includes(normalizedQuery) ||
             s.category.toLowerCase().includes(normalizedQuery)
      ).map(s => ({ ...s, type: 'shoutout' }))
      results = [...results, ...shoutouts]
    }

    if (type === 'all' || type === 'rewards') {
      const rewards = this.getAllRewards().filter(
        r => r.reason.toLowerCase().includes(normalizedQuery) ||
             r.employeeName.toLowerCase().includes(normalizedQuery)
      ).map(r => ({ ...r, type: 'reward' }))
      results = [...results, ...rewards]
    }

    if (type === 'all' || type === 'badges') {
      const achievements = this.getAllAchievements().filter(
        a => a.badge.name.toLowerCase().includes(normalizedQuery) ||
             a.reason.toLowerCase().includes(normalizedQuery)
      ).map(a => ({ ...a, type: 'badge' }))
      results = [...results, ...achievements]
    }

    return results.sort((a, b) => new Date(b.createdAt || b.awardedAt) - new Date(a.createdAt || a.awardedAt))
  }
}

// Create and export singleton instance
const employeeRecognitionService = new EmployeeRecognitionService()
export default employeeRecognitionService
