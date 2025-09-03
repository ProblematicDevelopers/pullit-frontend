import api from '@/services/api.js'

const calendarApi = {
  // 캘린더 이벤트 생성
  addEvent(eventData) {
    return api.post(`/calendar/events`, eventData)
  },

  // 특정 기간 이벤트 조회
  getEvents(userId, startDate, endDate) {
    return api.get(`/calendar/events`, {
      params: {
        userId,
        startDate,
        endDate
      }
    })
  },

  // 오늘 일정 조회
  getTodayEvents(userId) {
    return api.get(`/calendar/events/today`, {
      params: { userId }
    })
  },

  // 예정된 일정 조회
  getUpcomingEvents(userId) {
    return api.get(`/calendar/events/upcoming`, {
      params: { userId }
    })
  },

  // 과제 일정 조회
  getAssignmentEvents(userId) {
    return api.get(`/calendar/events/assignments`, {
      params: { userId }
    })
  },

  // 이벤트 수정
  updateEvent(eventId, eventData, userId) {
    return api.put(`/calendar/events/${eventId}`, eventData, {
      headers: {
        'X-User-Id': userId
      }
    })
  },

  // 이벤트 삭제
  deleteEvent(eventId, userId) {
    return api.delete(`/calendar/events/${eventId}`, {
      headers: {
        'X-User-Id': userId
      }
    })
  },

  // 과제 완료 처리
  completeAssignmentEvent(assignmentId, studentId) {
    return api.post(`/calendar/events/assignment/${assignmentId}/complete`, null, {
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
