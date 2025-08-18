import axios from 'axios'
import { tokenManager } from './auth'

// API 기본 URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

// 프로덕션 환경인지 확인 (nginx 프록시 사용 여부)
const isProduction = import.meta.env.PROD

// Axios 인스턴스 생성
const api = axios.create({
  // 프로덕션: nginx가 /api 프록시 처리, 로컬: 직접 /api 경로 추가
  baseURL: isProduction ? API_BASE_URL : `${API_BASE_URL}/api`,
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
          // 리프레시 토큰 요청도 환경에 따라 분기
          const refreshUrl = isProduction 
            ? `${API_BASE_URL}/auth/refresh`
            : `${API_BASE_URL}/api/auth/refresh`
          const response = await axios.post(refreshUrl, {
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

export default api