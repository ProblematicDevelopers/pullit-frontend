import api from './api'

const calendarApi = {
  // 캘린더 이벤트 생성
  createEvent: (data) => {
    return api.post('/calendar/events', data)
  },

  // 사용자 이벤트 조회
  getUserEvents: (userId, startDate, endDate) => {
    return api.get('/calendar/events', {
      params: { userId, startDate, endDate }
    })
  },

  // 학생의 학급 일정 조회 (개인 + 학급 전체)
  getStudentClassEvents: (studentId, classId, startDate, endDate) => {
    return api.get('/calendar/student/events', {
      params: { studentId, classId, startDate, endDate }
    })
  },

  // 오늘 일정 조회
  getTodayEvents: (userId) => {
    return api.get('/calendar/events/today', {
      params: { userId }
    })
  },

  // 예정된 일정 조회
  getUpcomingEvents: (userId) => {
    return api.get('/calendar/events/upcoming', {
      params: { userId }
    })
  },

  // 과제 일정 조회
  getAssignmentEvents: (userId) => {
    return api.get('/calendar/events/assignments', {
      params: { userId }
    })
  },

  // 캘린더 이벤트 수정
  updateEvent: (eventId, data) => {
    return api.put(`/calendar/events/${eventId}`, data)
  },

  // 캘린더 이벤트 삭제
  deleteEvent: (eventId) => {
    return api.delete(`/calendar/events/${eventId}`)
  },

  // 과제 완료 처리
  completeAssignmentEvent: (assignmentId, studentId) => {
    return api.post(`/calendar/events/assignment/${assignmentId}/complete`, null, {
      params: { studentId }
    })
  }
}

export default calendarApi