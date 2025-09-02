<template>
  <div class="change-password-page">
    <Header />
    <div class="password-container">
      <div class="row justify-content-center">
        <div class="col-12 col-md-8 col-lg-6 col-xl-5">
          <div class="card shadow-lg border-0">
            <div class="card-header bg-primary text-white text-center py-4">
              <h3 class="mb-0 fw-bold">
                비밀번호 변경
              </h3>
            </div>

            <div class="card-body p-4 p-md-5">
              <form @submit.prevent="changePassword">
                <!-- 현재 비밀번호 -->
                <div class="mb-4">
                  <label for="currentPassword" class="form-label fw-bold">현재 비밀번호</label>
                  <div class="input-group">
                    <input
                      :type="showCurrentPassword ? 'text' : 'password'"
                      class="form-control"
                      id="currentPassword"
                      v-model="passwordForm.currentPassword"
                      required
                      placeholder="현재 비밀번호를 입력하세요"
                    >
                    <button
                      class="btn btn-outline-secondary"
                      type="button"
                      @click="showCurrentPassword = !showCurrentPassword"
                    >
                      <i :class="showCurrentPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                    </button>
                  </div>
                </div>

                <!-- 새 비밀번호 -->
                <div class="mb-4">
                  <label for="newPassword" class="form-label fw-bold">새 비밀번호</label>
                  <div class="input-group">
                    <input
                      :type="showNewPassword ? 'text' : 'password'"
                      class="form-control"
                      id="newPassword"
                      v-model="passwordForm.newPassword"
                      required
                      placeholder="새 비밀번호를 입력하세요"
                      @input="validatePassword"
                    >
                    <button
                      class="btn btn-outline-secondary"
                      type="button"
                      @click="showNewPassword = !showNewPassword"
                    >
                      <i :class="showNewPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                    </button>
                  </div>
                  <div class="form-text">
                    <small class="text-muted">
                      비밀번호는 8자 이상, 영문/숫자/특수문자를 포함해야 합니다.
                    </small>
                  </div>
                  
                  <!-- 비밀번호 강도 표시 -->
                  <div class="mt-2" v-if="passwordForm.newPassword">
                    <div class="password-strength">
                      <div class="progress" style="height: 6px;">
                        <div 
                          class="progress-bar" 
                          :class="strengthClass"
                          :style="{ width: strengthPercentage + '%' }"
                        ></div>
                      </div>
                      <small class="text-muted mt-1 d-block">
                        {{ strengthText }}
                      </small>
                    </div>
                  </div>
                </div>

                <!-- 새 비밀번호 확인 -->
                <div class="mb-4">
                  <label for="confirmPassword" class="form-label fw-bold">새 비밀번호 확인</label>
                  <div class="input-group">
                    <input
                      :type="showConfirmPassword ? 'text' : 'password'"
                      class="form-control"
                      id="confirmPassword"
                      v-model="passwordForm.confirmPassword"
                      required
                      placeholder="새 비밀번호를 다시 입력하세요"
                      @input="validatePassword"
                    >
                    <button
                      class="btn btn-outline-secondary"
                      type="button"
                      @click="showConfirmPassword = !showConfirmPassword"
                    >
                      <i :class="showConfirmPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                    </button>
                  </div>
                  
                  <!-- 비밀번호 일치 여부 -->
                  <div class="mt-2" v-if="passwordForm.confirmPassword">
                    <small class="text-muted" :class="passwordMatch ? 'text-success' : 'text-danger'">
                      <i :class="passwordMatch ? 'bi bi-check-circle' : 'bi bi-x-circle'" class="me-1"></i>
                      {{ passwordMatch ? '비밀번호가 일치합니다.' : '비밀번호가 일치하지 않습니다.' }}
                    </small>
                  </div>
                </div>

                <!-- 버튼 -->
                <div class="d-grid gap-3">
                  <button 
                    type="submit" 
                    class="btn btn-primary" 
                    :disabled="!canSubmit || isChanging"
                  >
                    <span v-if="isChanging" class="spinner-border spinner-border-sm me-2" role="status"></span>
                    {{ isChanging ? '변경 중...' : '비밀번호 변경' }}
                  </button>
                  <button 
                    type="button" 
                    @click="goBack" 
                    class="btn btn-outline-secondary"
                    :disabled="isChanging"
                  >
                    돌아가기
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import Header from '@/components/common/Header.vue'

