# JWT 블랙리스트 기능 사용 가이드 (Frontend)

## 📌 새로운 API 함수들

auth.js에 다음 함수들이 추가되었습니다:

### 1. 강화된 로그아웃 (logoutEnhanced)
```javascript
import authService from '@/services/auth'

// 컴포넌트에서 사용
async handleLogout() {
  try {
    // 새로운 강화된 로그아웃 사용 (블랙리스트 지원)
    await authService.logoutEnhanced()
    
    // 로그인 페이지로 리디렉션
    this.$router.push('/login')
    this.$message.success('로그아웃되었습니다')
  } catch (error) {
    console.error('로그아웃 실패:', error)
    this.$message.error('로그아웃 중 오류가 발생했습니다')
  }
}
```

### 2. 특정 토큰 무효화 (revokeToken)
```javascript
// 의심스러운 활동 감지 시 특정 토큰 무효화
async handleSuspiciousActivity(suspiciousToken) {
  try {
    await authService.revokeToken(
      suspiciousToken, 
      'Suspicious activity detected'
    )
    this.$message.warning('보안을 위해 토큰이 무효화되었습니다')
  } catch (error) {
    console.error('토큰 무효화 실패:', error)
  }
}
```

### 3. 모든 토큰 무효화 (revokeAllTokens)
```javascript
// 비밀번호 변경 또는 계정 탈취 의심 시
async handlePasswordChange() {
  try {
    // 비밀번호 변경 API 호출 후
    await authService.revokeAllTokens('Password changed')
    
    // 재로그인 필요
    this.$message.info('보안을 위해 모든 기기에서 로그아웃되었습니다. 다시 로그인해주세요.')
    this.$router.push('/login')
  } catch (error) {
    console.error('모든 토큰 무효화 실패:', error)
  }
}
```

### 4. 블랙리스트 통계 조회 (관리자용)
```javascript
// 관리자 대시보드에서 사용
async loadBlacklistStats() {
  try {
    const response = await authService.getBlacklistStats()
    if (response.success) {
      this.stats = response.data
      // {
      //   blacklistedTokenCount: 23,
      //   refreshFamilyCount: 5,
      //   trackedTokenCount: 45
      // }
    }
  } catch (error) {
    console.error('통계 조회 실패:', error)
  }
}
```

## 🔄 기존 logout과의 차이점

### 기존 logout (유지됨)
```javascript
// 기존 방식 - 단순히 토큰 삭제
await authService.logout()
```

### 새로운 logoutEnhanced
```javascript
// 강화된 방식 - 토큰을 블랙리스트에 추가
await authService.logoutEnhanced()
```

**주요 차이점:**
- 기존: 클라이언트에서만 토큰 삭제
- 강화: 서버 블랙리스트에 추가하여 탈취된 토큰도 무효화

## 🎯 사용 시나리오

### 1. 일반 로그아웃
```vue
<template>
  <button @click="handleLogout">로그아웃</button>
</template>

<script>
import authService from '@/services/auth'

export default {
  methods: {
    async handleLogout() {
      try {
        // 강화된 로그아웃 사용
        await authService.logoutEnhanced()
        this.$router.push('/login')
      } catch (error) {
        // 에러 시에도 로컬 토큰은 삭제됨
        this.$router.push('/login')
      }
    }
  }
}
</script>
```

