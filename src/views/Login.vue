<template>
  <div class="login-container">
    <!-- Login Card -->
    <div class="login-card">
      <!-- Logo Section -->
      <div class="login-header">
        <div class="logo-wrapper">
          <img src="@/assets/logo.png" alt="Pullit Logo" class="login-logo">
        </div>
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" class="login-form">
        <!-- ID Input -->
        <div class="form-group">
          <label class="input-label">아이디</label>
          <div class="input-wrapper">
            <svg viewBox="0 0 24 24" class="input-icon">
              <path d="M12 12C14.21 12 16 10.21 16 8S14.21 4 12 4S8 5.79 8 8S9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"/>
            </svg>
            <input
              type="text"
              v-model="loginForm.username"
              placeholder="아이디를 입력하세요"
              class="form-input"
              required
            >
          </div>
        </div>

        <!-- Password Input -->
        <div class="form-group">
          <label class="input-label">비밀번호</label>
          <div class="input-wrapper">
            <svg viewBox="0 0 24 24" class="input-icon">
              <path d="M12 17C10.89 17 10 16.1 10 15S10.89 13 12 13 14 13.89 14 15 13.1 17 12 17M18 8C19.1 8 20 8.9 20 10V20C20 21.1 19.1 22 18 22H6C4.9 22 4 21.1 4 20V10C4 8.9 4.9 8 6 8H7V6C7 3.24 9.24 1 12 1S17 3.24 17 6V8H18M12 3C10.34 3 9 4.34 9 6V8H15V6C15 4.34 13.66 3 12 3Z"/>
            </svg>
            <input
              :type="showPassword ? 'text' : 'password'"
              v-model="loginForm.password"
              placeholder="비밀번호를 입력하세요"
              class="form-input"
              required
            >
            <button
              type="button"
              @click="togglePassword"
              class="password-toggle"
            >
              <svg v-if="!showPassword" viewBox="0 0 24 24" class="toggle-icon">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5S21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12S9.24 7 12 7S17 9.24 17 12S14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12S10.34 15 12 15S15 13.66 15 12S13.66 9 12 9Z"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" class="toggle-icon">
                <path d="M11.83 9L15 12.16V12C15 10.34 13.66 9 12 9H11.83ZM7.02 4.45L8.43 3.04L20.96 15.57L19.55 16.98L16.66 14.09C15.83 14.66 14.88 15 13.84 15C11.08 15 8.84 12.76 8.84 10C8.84 8.96 9.18 8.01 9.75 7.18L7.14 4.57C4.7 6.04 2.79 8.73 2 12C3.73 16.39 8 19.5 13 19.5C14.78 19.5 16.44 19.05 17.91 18.3L20.05 20.44L11.83 9Z"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Remember & Find -->
        <div class="form-options">
          <label class="checkbox-label">
            <input type="checkbox" v-model="rememberMe" class="form-checkbox">
            <span>로그인 상태 유지</span>
          </label>
          <div class="find-links">
            <a href="#" @click.prevent="showFindModal = true" class="find-link">아이디 찾기</a>
            <span class="divider">|</span>
            <a href="#" @click.prevent="showFindModal = true; findMode = 'password'" class="find-link">비밀번호 찾기</a>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="error-message">
          <svg viewBox="0 0 24 24" class="error-icon">
            <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22S22 17.52 22 12S17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"/>
          </svg>
          {{ errorMessage }}
        </div>

        <!-- Submit Button -->
        <button type="submit" class="login-button" :disabled="isLoading">
          <span v-if="!isLoading">로그인</span>
          <span v-else class="loading-spinner">
            <svg viewBox="0 0 24 24" class="spinner-icon">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20Z"/>
            </svg>
            로그인 중...
          </span>
        </button>
      </form>

      <!-- Social Login -->
      <div class="social-login-section">
        <div class="divider-with-text">
          <span>간편 로그인</span>
        </div>

        <div class="social-icons-container">
          <div class="social-icon-item" @click="socialLogin('naver')">
            <div class="social-icon-circle naver">
              <svg viewBox="0 0 24 24" class="social-icon-svg">
                <path d="M16.273 12.845L7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845z"/>
              </svg>
            </div>
            <span class="social-label">네이버</span>
          </div>

          <div class="social-icon-item" @click="socialLogin('kakao')">
            <div class="social-icon-circle kakao">
              <svg viewBox="0 0 24 24" class="social-icon-svg">
                <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.551 1.717 4.811 4.313 6.118l-.825 3.027c-.062.226.074.461.3.523.226.062.461-.074.523-.3l3.677-2.452c.663.093 1.343.142 2.012.142 5.523 0 10-3.477 10-7.5S17.523 3 12 3z"/>
              </svg>
            </div>
            <span class="social-label">카카오</span>
          </div>

          <div class="social-icon-item" @click="socialLogin('google')">
            <div class="social-icon-circle google">
              <svg viewBox="0 0 24 24" class="social-icon-svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </div>
            <span class="social-label">구글</span>
          </div>
        </div>
      </div>

      <!-- Footer Links -->
      <div class="login-footer">
        <p class="footer-text">
          아직 계정이 없으신가요?
          <router-link to="/signup" class="signup-link">회원가입</router-link>
        </p>
      </div>
    </div>

    <!-- 아이디/비밀번호 찾기 모달 -->
    <div v-if="showFindModal" class="modal-overlay" @click="closeFindModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h5 class="modal-title">{{ findMode === 'username' ? '아이디 찾기' : '비밀번호 찾기' }}</h5>
          <button type="button" class="btn-close" @click="closeFindModal"></button>
        </div>
        <div class="modal-body">
          <!-- 모드 선택 버튼 -->
          <div class="mode-selector mb-4">
            <button 
              @click="findMode = 'username'" 
              :class="['mode-btn', { active: findMode === 'username' }]"
            >
              아이디 찾기
            </button>
            <button 
              @click="findMode = 'password'" 
              :class="['mode-btn', { active: findMode === 'password' }]"
            >
              비밀번호 찾기
            </button>
          </div>

          <!-- 아이디 찾기 폼 -->
          <div v-if="findMode === 'username'">
            <form @submit.prevent="findUsername">
              <div class="form-group mb-3">
                <label class="form-label">이름</label>
                <input 
                  type="text" 
                  v-model="findForm.fullName" 
                  class="form-control" 
                  placeholder="이름을 입력하세요"
                  required
                >
              </div>
              <div class="form-group mb-3">
                <label class="form-label">휴대폰 번호</label>
                <input 
                  type="tel" 
                  v-model="findForm.phone" 
                  class="form-control" 
                  placeholder="휴대폰 번호를 입력하세요"
                  required
                >
              </div>
              <button type="submit" class="btn btn-primary w-100" :disabled="isFinding">
                <span v-if="isFinding" class="spinner-border spinner-border-sm me-2"></span>
                {{ isFinding ? '찾는 중...' : '아이디 찾기' }}
              </button>
            </form>
          </div>

          <!-- 비밀번호 찾기 폼 -->
          <div v-if="findMode === 'password'">
            <!-- 1단계: 아이디, 휴대폰 번호, 인증번호 입력 -->
            <div v-if="!showPasswordChangeForm">
              <div class="form-group mb-3">
                <label class="form-label">아이디</label>
                <input 
                  type="text" 
                  v-model="findForm.username" 
                  class="form-control" 
                  placeholder="아이디를 입력하세요"
                  required
                >
              </div>
              <div class="form-group mb-3">
                <label class="form-label">휴대폰 번호</label>
                <div class="input-group">
                  <input 
                    type="tel" 
                    v-model="findForm.phone" 
                    class="form-control" 
                    placeholder="휴대폰 번호를 입력하세요"
                    required
                  >
                  <button 
                    type="button" 
                    class="btn btn-outline-primary"
                    @click="sendVerificationCode"
                    :disabled="!findForm.phone || verificationSent"
                  >
                    {{ verificationSent ? '재전송' : '인증번호 전송' }}
                  </button>
                </div>
              </div>
              
              <!-- 인증번호 입력 -->
              <div v-if="verificationSent" class="form-group mb-3">
                <label class="form-label">인증번호</label>
                <div class="input-group">
                  <input 
                    type="text" 
                    v-model="findForm.verificationCode" 
                    class="form-control" 
                    placeholder="인증번호 6자리를 입력하세요"
                    maxlength="6"
                    required
                  >
                  <button 
                    type="button" 
                    class="btn btn-outline-success"
                    @click="verifyCode"
                    :disabled="!findForm.verificationCode || findForm.verificationCode.length !== 6"
                  >
                    확인
                  </button>
                </div>
                <small class="text-muted">
                  휴대폰으로 발송된 인증번호를 입력해주세요.
                </small>
              </div>
            </div>

            <!-- 2단계: 새 비밀번호 입력 -->
            <div v-if="showPasswordChangeForm">
              <h5 class="text-center mb-4">새 비밀번호 설정</h5>
              <form @submit.prevent="findPassword">
                <div class="form-group mb-3">
                  <label class="form-label">새 비밀번호</label>
                  <div class="input-group">
                    <input 
                      :type="showNewPassword ? 'text' : 'password'" 
                      v-model="findForm.newPassword" 
                      class="form-control" 
                      placeholder="새 비밀번호를 입력하세요"
                      required
                    >
                    <button
                      type="button"
                      @click="showNewPassword = !showNewPassword"
                      class="btn btn-outline-secondary"
                    >
                      <i :class="showNewPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                    </button>
                  </div>
                  <small class="text-muted">
                    비밀번호는 8자 이상, 소문자/숫자/특수문자(@$!%*?&)를 포함해야 합니다.
                  </small>
                </div>

                <div class="form-group mb-3">
                  <label class="form-label">새 비밀번호 확인</label>
                  <div class="input-group">
                    <input 
                      :type="showConfirmPassword ? 'text' : 'password'" 
                      v-model="findForm.confirmPassword" 
                      class="form-control" 
                      placeholder="새 비밀번호를 다시 입력하세요"
                      required
                    >
                    <button
                      type="button"
                      @click="showConfirmPassword = !showConfirmPassword"
                      class="btn btn-outline-secondary"
                    >
                      <i :class="showConfirmPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                    </button>
                  </div>
                  <small class="text-muted" v-if="findForm.confirmPassword">
                    <span v-if="findForm.newPassword === findForm.confirmPassword" class="text-success">
                      <i class="bi bi-check-circle"></i> 비밀번호가 일치합니다
                    </span>
                    <span v-else class="text-danger">
                      <i class="bi bi-x-circle"></i> 비밀번호가 일치하지 않습니다
                    </span>
                  </small>
                </div>

                <button 
                  type="submit" 
                  class="btn btn-primary w-100" 
                  :disabled="isFinding"
                >
                  <span v-if="isFinding" class="spinner-border spinner-border-sm me-2"></span>
                  {{ isFinding ? '변경 중...' : '비밀번호 변경' }}
                </button>
              </form>
            </div>
          </div>

          <!-- 결과 표시 -->
          <div v-if="findResult" class="alert alert-success mt-3">
            <div v-if="findMode === 'username' && findResult.includes('회원님의 아이디는')">
              회원님의 아이디는 <span class="found-username">{{ findResult.split('회원님의 아이디는 ')[1].split(' 입니다')[0] }}</span> 입니다.
            </div>
            <div v-else>
              {{ findResult }}
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useLayoutStore } from '@/store/layoutStore'
import authService from '@/services/auth'

