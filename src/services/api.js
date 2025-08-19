import axios from 'axios'
import { tokenManager } from './auth'

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
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
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
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            refreshToken
          })

          if (response.data.success) {
            const { accessToken, refreshToken: newRefreshToken } = response.data.data
            tokenManager.setTokens(accessToken, newRefreshToken)
            originalRequest.headers.Authorization = `Bearer ${accessToken}`
            return api(originalRequest)
          }
        }
      } catch (refreshError) {
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

// Item Processing 관련 API 함수들
export const itemProcessingAPI = {
  // 교과서 목록 조회
  getTextbooks: () => {
    return api.get('/file-history/textbook')
  },

  // 과목별 교과서 필터링
  getFilteredSubjects: (gradeCode, areaCode) => {
    return api.get('/subject/filter', {
      params: { gradeCode, areaCode }
    })
  },

  // 과목 및 교과서 정보 조회
  getSubjects: (options = {}) => {
    const params = {}

    if (options.includeTextbooks !== undefined) {
      params.includeTextbooks = options.includeTextbooks
    }

    if (options.grades && options.grades.length > 0) {
      params.grades = options.grades.join(',')
    }

    return api.get('/subject', { params })
  }
}

export default api
