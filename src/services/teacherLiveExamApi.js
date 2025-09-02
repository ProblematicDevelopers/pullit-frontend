import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 요청 인터셉터
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 응답 인터셉터
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // 토큰 갱신 로직
      try {
        const refreshToken = localStorage.getItem('refreshToken')
        const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
          refreshToken,
        })
        const { accessToken } = response.data.data
        localStorage.setItem('accessToken', accessToken)
        
        // 원래 요청 재시도
        error.config.headers.Authorization = `Bearer ${accessToken}`
        return api.request(error.config)
      } catch (refreshError) {
        // 로그인 페이지로 리디렉션
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

const teacherLiveExamAPI = {
  // 실시간 시험 생성
  createLiveExam: async (examData) => {
    const response = await api.post('/api/teacher-live-exams', examData)
    return response.data
  },

  // 클래스의 실시간 시험 목록 조회
  getClassLiveExams: async (classId) => {
    const response = await api.get(`/api/teacher-live-exams/class/${classId}`)
    return response.data
  },

  // 활성 시험 목록 조회
  getActiveExams: async (classId) => {
    const response = await api.get(`/api/teacher-live-exams/class/${classId}/active`)
    return response.data
  },

  // 현재 진행 중인 시험 조회
  getCurrentExam: async (classId) => {
    const response = await api.get(`/api/teacher-live-exams/class/${classId}/current`)
    return response.data
  },

  // 오늘 예정된 시험 조회
  getTodaysExams: async (classId) => {
    const response = await api.get(`/api/teacher-live-exams/class/${classId}/today`)
    return response.data
  },

  // 시험 시작
  startExam: async (examId) => {
    const response = await api.post(`/api/teacher-live-exams/${examId}/start`)
    return response.data
  },

  // 시험 종료
  endExam: async (examId) => {
    const response = await api.post(`/api/teacher-live-exams/${examId}/end`)
    return response.data
  },
}

export default teacherLiveExamAPI