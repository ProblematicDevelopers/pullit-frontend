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
            <a href="#" class="find-link">아이디 찾기</a>
            <span class="divider">|</span>
            <a href="#" class="find-link">비밀번호 찾기</a>
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
        
        <div class="social-buttons">
          <button @click="socialLogin('naver')" class="social-button naver">
            <svg viewBox="0 0 24 24" class="social-icon">
              <path d="M16.273 12.845L7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845z"/>
            </svg>
            <span>네이버 로그인</span>
          </button>
          
          <button @click="socialLogin('kakao')" class="social-button kakao">
            <svg viewBox="0 0 24 24" class="social-icon">
              <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.551 1.717 4.811 4.313 6.118l-.825 3.027c-.062.226.074.461.3.523.226.062.461-.074.523-.3l3.677-2.452c.663.093 1.343.142 2.012.142 5.523 0 10-3.477 10-7.5S17.523 3 12 3z"/>
            </svg>
            <span>카카오 로그인</span>
          </button>
          
          <button @click="socialLogin('google')" class="social-button google">
            <svg viewBox="0 0 24 24" class="social-icon">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>구글 로그인</span>
          </button>
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

    <!-- Copyright -->
    <div class="copyright">
      © 2024 PULLIT. All rights reserved.
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
          router.push('/class-management')
        } else if (user.role === 'TEACHER') {
          router.push('/class-management')
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
</script>

<style scoped>
/* Login Container */
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 20px;
  background: #f8fafc;

}

/* Login Card */
.login-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  width: 100%;
  max-width: 480px;
  padding: 48px;
  position: relative;
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

.social-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.social-button {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  background: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #334155;
}

.social-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.social-button.naver {
  border-color: #03C75A;
  color: #03C75A;
}

.social-button.naver:hover {
  background: #03C75A;
  color: white;
}

.social-button.naver:hover .social-icon {
  fill: white;
}

.social-button.naver .social-icon {
  fill: #03C75A;
}

.social-button.kakao {
  border-color: #FEE500;
  background: #FEE500;
  color: #000000;
}

.social-button.kakao:hover {
  background: #FAD900;
}

.social-button.kakao .social-icon {
  fill: #000000;
}

.social-button.google {
  border-color: #e2e8f0;
}

.social-button.google:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
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