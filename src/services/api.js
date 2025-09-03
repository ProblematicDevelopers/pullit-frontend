import axios from 'axios'
import { tokenManager } from './token'

// API 기본 URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

// 프로덕션 환경인지 확인
const isProduction = import.meta.env.PROD

// Axios 인스턴스 생성
const api = axios.create({
  // 프로덕션: nginx가 /api 프록시 처리, 로컬: 직접 /api 경로 추가
  baseURL: isProduction ? `${API_BASE_URL}` : `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
})

// 요청 인터셉터 - 모든 요청에 토큰 추가
api.interceptors.request.use(
  (config) => {
    const token = tokenManager.getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // FormData인 경우 Content-Type 헤더 제거 (브라우저가 자동으로 multipart/form-data 설정)
    if (config.data instanceof FormData ||
        (config.data && config.data.constructor && config.data.constructor.name === 'FormData') ||
        (config.data && typeof config.data.append === 'function')) {
      delete config.headers['Content-Type']
    }

    return config
  },
  (error) => Promise.reject(error)
)

// 응답 인터셉터 - 에러 처리
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // 401 에러 처리 (토큰 만료)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = tokenManager.getRefreshToken()
        if (refreshToken) {
          // Use a bare axios call to avoid interceptor recursion
          const response = await axios.post(
            `${API_BASE_URL}/api/auth/refresh`,
            { refreshToken },
            { headers: { 'Content-Type': 'application/json' } }
          )

          if (response.data.success) {
            const { accessToken, refreshToken: newRefreshToken } = response.data.data
            tokenManager.setTokens(accessToken, newRefreshToken)
            originalRequest.headers.Authorization = `Bearer ${accessToken}`
            return api(originalRequest)
          }
        }
      } catch (refreshError) {
        console.error('토큰 갱신 실패:', refreshError)
        tokenManager.clearTokens()
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

// CBT 관련 API 함수들
export const cbtAPI = {
  // CBT 생성
  createCBT: (data) => {
    return api.post('/cbt/create', data)
  },

  // CBT 목록 조회
  getCBTList: () => {
    return api.get('/cbt/list')
  },

  // CBT 상세 조회
  getCBTDetail: (cbtId) => {
    return api.get(`/cbt/${cbtId}`)
  }
}

// 인증 관련 API 함수들
export const authAPI = {
  // 휴대폰 인증번호 발송
  sendVerificationCode: (phoneNumber) => {
    return api.post('/auth/verification/send', { phoneNumber })
  },

  // 인증번호 확인
  verifyCode: (phoneNumber, code) => {
    return api.post('/auth/verification/verify', { phoneNumber, code })
  },

  // 인증번호 재발송
  resendVerificationCode: (phoneNumber) => {
    return api.post('/auth/verification/resend', { phoneNumber })
  }
}

// 사용자 관련 API 함수들
export const userAPI = {
  // 아이디 중복 확인
  checkUsername: (username) => {
    const encoded = encodeURIComponent(username)
    return api.get(`/users/check/username/${encoded}`)
  },

  // 이메일 중복 확인
  checkEmail: (email) => {
    const encoded = encodeURIComponent(email)
    return api.get(`/users/check/email/${encoded}`)
  }
}

// 교사 성적 통계 API
export const teacherStatsAPI = {
  // 클래스 전체 성적 개요
  getClassOverview: (classId) => {
    return api.get(`/teacher/stats/class/${classId}/overview`)
  },

  // 전체 학생 성적 목록
  getStudentsGrades: (classId, examId = null) => {
    const params = examId ? { examId } : {}
    return api.get(`/teacher/stats/class/${classId}/students`, { params })
  },

  // 학생 개인 상세 성적
  getStudentDetail: (classId, studentId) => {
    return api.get(`/teacher/stats/class/${classId}/student/${studentId}`)
  },

  // 시험별 상세 결과
  getExamResultDetail: (classId, examId) => {
    return api.get(`/teacher/stats/class/${classId}/exam/${examId}`)
  },

  // 성적 분포도
  getGradeDistribution: (classId, examId = null) => {
    const params = examId ? { examId } : {}
    return api.get(`/teacher/stats/class/${classId}/distribution`, { params })
  },

  // 시험별 비교
  getExamComparison: (classId) => {
    return api.get(`/teacher/stats/class/${classId}/comparison`)
  }
}

export default api
