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
    const status = route.query.status
    
    console.log('OAuth2 Callback - Provider:', provider, 'Status:', status)
    console.log('Full route:', route.fullPath)

    if (!provider) {
      statusMessage.value = '잘못된 접근입니다.'
      setTimeout(() => router.push('/login'), 2000)
      return
    }

    statusMessage.value = `${provider} 로그인을 처리하고 있습니다...`

    // status 파라미터로 처리 분기
    if (status === 'process' || !status) {
      console.log('Process mode - calling backend API...')
      // 백엔드에서 직접 리다이렉트된 경우 - API 호출하여 처리
      const response = await authService.handleOAuth2Callback(provider)
      
      console.log('OAuth2 API response:', response)
      console.log('Response data:', response.data)

      if (response.success && (response.code === 'LOGIN_SUCCESS' || response.message === 'LOGIN_SUCCESS')) {
        // 기존 사용자 로그인 성공
        const user = response.data.user

        console.log('User info:', user)
        console.log('Tokens:', {
          access: response.data.accessToken?.substring(0, 20) + '...',
          refresh: response.data.refreshToken?.substring(0, 20) + '...'
        })
        
        statusMessage.value = '로그인 성공! 페이지를 이동합니다...'

        // 토큰 저장
        authService.setTokens(response.data.accessToken, response.data.refreshToken)
        console.log('Tokens saved to localStorage')

        // 사용자 정보 저장
        localStorage.setItem('userInfo', JSON.stringify(user))
        localStorage.setItem('userType', user.role === 'TEACHER' ? 'teacher' : 'student')
        localStorage.setItem('isLoggedIn', 'true')
        console.log('User info saved to localStorage')

        // Layout store 업데이트
        layoutStore.setUserName(user.fullName || user.username)
        console.log('Layout store updated')

        // 메인 화면으로 리다이렉트
        console.log('Redirecting to main page...')
        setTimeout(() => {
          router.push('/')
        }, 1000)
      } else if (response.success && (response.code === 'NEW_USER' || response.message === 'NEW_USER')) {
        // 신규 사용자 - 회원가입 페이지로 이동
        statusMessage.value = '신규 사용자입니다. 회원가입을 진행해주세요.'

        const socialInfo = response.data
        sessionStorage.setItem('oauth2_social_info', JSON.stringify(socialInfo))

        setTimeout(() => {
          const query = {
            oauth2: 'true',
            provider: provider,
            email: socialInfo.email,
            name: socialInfo.name,
            providerId: socialInfo.providerId,
            username: socialInfo.username
          }
          console.log('Query params:', query)
          router.push({ path: '/signup', query })
        }, 2000)
      } else {
        statusMessage.value = '로그인 처리 중 오류가 발생했습니다.'
        setTimeout(() => router.push('/login'), 2000)
      }
    }
  } catch (error) {
    console.error('OAuth2 callback error:', error)
    statusMessage.value = '로그인 처리 중 오류가 발생했습니다.'
    console.error('Error details:', error.response?.data)
    setTimeout(() => router.push('/login'), 2000)
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
