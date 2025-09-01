import api from './api'

const scheduleApi = {
  // 일정 생성
  createSchedule: async (scheduleData) => {
    try {
      const response = await api.post('/schedules', scheduleData)
      return response.data
    } catch (error) {
      console.error('Failed to create schedule:', error)
      throw error
    }
  },

  // 일정 조회
  getSchedule: async (scheduleId) => {
    try {
      const response = await api.get(`/schedules/${scheduleId}`)
      return response.data
    } catch (error) {
      console.error('Failed to get schedule:', error)
      throw error
    }
  },

  // 일정 수정
  updateSchedule: async (scheduleId, scheduleData) => {
    try {
      const response = await api.put(`/schedules/${scheduleId}`, scheduleData)
      return response.data
    } catch (error) {
      console.error('Failed to update schedule:', error)
      throw error
    }
  },

  // 일정 삭제
  deleteSchedule: async (scheduleId) => {
    try {
      const response = await api.delete(`/schedules/${scheduleId}`)
      return response.data
    } catch (error) {
      console.error('Failed to delete schedule:', error)
      throw error
    }
  },

  // 월별 일정 조회
  getMonthlySchedules: async (year, month) => {
    try {
      const response = await api.get('/schedules/monthly', {
        params: { year, month }
      })
      return response.data
    } catch (error) {
      console.error('Failed to get monthly schedules:', error)
      throw error
    }
  },

  // 날짜 범위 일정 조회
  getSchedulesByDateRange: async (startDate, endDate) => {
    try {
      const response = await api.get('/schedules/range', {
        params: { startDate, endDate }
      })
      return response.data
    } catch (error) {
      console.error('Failed to get schedules by date range:', error)
      throw error
    }
  },

  // 일정 상태 변경
  updateScheduleStatus: async (scheduleId, status) => {
    try {
      const response = await api.patch(`/schedules/${scheduleId}/status`, null, {
        params: { status }
      })
      return response.data
    } catch (error) {
      console.error('Failed to update schedule status:', error)
      throw error
    }
  }
}

export default scheduleApi