### 2. 보안 설정 페이지
```vue
<template>
  <div class="security-settings">
    <h3>보안 설정</h3>
    
    <!-- 모든 기기에서 로그아웃 -->
    <button @click="logoutAllDevices" class="btn-danger">
      모든 기기에서 로그아웃
    </button>
    
    <!-- 활성 세션 목록 -->
    <div v-for="session in activeSessions" :key="session.id">
      <span>{{ session.deviceName }}</span>
      <button @click="revokeSession(session.token)">
        이 기기 로그아웃
      </button>
    </div>
  </div>
</template>

<script>
import authService from '@/services/auth'

export default {
  methods: {
    async logoutAllDevices() {
      if (!confirm('모든 기기에서 로그아웃됩니다. 계속하시겠습니까?')) {
        return
      }
      
      try {
        await authService.revokeAllTokens('User requested logout from all devices')
        this.$message.success('모든 기기에서 로그아웃되었습니다')
        this.$router.push('/login')
      } catch (error) {
        this.$message.error('오류가 발생했습니다')
      }
    },
    
    async revokeSession(token) {
      try {
        await authService.revokeToken(token, 'Session revoked by user')
        this.$message.success('해당 기기가 로그아웃되었습니다')
        this.loadActiveSessions() // 목록 새로고침
      } catch (error) {
        this.$message.error('오류가 발생했습니다')
      }
    }
  }
}
</script>
```

### 3. 관리자 대시보드
```vue
<template>
  <div class="admin-dashboard" v-if="isAdmin">
    <h3>토큰 블랙리스트 통계</h3>
    <div class="stats-grid">
      <div class="stat-card">
        <h4>블랙리스트된 토큰</h4>
        <p>{{ stats.blacklistedTokenCount }}</p>
      </div>
      <div class="stat-card">
        <h4>리프레시 토큰 패밀리</h4>
        <p>{{ stats.refreshFamilyCount }}</p>
      </div>
      <div class="stat-card">
        <h4>추적 중인 토큰</h4>
        <p>{{ stats.trackedTokenCount }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import authService from '@/services/auth'

export default {
  data() {
    return {
      stats: {
        blacklistedTokenCount: 0,
        refreshFamilyCount: 0,
        trackedTokenCount: 0
      }
    }
  },
  computed: {
    isAdmin() {
      const user = authService.getCurrentUser()
      return user?.role === 'ADMIN'
    }
  },
  async mounted() {
    if (this.isAdmin) {
      await this.loadStats()
    }
  },
  methods: {
    async loadStats() {
      try {
        const response = await authService.getBlacklistStats()
        if (response.success) {
          this.stats = response.data
        }
      } catch (error) {
        console.error('통계 로드 실패:', error)
      }
    }
  }
}
</script>
```

## 🔧 마이그레이션 가이드

### 기존 로그아웃 버튼 업데이트
```javascript
// Before
await authService.logout()

// After (보안 강화)
await authService.logoutEnhanced()
```

### 비밀번호 변경 플로우
```javascript
// 비밀번호 변경 후 추가
async onPasswordChanged() {
  // 1. 비밀번호 변경 API 호출
  await changePasswordAPI(...)
  
  // 2. 모든 토큰 무효화 (새로 추가)
  await authService.revokeAllTokens('Password changed')
  
  // 3. 재로그인 유도
  this.$router.push('/login')
}
```

## ⚠️ 주의사항

1. **기존 호환성**: 기존 `logout()` 함수는 그대로 유지되므로 점진적 마이그레이션 가능
2. **에러 처리**: 블랙리스트 API 실패 시에도 로컬 토큰은 삭제되도록 처리
3. **관리자 권한**: `getBlacklistStats()`는 ADMIN 권한 필요
4. **토큰 저장**: 민감한 작업 시 현재 토큰을 별도로 저장하지 않도록 주의

## 📝 테스트 방법

```javascript
// 개발자 콘솔에서 테스트
import authService from '@/services/auth'

// 1. 강화된 로그아웃 테스트
await authService.logoutEnhanced()

// 2. 토큰 무효화 테스트 (현재 토큰 사용)
const currentToken = localStorage.getItem('accessToken')
await authService.revokeToken(currentToken, 'Test revocation')

// 3. 모든 토큰 무효화 테스트
await authService.revokeAllTokens('Test all revocation')

// 4. 통계 조회 (관리자만)
const stats = await authService.getBlacklistStats()
console.log('Blacklist stats:', stats)
```

---

이제 프론트엔드에서 강화된 JWT 블랙리스트 기능을 사용할 수 있습니다!