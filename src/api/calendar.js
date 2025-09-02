import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

const calendarApi = {
  // 캘린더 이벤트 생성
  addEvent(eventData) {
    return axios.post(`${API_BASE_URL}/calendar/events`, eventData)
  },

  // 특정 기간 이벤트 조회
  getEvents(userId, startDate, endDate) {
    return axios.get(`${API_BASE_URL}/calendar/events`, {
      params: {
        userId,
        startDate,
        endDate
      }
    })
  },

  // 오늘 일정 조회
  getTodayEvents(userId) {
    return axios.get(`${API_BASE_URL}/calendar/events/today`, {
      params: { userId }
    })
  },

  // 예정된 일정 조회
  getUpcomingEvents(userId) {
    return axios.get(`${API_BASE_URL}/calendar/events/upcoming`, {
      params: { userId }
    })
  },

  // 과제 일정 조회
  getAssignmentEvents(userId) {
    return axios.get(`${API_BASE_URL}/calendar/events/assignments`, {
      params: { userId }
    })
  },

  // 이벤트 수정
  updateEvent(eventId, eventData, userId) {
    return axios.put(`${API_BASE_URL}/calendar/events/${eventId}`, eventData, {
      headers: {
        'X-User-Id': userId
      }
    })
  },

  // 이벤트 삭제
  deleteEvent(eventId, userId) {
    return axios.delete(`${API_BASE_URL}/calendar/events/${eventId}`, {
      headers: {
        'X-User-Id': userId
      }
    })
  },

  // 과제 완료 처리
  completeAssignmentEvent(assignmentId, studentId) {
    return axios.post(`${API_BASE_URL}/calendar/events/assignment/${assignmentId}/complete`, null, {
      params: { studentId }
    })
  },

  // 과제 제출 시 상태 업데이트 (프론트엔드 전용 헬퍼)
  updateEventStatus(params) {
    const { assignmentId, status, color } = params
    // 실제로는 백엔드 API를 호출
    return this.completeAssignmentEvent(assignmentId, params.studentId || 1)
  }
}

export default calendarApi