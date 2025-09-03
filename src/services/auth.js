import api from './api'
import { tokenManager } from './token'

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
      const response = await api.post('/auth/login', {
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
      const response = await api.post('/auth/register', userData)
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
      const response = await api.post('/auth/refresh', {
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
   * 로그아웃 (기존 버전 - 호환성 유지)
   * @returns {Promise} 로그아웃 응답
   */
  async logout() {
    try {
      // Route legacy logout through enhanced path to ensure blacklist
      const response = await api.post('/auth/v2/logout', {
        refreshToken: tokenManager.getRefreshToken()
      })
      tokenManager.clearTokens()
      return response.data
    } catch (error) {
      console.error('Logout error:', error)
      tokenManager.clearTokens()
      throw error
    }
  },

  /**
   * 강화된 로그아웃 (JWT 블랙리스트 지원)
   * @returns {Promise} 로그아웃 응답
   */
  async logoutEnhanced() {
    try {
      const refreshToken = tokenManager.getRefreshToken()
      const response = await api.post('/auth/v2/logout', { refreshToken })
      
      tokenManager.clearTokens()
      return response.data
    } catch (error) {
      console.error('Enhanced logout error:', error)
      tokenManager.clearTokens()
      throw error
    }
  },

  /**
   * 특정 토큰 무효화 (보안 사고 대응)
   * @param {string} token - 무효화할 토큰
   * @param {string} reason - 무효화 사유
   * @returns {Promise} 무효화 응답
   */
  async revokeToken(token, reason = 'User requested') {
    try {
      const response = await api.post('/auth/v2/revoke-token', { token, reason })
      return response.data
    } catch (error) {
      console.error('Token revocation error:', error)
      throw error
    }
  },

  /**
   * 모든 토큰 무효화 (계정 탈취 대응)
   * @param {string} reason - 무효화 사유
   * @returns {Promise} 무효화 응답
   */
  async revokeAllTokens(reason = 'Security precaution') {
    try {
      const response = await api.post('/auth/v2/revoke-all-tokens', { reason })
      
      // 모든 토큰이 무효화되면 로컬 토큰도 삭제
      tokenManager.clearTokens()
      return response.data
    } catch (error) {
      console.error('All tokens revocation error:', error)
      tokenManager.clearTokens()
      throw error
    }
  },

  /**
   * 블랙리스트 통계 조회 (관리자용)
   * @returns {Promise} 블랙리스트 통계
   */
  async getBlacklistStats() {
    try {
      const response = await api.get('/auth/v2/blacklist-stats')
      return response.data
    } catch (error) {
      console.error('Get blacklist stats error:', error)
      throw error
    }
  },

  /**
   * 토큰 검증
   * @returns {Promise} 토큰 유효성
   */
  async validateToken() {
    try {
      const response = await api.get('/auth/validate')
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
      const response = await api.get('/auth/oauth2/success')

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
      const response = await api.get('/auth/oauth2/success')

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
  },

  /**
   * 현재 사용자의 학급 정보 가져오기
   * @returns {Promise} 학급 정보
   */
  async getClassInfo() {
    try {
      const response = await api.get('/classes/myclass')

      if (response.data.success) {
        return response.data.data
      }
      throw new Error(response.data.message || '학급 정보를 가져오는데 실패했습니다')
    } catch (error) {
      console.error('Get class info error:', error)
      throw error
    }
  },
  
  /**
   * 선생님의 담당 학급 정보 가져오기 (초대 코드 포함)
   * @returns {Promise} 학급 정보
   */
  async getTeacherClass() {
    try {
      const response = await api.get('/classes/teacher/my-class')

      if (response.data.success) {
        return response.data.data
      }
      return null // 학급이 없는 경우
    } catch (error) {
      console.error('Get teacher class error:', error)
      if (error.response?.status === 404) {
        return null // 학급이 없는 경우
      }
      throw error
    }
  },
  
  /**
   * 학급 정보 수정
   * @param {number} classId - 학급 ID
   * @param {object} data - 수정할 학급 정보 (className, classGrade, classSubject)
   * @returns {Promise} 수정된 학급 정보
   */
  async updateClass(classId, data) {
    try {
      const response = await api.put(`/classes/${classId}`, data)

      if (response.data.success) {
        return response.data.data
      }
      throw new Error(response.data.message || '학급 정보 수정에 실패했습니다')
    } catch (error) {
      console.error('Update class error:', error)
      throw error
    }
  }
}

export default authService
export { tokenManager }