const router = useRouter()
const layoutStore = useLayoutStore()

// Form data
const loginForm = ref({
  username: '',
  password: ''
})
const rememberMe = ref(false)
const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

// 아이디/비밀번호 찾기 관련
const showFindModal = ref(false)
const findMode = ref('username') // 'username' 또는 'password'
const isFinding = ref(false)
const findResult = ref('')

// 찾기 폼 데이터
const findForm = ref({
  username: '',
  phone: '',
  verificationCode: '',
  newPassword: '',
  confirmPassword: ''
})

// SMS 인증 관련
const verificationSent = ref(false)
const phoneVerified = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const showPasswordChangeForm = ref(false) // 새 비밀번호 입력 화면 표시 여부

// Toggle password visibility
const togglePassword = () => {
  showPassword.value = !showPassword.value
}

// Handle login
const handleLogin = async () => {
  errorMessage.value = ''
  isLoading.value = true

  try {
    // 실제 백엔드 로그인 API 호출
    const response = await authService.login(
      loginForm.value.username,
      loginForm.value.password
    )

    if (response.success) {
      const user = response.data.user

      // 사용자 타입 설정 (TEACHER, STUDENT, ADMIN)
      const userType = user.role === 'TEACHER' ? 'teacher' : 'student'

      // Layout store 업데이트
      layoutStore.setUserName(user.fullName || user.username)

      // 이전 페이지로 리다이렉트 또는 기본 페이지로 이동
      const redirectTo = router.currentRoute.value.query.redirect
      if (redirectTo) {
        router.push(redirectTo)
      } else {
        // 역할에 따라 기본 페이지로 리다이렉트
        if (user.role === 'ADMIN') {
          router.push('/class-dashboard')
        } else if (user.role === 'TEACHER') {
          router.push('/class-dashboard')
        } else {
          router.push('/student/main')
        }
      }
    }
  } catch (error) {
    console.error('Login error:', error)

    // 에러 메시지 처리
    if (error.response?.status === 401) {
      errorMessage.value = '아이디 또는 비밀번호가 올바르지 않습니다'
    } else if (error.response?.status === 403) {
      errorMessage.value = '계정이 잠겨있습니다. 관리자에게 문의하세요'
    } else if (error.response?.data?.message) {
      errorMessage.value = error.response.data.message
    } else {
      errorMessage.value = '로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요'
    }
  } finally {
    isLoading.value = false
  }
}