const router = useRouter()

// 반응형 데이터
const isChanging = ref(false)

// 비밀번호 표시 상태
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// 비밀번호 폼
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 비밀번호 강도 계산
const passwordStrength = computed(() => {
  const password = passwordForm.value.newPassword
  if (!password) return 0

  let score = 0
  
  // 길이 체크
  if (password.length >= 8) score += 20
  if (password.length >= 12) score += 10
  
  // 문자 종류 체크 (백엔드 규칙에 맞춤)
  if (/[a-z]/.test(password)) score += 25
  if (/[0-9]/.test(password)) score += 25
  if (/[@$!%*?&#]/.test(password)) score += 30
  
  return Math.min(score, 100)
})

const strengthPercentage = computed(() => passwordStrength.value)

const strengthClass = computed(() => {
  const strength = passwordStrength.value
  if (strength < 40) return 'bg-danger'
  if (strength < 70) return 'bg-warning'
  return 'bg-success'
})

const strengthText = computed(() => {
  const strength = passwordStrength.value
  if (strength < 40) return '약함'
  if (strength < 70) return '보통'
  return '강함'
})

// 비밀번호 일치 여부
const passwordMatch = computed(() => {
  return passwordForm.value.newPassword === passwordForm.value.confirmPassword &&
         passwordForm.value.newPassword !== ''
})

// 제출 가능 여부
const canSubmit = computed(() => {
  return passwordForm.value.currentPassword &&
         passwordForm.value.newPassword &&
         passwordForm.value.confirmPassword &&
         passwordMatch.value &&
         passwordStrength.value >= 40
})

// 비밀번호 유효성 검사
const validatePassword = () => {
  // 추가적인 유효성 검사 로직
}

// 비밀번호 변경
const changePassword = async () => {
  if (!canSubmit.value) return

  isChanging.value = true

  try {
    const response = await fetch('http://localhost:8080/api/users/me/password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: JSON.stringify({
        oldPassword: passwordForm.value.currentPassword,
        newPassword: passwordForm.value.newPassword,
        confirmPassword: passwordForm.value.confirmPassword
      })
    })

    if (response.ok) {
      // 비밀번호 변경 성공 시 로그아웃 처리
      alert('비밀번호가 성공적으로 변경되었습니다. 보안을 위해 다시 로그인해주세요.')
      
      // 로컬 스토리지에서 토큰 제거
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('userInfo')
      
      // 로그인 페이지로 리다이렉트
      router.push('/login')
    } else {
      const errorData = await response.json()
      throw new Error(errorData.message || '비밀번호 변경 실패')
    }
  } catch (error) {
    console.error('비밀번호 변경 에러:', error)
    alert(error.message || '비밀번호 변경 중 오류가 발생했습니다.')
  } finally {
    isChanging.value = false
  }
}

// 돌아가기
const goBack = () => {
  router.push('/profile')
}
</script>

<style scoped>
.change-password-page {
  min-height: 100vh;
  background-color: #f8f9fa;
  padding: 2rem 0;
}

.password-container {
  padding: 2rem 1rem;
}

.card {
  border-radius: 1rem;
  border: none;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.card-header {
  border-radius: 1rem 1rem 0 0 !important;
  border-bottom: none;
}

.form-control:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}

.input-group .btn {
  border-left: none;
  border-color: #ced4da;
  background-color: #f8f9fa;
  transition: all 0.2s ease;
}

.input-group .btn:hover {
  background-color: #e9ecef;
  border-color: #adb5bd;
}

.input-group .form-control {
  border-right: none;
  border-color: #ced4da;
}

.input-group .form-control:focus {
  border-right: none;
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}

.input-group .form-control:focus + .btn {
  border-color: #0d6efd;
  background-color: #f8f9fa;
}

.btn-primary {
  background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%);
  border: none;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(13, 110, 253, 0.3);
}

.password-strength {
  margin-top: 0.5rem;
}

.progress {
  border-radius: 0.5rem;
  background-color: #e9ecef;
}

.progress-bar {
  transition: width 0.3s ease;
}

.alert {
  border-radius: 0.5rem;
  border: none;
  padding: 0.75rem 1rem;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .password-container {
    padding: 1rem 0.5rem;
  }

  .card-body {
    padding: 1.5rem !important;
  }
}
</style>
