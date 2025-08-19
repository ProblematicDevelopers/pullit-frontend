<template>
  <div class="oauth2-callback">
    <div class="callback-container">
      <div class="loading-spinner">
        <svg viewBox="0 0 24 24" class="spinner-icon">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20Z"/>
        </svg>
      </div>
      <h2>소셜 로그인 처리 중...</h2>
      <p>{{ statusMessage }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useLayoutStore } from '@/store/layoutStore'
import authService from '@/services/auth'

const router = useRouter()
const route = useRoute()
const layoutStore = useLayoutStore()

const statusMessage = ref('로그인 정보를 확인하고 있습니다...')

onMounted(async () => {
  try {
    // URL에서 provider 정보 추출
    const provider = route.params.provider || route.query.provider
    
    if (!provider) {
      statusMessage.value = '잘못된 접근입니다.'
      setTimeout(() => router.push('/login'), 2000)
      return
    }

    statusMessage.value = `${provider} 로그인을 처리하고 있습니다...`
    
    // 소셜 로그인 콜백 처리
    const response = await authService.handleSocialLoginCallback(provider)
    
    if (response.success) {
      const user = response.data.user
      
      statusMessage.value = '로그인 성공! 페이지를 이동합니다...'
      
      // 사용자 타입 설정
      const userType = user.role === 'TEACHER' ? 'teacher' : 'student'
      
      // Layout store 업데이트
      layoutStore.setUserName(user.fullName || user.username)
      
      // 역할에 따라 기본 페이지로 리다이렉트
      setTimeout(() => {
        if (user.role === 'ADMIN') {
          router.push('/class-management')
        } else if (user.role === 'TEACHER') {
          router.push('/class-management')
        } else {
          router.push('/student/main')
        }
      }, 1000)
    }
  } catch (error) {
    console.error('OAuth2 callback error:', error)
    
    if (error.message === 'NEW_USER') {
      statusMessage.value = '신규 사용자입니다. 회원가입을 진행해주세요.'
      // TODO: 회원가입 플로우로 이동
      setTimeout(() => router.push('/oauth2/registration-choice'), 2000)
    } else {
      statusMessage.value = '로그인 처리 중 오류가 발생했습니다.'
      setTimeout(() => router.push('/login'), 2000)
    }
  }
})
</script>

<style scoped>
.oauth2-callback {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
}

.callback-container {
  text-align: center;
  background: white;
  padding: 48px;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  max-width: 400px;
  width: 100%;
}

.loading-spinner {
  margin-bottom: 24px;
}

.spinner-icon {
  width: 48px;
  height: 48px;
  animation: spin 1s linear infinite;
  color: #3b82f6;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

h2 {
  color: #1f2937;
  margin-bottom: 16px;
  font-size: 20px;
  font-weight: 600;
}

p {
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
}
</style> 