// Social login
const socialLogin = async (provider) => {
  try {
    console.log(`${provider} 로그인 시작`)
    errorMessage.value = ''

    // 소셜 로그인 시작
    await authService.startSocialLogin(provider)
  } catch (error) {
    console.error('Social login error:', error)
    errorMessage.value = `${provider} 로그인 중 오류가 발생했습니다.`
  }
}

// 아이디/비밀번호 찾기 관련 메서드들
const closeFindModal = () => {
  showFindModal.value = false
  findResult.value = ''
  resetFindForm()
}

const resetFindForm = () => {
  findForm.value = {
    username: '',
    phone: '',
    verificationCode: '',
    newPassword: '',
    confirmPassword: ''
  }
  verificationSent.value = false
  phoneVerified.value = false
  showNewPassword.value = false
  showConfirmPassword.value = false
  showPasswordChangeForm.value = false
}

const findUsername = async () => {
  isFinding.value = true
  findResult.value = ''

  try {
    console.log('아이디 찾기 시작')
    console.log('입력된 이름:', findForm.value.fullName)
    console.log('입력된 휴대폰 번호:', findForm.value.phone)
    
    // 휴대폰 번호 정규화 (하이픈 제거)
    const normalizedPhone = findForm.value.phone.replace(/[^0-9]/g, '')
    console.log('정규화된 휴대폰 번호:', normalizedPhone)
    
    const requestBody = {
      fullName: findForm.value.fullName,
      phone: normalizedPhone
    }
    console.log('요청 데이터:', requestBody)
    
    // 먼저 서버 연결 테스트
    try {
      const testResponse = await fetch('http://localhost:8080/api/users/check/username/test12')
      console.log('서버 연결 테스트:', testResponse.status)
    } catch (error) {
      console.error('서버 연결 실패:', error)
    }
    
    const response = await fetch('http://localhost:8080/api/users/find/username', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    console.log('응답 상태:', response.status)
    console.log('응답 상태 텍스트:', response.statusText)
    
    const data = await response.json()
    console.log('응답 데이터:', data)

    if (response.ok) {
      findResult.value = `회원님의 아이디는 ${data.data} 입니다.`
    } else {
      throw new Error(data.message || '아이디를 찾을 수 없습니다.')
    }
  } catch (error) {
    console.error('아이디 찾기 에러:', error)
    findResult.value = error.message || '아이디 찾기 중 오류가 발생했습니다.'
  } finally {
    isFinding.value = false
  }
}

const sendVerificationCode = async () => {
  try {
    // 휴대폰 번호 정규화 (하이픈 제거)
    const normalizedPhone = findForm.value.phone.replace(/[^0-9]/g, '')
    
    // 테스트용 휴대폰 번호 체크
    if (normalizedPhone === '01011111111') {
      verificationSent.value = true
      alert('테스트 모드: 인증번호 000000이 발송되었습니다.')
      return
    }
    
    // 실제 SMS 발송 API 호출 (회원가입에서 사용하는 것과 동일)
    const response = await fetch('http://localhost:8080/api/auth/verification/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: normalizedPhone
      })
    })

    if (response.ok) {
      verificationSent.value = true
      alert('인증번호가 발송되었습니다.')
    } else {
      throw new Error('인증번호 발송에 실패했습니다.')
    }
  } catch (error) {
    console.error('인증번호 발송 에러:', error)
    alert(error.message || '인증번호 발송 중 오류가 발생했습니다.')
  }
}

