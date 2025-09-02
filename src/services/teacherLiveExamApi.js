import api from './api'

const teacherLiveExamAPI = {
  // 실시간 시험 생성
  createLiveExam: async (examData) => {
    const response = await api.post('/teacher-live-exams', examData)
    return response.data
  },

  // 클래스의 실시간 시험 목록 조회
  getClassLiveExams: async (classId) => {
    const response = await api.get(`/teacher-live-exams/class/${classId}`)
    return response.data
  },

  // 활성 시험 목록 조회
  getActiveExams: async (classId) => {
    const response = await api.get(`/teacher-live-exams/class/${classId}/active`)
    return response.data
  },

  // 현재 진행 중인 시험 조회
  getCurrentExam: async (classId) => {
    const response = await api.get(`/teacher-live-exams/class/${classId}/current`)
    return response.data
  },

  // 오늘 예정된 시험 조회
  getTodaysExams: async (classId) => {
    const response = await api.get(`/teacher-live-exams/class/${classId}/today`)
    return response.data
  },

  // 시험 시작
  startExam: async (examId) => {
    const response = await api.post(`/teacher-live-exams/${examId}/start`)
    return response.data
  },

  // 시험 종료
  endExam: async (examId) => {
    const response = await api.post(`/teacher-live-exams/${examId}/end`)
    return response.data
  },
}

export default teacherLiveExamAPI
