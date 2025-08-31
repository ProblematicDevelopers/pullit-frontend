import axios from 'axios'

// API 기본 URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

// 프로덕션 환경인지 확인
const isProduction = import.meta.env.PROD

// Axios 인스턴스 생성
const authApi = axios.create({
  // 프로덕션: nginx가 /api 프록시 처리, 로컬: 직접 /api 경로 추가
  baseURL: isProduction ? `${API_BASE_URL}/auth` : `${API_BASE_URL}/api/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // CORS 쿠키 전송 허용
})

// 토큰 관리 유틸리티
const tokenManager = {
  getAccessToken: () => localStorage.getItem('accessToken'),
  getRefreshToken: () => localStorage.getItem('refreshToken'),

  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
  },

  clearTokens: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userInfo')
    localStorage.removeItem('userType')
    localStorage.removeItem('isLoggedIn')
  }
}

// 요청 인터셉터 - 모든 요청에 토큰 추가
authApi.interceptors.request.use(
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

// 응답 인터셉터 - 토큰 만료 처리
authApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = tokenManager.getRefreshToken()
        if (refreshToken) {
          const response = await authService.refreshToken(refreshToken)
          tokenManager.setTokens(response.data.accessToken, response.data.refreshToken)
          originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`
          return authApi(originalRequest)
        }
      } catch (refreshError) {
        tokenManager.clearTokens()
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

// 인증 서비스
const authService = {
  /**
   * 로그인
   * @param {string} username - 사용자 ID
   * @param {string} password - 비밀번호
   * @returns {Promise} 로그인 응답
   */
  async login(username, password) {
    try {
      const response = await authApi.post('/login', {
        username,
        password
      })

      if (response.data.success) {
        const { accessToken, refreshToken, user } = response.data.data

        // 토큰 저장
        tokenManager.setTokens(accessToken, refreshToken)

        // 사용자 정보 저장
        localStorage.setItem('userInfo', JSON.stringify(user))
        localStorage.setItem('userType', user.role === 'TEACHER' ? 'teacher' : 'student')
        localStorage.setItem('isLoggedIn', 'true')

        return response.data
      }

      throw new Error(response.data.message || '로그인 실패')
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  },

  /**
   * 회원가입
   * @param {Object} userData - 회원가입 정보
   * @returns {Promise} 회원가입 응답
   */
  async register(userData) {
    try {
      const response = await authApi.post('/register', userData)
      return response.data
    } catch (error) {
      console.error('Register error:', error)
      throw error
    }
  },

  /**
   * 토큰 재발급
   * @param {string} refreshToken - 리프레시 토큰
   * @returns {Promise} 새로운 토큰
   */
  async refreshToken(refreshToken) {
    try {
      const response = await authApi.post('/refresh', {
        refreshToken
      })

      if (response.data.success) {
        const { accessToken, refreshToken: newRefreshToken } = response.data.data
        tokenManager.setTokens(accessToken, newRefreshToken)
      }

      return response.data
    } catch (error) {
      console.error('Token refresh error:', error)
      throw error
    }
  },

  /**
   * 로그아웃
   * @returns {Promise} 로그아웃 응답
   */
  async logout() {
    try {
      const response = await authApi.post('/logout')
      tokenManager.clearTokens()
      return response.data
    } catch (error) {
      console.error('Logout error:', error)
      tokenManager.clearTokens()
      throw error
    }
  },

  /**
   * 토큰 검증
   * @returns {Promise} 토큰 유효성
   */
  async validateToken() {
    try {
      const response = await authApi.get('/validate')
      return response.data
    } catch (error) {
      console.error('Token validation error:', error)
      throw error
    }
  },

  /**
   * 소셜 로그인 시작
   * @param {string} provider - 소셜 로그인 제공자 (google, kakao, naver)
   */
  async startSocialLogin(provider) {
    try {
      // Spring Security OAuth2 표준 경로로 직접 리디렉션
      const baseUrl = isProduction ? API_BASE_URL : 'http://localhost:8080'
      const oauthUrl = `${baseUrl}/oauth2/authorization/${provider}`

      console.log(`Starting OAuth2 login for ${provider}: ${oauthUrl}`)
      window.location.href = oauthUrl
    } catch (error) {
      console.error('Social login error:', error)
      throw error
    }
  },

  /**
   * OAuth2 콜백 처리 (세션 기반)
   * @param {string} provider - 소셜 로그인 제공자
   * @returns {Promise} 로그인 응답
   */
  async handleOAuth2Callback(provider) {
    try {
      console.log(`Processing OAuth2 callback for ${provider}`)

      // OAuth2 성공 엔드포인트 호출 (세션 기반)
      const response = await authApi.get('/oauth2/success')

      console.log('OAuth2 callback response:', response.data)

      if (response.data.success) {
        return response.data
      }

      throw new Error(response.data.message || '소셜 로그인 실패')
    } catch (error) {
      console.error('OAuth2 callback error:', error)

      // NEW_USER 응답도 에러로 처리될 수 있으므로 응답 데이터 확인
      if (error.response?.data?.code === 'NEW_USER') {
        return error.response.data
      }

      throw error
    }
  },

  /**
   * 소셜 로그인 콜백 처리 (기존 방식 - 호환성 유지)
   * @param {string} provider - 소셜 로그인 제공자
   * @returns {Promise} 로그인 응답
   */
  async handleSocialLoginCallback(provider) {
    try {
      // OAuth2 성공 엔드포인트 호출
      const response = await authApi.get('/oauth2/success')

      if (response.data.success) {
        const { accessToken, refreshToken, user } = response.data.data

        // 토큰 저장
        tokenManager.setTokens(accessToken, refreshToken)

        // 사용자 정보 저장
        localStorage.setItem('userInfo', JSON.stringify(user))
        localStorage.setItem('userType', user.role.toLowerCase())
        localStorage.setItem('isLoggedIn', 'true')

        return response.data
      }

      throw new Error(response.data.message || '소셜 로그인 실패')
    } catch (error) {
      console.error('Social login error:', error)
      throw error
    }
  },

  /**
   * 토큰 설정 (외부에서 호출 가능하도록)
   */
  setTokens(accessToken, refreshToken) {
    tokenManager.setTokens(accessToken, refreshToken)
  },

  /**
   * 현재 로그인 사용자 정보 가져오기
   * @returns {Object|null} 사용자 정보
   */
  getCurrentUser() {
    const userInfo = localStorage.getItem('userInfo')
    return userInfo ? JSON.parse(userInfo) : null
  },

  /**
   * 로그인 여부 확인
   * @returns {boolean} 로그인 상태
   */
  isAuthenticated() {
    return !!tokenManager.getAccessToken()
  }
}

export default authService
export { tokenManager }