const verifyCode = async () => {
  try {
    // 휴대폰 번호 정규화 (하이픈 제거)
    const normalizedPhone = findForm.value.phone.replace(/[^0-9]/g, '')
    
    // 테스트용 휴대폰 번호 체크
    if (normalizedPhone === '01011111111') {
      if (findForm.value.verificationCode === '000000') {
        phoneVerified.value = true
        showPasswordChangeForm.value = true // 새 비밀번호 입력 화면으로 전환
        alert('테스트 모드: 인증이 완료되었습니다. 새 비밀번호를 입력해주세요.')
        return
      } else {
        throw new Error('테스트 모드: 인증번호는 000000입니다.')
      }
    }
    
    // 실제 인증번호 확인 API 호출
    const response = await fetch('http://localhost:8080/api/auth/verification/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: normalizedPhone,
        code: findForm.value.verificationCode
      })
    })

    if (response.ok) {
      phoneVerified.value = true
      showPasswordChangeForm.value = true // 새 비밀번호 입력 화면으로 전환
      alert('인증이 완료되었습니다. 새 비밀번호를 입력해주세요.')
    } else {
      throw new Error('인증번호가 올바르지 않습니다.')
    }
  } catch (error) {
    console.error('인증번호 확인 에러:', error)
    alert(error.message || '인증번호 확인 중 오류가 발생했습니다.')
  }
}

