import api from './api'

const dashboardApi = {
  // 최근 활동 조회
  getRecentActivities: async (limit = 10) => {
    try {
      const response = await api.get('/dashboard/activities', {
        params: { limit }
      })
      return response.data
    } catch (error) {
      console.error('Failed to get recent activities:', error)
      throw error
    }
  },

  // 예정된 일정 조회
  getUpcomingSchedules: async (limit = 10) => {
    try {
      const response = await api.get('/dashboard/schedules', {
        params: { limit }
      })
      return response.data
    } catch (error) {
      console.error('Failed to get upcoming schedules:', error)
      throw error
    }
  },

  // 대시보드 통계 조회
  getDashboardStats: async () => {
    try {
      const response = await api.get('/dashboard/stats')
      return response.data
    } catch (error) {
      console.error('Failed to get dashboard stats:', error)
      throw error
    }
  }
}

export default dashboardApi