const findPassword = async () => {
  if (findForm.value.newPassword !== findForm.value.confirmPassword) {
    alert('새 비밀번호가 일치하지 않습니다.')
    return
  }

  isFinding.value = true
  findResult.value = ''

  try {
    // 휴대폰 번호 정규화 (하이픈 제거)
    const normalizedPhone = findForm.value.phone.replace(/[^0-9]/g, '')
    
    const response = await fetch('http://localhost:8080/api/users/find/password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: findForm.value.username,
        phone: normalizedPhone,
        verificationCode: findForm.value.verificationCode,
        newPassword: findForm.value.newPassword,
        confirmPassword: findForm.value.confirmPassword
      })
    })

    const data = await response.json()

    if (response.ok) {
      findResult.value = '비밀번호가 성공적으로 변경되었습니다.'
      setTimeout(() => {
        closeFindModal()
      }, 2000)
    } else {
      throw new Error(data.message || '비밀번호 변경에 실패했습니다.')
    }
  } catch (error) {
    console.error('비밀번호 찾기 에러:', error)
    findResult.value = error.message || '비밀번호 찾기 중 오류가 발생했습니다.'
  } finally {
    isFinding.value = false
  }
}
</script>

<style scoped>
/* Login Container */
.login-container {
  position: relative;
  width: 100%;
  height: 100vh;
  background: #f8fafc;
  padding: 80px 20px;
  box-sizing: border-box;
}

/* Login Card */
.login-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  width: 100%;
  max-width: 420px;
  padding: 50px 40px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  margin: 0;
  box-sizing: border-box;
}

/* Login Header */
.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo-wrapper {
  width: 120px;
  height: 120px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.input-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 8px;
}

/* Form */
.login-form {
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 16px;
  width: 20px;
  height: 20px;
  fill: #94a3b8;
  pointer-events: none;
}

.form-input {
  width: 100%;
  padding: 12px 16px 12px 48px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 15px;
  color: #1e293b;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-input::placeholder {
  color: #94a3b8;
}

.password-toggle {
  position: absolute;
  right: 16px;
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-icon {
  width: 20px;
  height: 20px;
  fill: #64748b;
  transition: fill 0.2s;
}

.password-toggle:hover .toggle-icon {
  fill: #334155;
}

/* Form Options */
.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 14px;
  color: #475569;
}

.form-checkbox {
  margin-right: 8px;
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.find-links {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.find-link {
  color: #64748b;
  text-decoration: none;
  transition: color 0.2s;
}

.find-link:hover {
  color: #2563eb;
}

.divider {
  color: #cbd5e1;
}

/* Error Message */
.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #dc2626;
}

.error-icon {
  width: 20px;
  height: 20px;
  fill: #dc2626;
  flex-shrink: 0;
}

/* Login Button */
.login-button {
  width: 100%;
  padding: 14px 24px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.login-button:hover:not(:disabled) {
  background: #1d4ed8;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-spinner {
  display: flex;
  align-items: center;
  gap: 8px;
}

.spinner-icon {
  width: 20px;
  height: 20px;
  fill: white;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Social Login Section */
.social-login-section {
  margin-top: 32px;
}

.divider-with-text {
  position: relative;
  text-align: center;
  margin-bottom: 24px;
}

.divider-with-text::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e2e8f0;
}

.divider-with-text span {
  position: relative;
  background: white;
  padding: 0 16px;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 500;
}

/* 새로운 동그라미 아이콘 스타일 */
.social-icons-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  margin-top: 1rem;
}

.social-icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.social-icon-item:hover {
  transform: translateY(-4px);
}

.social-icon-circle {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.social-icon-circle::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.social-icon-item:hover .social-icon-circle::before {
  opacity: 1;
}

.social-icon-svg {
  width: 1.5rem;
  height: 1.5rem;
  z-index: 1;
  position: relative;
}

.social-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
  transition: color 0.3s ease;
}

.social-icon-item:hover .social-label {
  color: #334155;
  font-weight: 600;
}

/* 네이버 스타일 */
.social-icon-circle.naver {
  background: linear-gradient(135deg, #03C75A 0%, #02A94E 100%);
  box-shadow: 0 4px 12px rgba(3, 199, 90, 0.3);
}

.social-icon-item:hover .social-icon-circle.naver {
  box-shadow: 0 8px 25px rgba(3, 199, 90, 0.4);
  transform: scale(1.05);
}

.social-icon-circle.naver .social-icon-svg {
  fill: white;
}

/* 카카오 스타일 */
.social-icon-circle.kakao {
  background: linear-gradient(135deg, #FEE500 0%, #FAD900 100%);
  box-shadow: 0 4px 12px rgba(254, 229, 0, 0.3);
}

.social-icon-item:hover .social-icon-circle.kakao {
  box-shadow: 0 8px 25px rgba(254, 229, 0, 0.4);
  transform: scale(1.05);
}

.social-icon-circle.kakao .social-icon-svg {
  fill: #000000;
}

/* 구글 스타일 */
.social-icon-circle.google {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 2px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.social-icon-item:hover .social-icon-circle.google {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  transform: scale(1.05);
  border-color: #cbd5e1;
}

.social-icon-circle.google .social-icon-svg {
  fill: #4285F4;
}


/* Footer */
.login-footer {
  text-align: center;
  margin-top: 24px;
}

.footer-text {
  font-size: 14px;
  color: #64748b;
}

.signup-link {
  color: #2563eb;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.signup-link:hover {
  color: #1d4ed8;
}

/* Copyright */
.copyright {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  color: #94a3b8;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 16px;
  border: none;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
}

.modal-header {
  border-bottom: 1px solid #e2e8f0;
  border-radius: 16px 16px 0 0;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #64748b;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  color: #334155;
}

.modal-body {
  padding: 1.5rem;
  max-height: 60vh;
  overflow-y: auto;
}

/* Mode Selector */
.mode-selector {
  display: flex;
  gap: 0.5rem;
  border-radius: 8px;
  padding: 0.25rem;
  background: #f1f5f9;
}

.mode-btn {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #64748b;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-btn.active {
  background: white;
  color: #2563eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.mode-btn:hover:not(.active) {
  color: #334155;
}

/* Form Styles */
.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #1f2937;
  transition: all 0.2s;
}

.form-control:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.input-group {
  display: flex;
  gap: 0.5rem;
}

.input-group .form-control {
  flex: 1;
}

.btn {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1d4ed8;
}

.btn-outline-primary {
  background: transparent;
  color: #2563eb;
  border: 2px solid #2563eb;
}

.btn-outline-primary:hover:not(:disabled) {
  background: #2563eb;
  color: white;
}

.btn-outline-success {
  background: transparent;
  color: #059669;
  border: 2px solid #059669;
}

.btn-outline-success:hover:not(:disabled) {
  background: #059669;
  color: white;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.alert {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  margin-top: 1rem;
}

.alert-success {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.found-username {
  font-size: 1.2rem;
  font-weight: 700;
  color: #059669;
  background: #ecfdf5;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  border: 2px solid #10b981;
  display: inline-block;
  margin: 0 0.25rem;
}

/* Responsive */
@media (max-width: 768px) {
  .login-card {
    padding: 32px 24px;
  }

  .login-title {
    font-size: 28px;
  }

  .demo-buttons {
    grid-template-columns: 1fr;
  }

  .social-icons-container {
    gap: 1.5rem;
  }

  .social-icon-circle {
    width: 3.5rem;
    height: 3.5rem;
  }

  .social-icon-svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  .modal-content {
    width: 95%;
    margin: 1rem;
  }

  .modal-body {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .login-card {
    padding: 24px 20px;
  }

  .form-options {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
