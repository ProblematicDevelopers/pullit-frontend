<template>
  <header class="professional-header">
    <!-- Utility Bar - Matches tsherpa.co.kr style -->
    <div class="utility-bar">
      <div class="utility-bar-content">
        <!-- Dev Toggle (temporary for testing) -->
<!--        <div class="dev-section">-->
<!--          <button @click="toggleUserType" class="dev-toggle" v-if="!isLoggedIn">-->
<!--            🎭 역할: {{ userType === 'teacher' ? '선생님' : '학생' }}-->
<!--          </button>-->
<!--        </div>-->

        <!-- Utility Links -->
        <div class="utility-links">
          <!-- Guest state -->
          <template v-if="!isLoggedIn">
            <a href="#" @click.prevent="handleLogin" class="utility-link">로그인</a>
            <span class="utility-divider">|</span>
            <a href="#" @click.prevent="handleSignup" class="utility-link">회원가입</a>
          </template>

          <!-- Logged in state -->
          <template v-else>
            <!-- Notification Bell -->
            <NotificationBell />
            <span class="utility-divider">|</span>

            <div class="user-welcome">
              <span class="welcome-text">{{ userDisplayName }}</span>
              <div class="user-menu" :class="{ open: isUserMenuOpen }">
                <button class="user-dropdown-trigger" @click="toggleUserMenu">
                  <svg viewBox="0 0 24 24" fill="currentColor" class="dropdown-arrow">
                    <path d="M7 10L12 15L17 10H7Z" />
                  </svg>
                </button>

                <!-- User Dropdown -->
                <div class="user-dropdown" v-show="isUserMenuOpen">
                  <router-link to="/profile" class="dropdown-item" @click="closeUserMenu">
                    <svg viewBox="0 0 24 24" fill="currentColor" class="dropdown-icon-small">
                      <path
                        d="M12 12C14.21 12 16 10.21 16 8S14.21 4 12 4S8 5.79 8 8S9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
                      />
                    </svg>
                    내 프로필
                  </router-link>
                  <router-link to="/settings" class="dropdown-item" @click="closeUserMenu">
                    <svg viewBox="0 0 24 24" fill="currentColor" class="dropdown-icon-small">
                      <path
                        d="M19.14,12.94C19.18,12.64 19.2,12.33 19.2,12C19.2,11.68 19.18,11.36 19.13,11.06L21.16,9.48C21.34,9.34 21.39,9.07 21.28,8.87L19.36,5.55C19.24,5.33 18.99,5.26 18.77,5.33L16.38,6.29C15.93,5.93 15.45,5.64 14.92,5.42L14.56,2.85C14.53,2.61 14.33,2.43 14.09,2.43H10.25C10.01,2.43 9.81,2.61 9.78,2.85L9.42,5.42C8.89,5.64 8.41,5.93 7.96,6.29L5.57,5.33C5.35,5.25 5.1,5.33 4.98,5.55L3.06,8.87C2.95,9.08 3,9.34 3.18,9.48L5.21,11.06C5.16,11.36 5.14,11.69 5.14,12C5.14,12.31 5.16,12.64 5.21,12.94L3.18,14.52C3,14.66 2.95,14.93 3.06,15.13L4.98,18.45C5.1,18.67 5.35,18.74 5.57,18.67L7.96,17.71C8.41,18.07 8.89,18.36 9.42,18.58L9.78,21.15C9.81,21.39 10.01,21.57 10.25,21.57H14.09C14.33,21.57 14.53,21.39 14.56,21.15L14.92,18.58C15.45,18.36 15.93,18.07 16.38,17.71L18.77,18.67C18.99,18.75 19.24,18.67 19.36,18.45L21.28,15.13C21.39,14.93 21.34,14.66 21.16,14.52L19.14,12.94ZM12,15.6C10.02,15.6 8.4,13.98 8.4,12C8.4,10.02 10.02,8.4 12,8.4C13.98,8.4 15.6,10.02 15.6,12C15.6,13.98 13.98,15.6 12,15.6Z"
                      />
                    </svg>
                    설정
                  </router-link>
                  <div class="dropdown-divider"></div>
                  <button class="dropdown-item logout-item" @click="handleLogout">
                    <svg viewBox="0 0 24 24" fill="currentColor" class="dropdown-icon-small">
                      <path
                        d="M17 7L15.59 8.41 18.17 11H8V13H18.17L15.59 15.58L17 17L22 12L17 7M4 5H12V3H4C2.9 3 2 3.9 2 5V19C2 20.1 2.9 21 4 21H12V19H4V5Z"
                      />
                    </svg>
                    로그아웃
                  </button>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Main Header with Logo + Navigation -->
    <div class="main-header">
      <div class="header-content">
        <!-- Logo Section -->
        <div class="brand-section">
          <router-link to="/" class="logo-container">
            <div class="logo">
              <img src="@/assets/logo.png" alt="Pullit Logo" class="logo-img" />
            </div>
            <div class="brand-text">
              <h1 class="brand-title">PULLIT</h1>
              <span class="brand-subtitle">중학교 문제은행 시스템</span>
            </div>
          </router-link>
        </div>

        <!-- Inline Navigation Menu -->
        <nav class="inline-nav">
          <!-- Common menu items for both roles -->

          <!-- Teacher-specific menu items -->
          <template v-if="userType === 'teacher'">
            <router-link to="/" class="nav-item" :class="{ active: isCurrentRoute('/') }">
              <svg viewBox="0 0 24 24" class="nav-icon">
                <path d="M10 20V14H14V20H19V12H22L12 3L2 12H5V20H10Z" />
              </svg>
              <span>홈</span>
            </router-link>


<!--            <router-link-->
<!--              to="/exam-management"-->
<!--              class="nav-item"-->
<!--              :class="{ active: isCurrentRoute('/exam-management') }"-->
<!--            >-->
<!--              <svg viewBox="0 0 24 24" class="nav-icon">-->
<!--                <path-->
<!--                  d="M19 3H18V1H16V3H8V1H6V3H5C3.89 3 3.01 3.9 3.01 5L3 19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3M19 19H5V8H19V19M7 10H12V15H7"-->
<!--                />-->
<!--              </svg>-->
<!--              <span>시험관리</span>-->
<!--            </router-link>-->


            <router-link
              to="/class-dashboard"
              class="nav-item"
              :class="{ active: isCurrentRoute('/class-dashboard') }"
            >
              <svg viewBox="0 0 24 24" class="nav-icon">
                <path
                  d="M12 5.5A3.5 3.5 0 0 1 15.5 9A3.5 3.5 0 0 1 12 12.5A3.5 3.5 0 0 1 8.5 9A3.5 3.5 0 0 1 12 5.5M5 8C5.56 8 6.08 8.15 6.53 8.42C6.38 9.85 6.8 11.27 7.66 12.38C7.16 13.34 6.16 14 5 14A3 3 0 0 1 2 11A3 3 0 0 1 5 8M19 8A3 3 0 0 1 22 11A3 3 0 0 1 19 14C17.84 14 16.84 13.34 16.34 12.38C17.2 11.27 17.62 9.85 17.47 8.42C17.92 8.15 18.44 8 19 8M5.5 18.25C5.5 16.18 8.41 14.5 12 14.5C15.59 14.5 18.5 16.18 18.5 18.25V20H5.5V18.25M0 20V18.5C0 17.11 1.89 15.94 4.45 15.6C3.86 16.28 3.5 17.22 3.5 18.25V20H0M24 20H20.5V18.25C20.5 17.22 20.14 16.28 19.55 15.6C22.11 15.94 24 17.11 24 18.5V20Z"
                />
              </svg>
              <span>대시보드</span>
            </router-link>

            <router-link
              to="/item-processing"
              class="nav-item"
              :class="{ active: isCurrentRoute('/item-processing') }"
            >
              <svg viewBox="0 0 24 24" class="nav-icon">
                <path
                  d="M19 3H5C3.89 3 3 3.89 3 5V19C3 20.11 3.89 21 5 21H19C20.11 21 21 20.11 21 19V5C21 3.89 20.11 3 19 3M19 19H5V5H19V19M17 17H7V7H17V17M15 15H9V9H15V15M13 13H11V11H13V13Z"
                />
              </svg>
              <span>문제 등록</span>
            </router-link>
          </template>

          <!-- Student-specific menu items -->
          <template v-else>
            <router-link
              to="/"
              class="nav-item"
              :class="{ active: isCurrentRoute('/student/dashboard') }"
            >
              <svg viewBox="0 0 24 24" class="nav-icon">
                <path d="M10 20V14H14V20H19V12H22L12 3L2 12H5V20H10Z" />
              </svg>
              <span>홈</span>
            </router-link>
            <router-link
              to="/student/cbt/step01"
              class="nav-item"
              :class="{ active: isCurrentRoute('/student/cbt/step01') }"
            >
              <svg viewBox="0 0 24 24" class="nav-icon">
                <path d="M17 3H7C5.9 3 5 3.9 5 5V21L12 18L19 21V5C19 3.9 18.1 3 17 3Z" />
              </svg>
              <span>시험응시</span>
            </router-link>

            <router-link
              to="/student/report"
              class="nav-item"
              :class="{ active: isCurrentRoute('/student/report') }"
            >
              <svg viewBox="0 0 24 24" class="nav-icon">
                <path
                  d="M3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V9C21 7.89 20.1 7 19 7H13L11 5H5C3.89 5 3 5.89 3 5M7 18V9H9L11 11H17V18H7Z"
                />
              </svg>
              <span>내 성적</span>
            </router-link>

            <!-- <router-link
              to="/student/wrong-notes"
              class="nav-item"
              :class="{ 'active': isCurrentRoute('/student/wrong-notes') }"
            >
              <svg viewBox="0 0 24 24" class="nav-icon">
                <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2M18 20H6V4H13V9H18V20M8.93 12.22H16V19.29L8.93 12.22Z"/>
              </svg>
              <span>오답노트</span>
            </router-link> -->

            <router-link
              to="/student/class-room/my-class"
              class="nav-item"
              :class="{ active: isCurrentRoute('/student/class-room/my-class') }"
            >
              <svg viewBox="0 0 24 24" class="nav-icon">
                <path
                  d="M12 5.5A3.5 3.5 0 0 1 15.5 9A3.5 3.5 0 0 1 12 12.5A3.5 3.5 0 0 1 8.5 9A3.5 3.5 0 0 1 12 5.5M5 8C5.56 8 6.08 8.15 6.53 8.42C6.38 9.85 6.8 11.27 7.66 12.38C7.16 13.34 6.16 14 5 14A3 3 0 0 1 2 11A3 3 0 0 1 5 8M19 8A3 3 0 0 1 22 11A3 3 0 0 1 19 14C17.84 14 16.84 13.34 16.34 12.38C17.2 11.27 17.62 9.85 17.47 8.42C17.92 8.15 18.44 8 19 8M5.5 18.25C5.5 16.18 8.41 14.5 12 14.5C15.59 14.5 18.5 16.18 18.5 18.25V20H5.5V18.25M0 20V18.5C0 17.11 1.89 15.94 4.45 15.6C3.86 16.28 3.5 17.22 3.5 18.25V20H0M24 20H20.5V18.25C20.5 17.22 20.14 16.28 19.55 15.6C22.11 15.94 24 17.11 24 18.5V20Z"
                />
              </svg>
              <span>우리반</span>
            </router-link>

            <!-- <router-link
              to="/student/progress"
              class="nav-item"
              :class="{ active: isCurrentRoute('/student/progress') }"
            >
              <svg viewBox="0 0 24 24" class="nav-icon">
                <path
                  d="M11 7V13L16.2 15.5L17 14.2L12.5 12.2V7H11M20 12V18H22V12H20M20 20V22H22V20H20M18 20C16.3 21.3 14.3 22 12 22C7 22 2.6 19.2 0.6 15L2.4 14.1C4 17.5 7.6 20 12 20C14 20 15.9 19.5 17.5 18.5L15 16L22 15L21 22L18 20Z"
                />
              </svg>
              <span>학습진도</span>
            </router-link> -->
          </template>
        </nav>

        <!-- Quick Actions -->
        <div class="nav-actions">
          <!-- Teacher action button -->
          <button
            v-if="userType === 'teacher'"
            class="action-btn primary-action"
            @click="createNewTest"
            title="새 시험지 만들기"
          >
            <svg viewBox="0 0 24 24" class="action-icon">
              <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
            </svg>
            <span>시험지 생성</span>
          </button>

          <!-- Student action button -->
          <button v-else class="action-btn primary-action" @click="takeExam" title="시험 응시하기">
            <svg viewBox="0 0 24 24" class="action-icon">
              <path
                d="M9 2H18C18.55 2 19 2.45 19 3V14L17 12V4H9V20H17V18L19 16V21C19 21.55 18.55 22 18 22H8C7.45 22 7 21.55 7 21V3C7 2.45 7.45 2 8 2H9M12 8L16 12L12 16L10.6 14.6L12.2 13H3V11H12.2L10.6 9.4L12 8Z"
              />
            </svg>
            <span>시험 응시</span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script>
import { useLayoutStore } from '@/store/layoutStore'
import { storeToRefs } from 'pinia'
import { useRouter, useRoute } from 'vue-router'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import authService from '@/services/auth'
import NotificationBell from './NotificationBell.vue'

export default {
  name: 'Header',
  components: {
    NotificationBell
  },
  setup() {
    const layoutStore = useLayoutStore()
    const { userName, schoolName, currentSchoolYear, currentSemester } = storeToRefs(layoutStore)
    const router = useRouter()
    const route = useRoute()

    // State
    const userType = ref(localStorage.getItem('userType') || 'teacher')
    const isUserMenuOpen = ref(false)
    const isLoggedIn = ref(authService.isAuthenticated()) // 실제 인증 상태 확인

    // Computed properties
    const userDisplayName = computed(() => {
      if (!userName.value) return ''
      const roleSuffix = userType.value === 'teacher' ? '선생님' : '학생'
      return `${userName.value}${roleSuffix}`
    })
    const currentPeriod = computed(
      () => `${currentSchoolYear.value}학년도 ${currentSemester.value}학기`,
    )

    // Methods
    const getUserInitials = (name) => {
      if (!name) return 'U'
      return name.charAt(0).toUpperCase()
    }

    // Auto-detect user type on login (simulation for demo)
    const detectUserType = () => {
      // In real implementation, this would be determined from login response
      // For demo, cycle through different user types and names
      const users = [
        { name: '김선생', type: 'teacher' },
        { name: '박학생', type: 'student' },
        { name: '이교사', type: 'teacher' },
        { name: '정학생', type: 'student' },
      ]
      const user = users[Math.floor(Math.random() * users.length)]
      userName.value = user.name
      userType.value = user.type
    }

    const toggleUserMenu = () => {
      isUserMenuOpen.value = !isUserMenuOpen.value
    }

    const closeUserMenu = () => {
      isUserMenuOpen.value = false
    }

    const handleLogin = () => {
      router.push('/login')
    }

    const handleSignup = () => {
      router.push('/signup')
    }

    const handleLogout = async () => {
      try {
        await authService.logoutEnhanced()
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        isLoggedIn.value = false
        closeUserMenu()
        router.push('/login')
      }
    }

    // For testing purposes - toggle login state
    const toggleLoginState = () => {
      isLoggedIn.value = !isLoggedIn.value
      if (isLoggedIn.value) {
        // Auto-detect user type and set appropriate test user
        detectUserType()
      } else {
        // Clear user data on logout
        userName.value = ''
        userType.value = 'teacher'
      }
    }

    // Navigation methods
    const isCurrentRoute = (path) => {
      if (path === '/') {
        return route.path === '/'
      }
      return route.path.startsWith(path)
    }

    const createNewTest = () => {
      // 팝업으로 시험지 제작 마법사 열기
      const width = 1400
      const height = 900
      const left = (window.screen.width - width) / 2
      const top = (window.screen.height - height) / 2

      const features = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`

      window.open('/exam/wizard', 'TestWizardPopup', features)
    }

    const takeExam = () => {
      router.push('/student/cbt/step01')
    }

    // Toggle user type for testing
    const toggleUserType = () => {
      userType.value = userType.value === 'teacher' ? 'student' : 'teacher'
      localStorage.setItem('userType', userType.value)
    }

    // Click outside to close dropdown
    const handleClickOutside = (event) => {
      const userMenu = event.target.closest('.user-menu')
      if (!userMenu && isUserMenuOpen.value) {
        closeUserMenu()
      }
    }

    onMounted(() => {
      document.addEventListener('click', handleClickOutside)

      // 로그인 상태 확인 및 사용자 정보 로드
      if (isLoggedIn.value) {
        const user = authService.getCurrentUser()
        if (user) {
          userName.value = user.fullName || user.username
          userType.value = user.role === 'TEACHER' ? 'teacher' : 'student'
        }
      }
    })

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside)
    })

    return {
      userName,
      schoolName,
      currentPeriod,
      userType,
      userDisplayName,
      isUserMenuOpen,
      isLoggedIn,
      getUserInitials,
      detectUserType,
      toggleUserMenu,
      closeUserMenu,
      handleLogin,
      handleSignup,
      handleLogout,
      toggleLoginState,
      isCurrentRoute,
      createNewTest,
      takeExam,
      toggleUserType,
    }
  },
}
</script>

<style scoped>
/* Professional Clean Header */
.professional-header {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  width: 100vw;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

/* === UTILITY BAR (Top Bar) === */
.utility-bar {
  background: #f8f9fa;
  border-bottom: 1px solid #e5e7eb;
  height: 36px;
  width: 100%;
  padding: 0;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.utility-bar-content {
  width: 90%;
  margin: 0 auto;
  padding: 0;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  height: 100%;
}

.dev-section {
  flex: 1;
}

.dev-toggle {
  padding: 4px 10px;
  background: #fbbf24;
  color: #713f12;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.dev-toggle:hover {
  background: #f59e0b;
}

.utility-links {
  display: flex;
  align-items: center;
  gap: 0;
  font-size: 13px;
}

.utility-link {
  color: #6b7280;
  text-decoration: none;
  padding: 0 8px;
  transition: color 0.2s;
}

.utility-link:hover {
  color: #374151;
  text-decoration: none;
}

.utility-divider {
  color: #d1d5db;
  font-size: 11px;
  margin: 0 2px;
}

.user-welcome {
  display: flex;
  align-items: center;
  gap: 4px;
}

.welcome-text {
  color: #374151;
  font-weight: 500;
  font-size: 13px;
}

.user-dropdown-trigger {
  background: none;
  border: none;
  padding: 2px;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.dropdown-arrow {
  width: 12px;
  height: 12px;
  color: #9ca3af;
  fill: currentColor;
  transition:
    transform 0.2s,
    color 0.2s;
}

.user-dropdown-trigger:hover .dropdown-arrow {
  color: #6b7280;
}

.user-menu.open .dropdown-arrow {
  transform: rotate(180deg);
}

/* === MAIN HEADER === */
.main-header {
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  padding: 0;
  width: 100%;
  flex-shrink: 0;
}

.header-content {
  width: 90%;
  margin: 0 auto;
  padding: 1.25rem 0;
  display: flex;
  align-items: center;
  gap: 32px;
  min-height: 80px;
}

/* === BRAND SECTION === */
.brand-section {
  flex-shrink: 0;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 16px;
  text-decoration: none;
  transition: opacity 0.2s;
}

.logo-container:hover {
  opacity: 0.9;
}

.logo {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-title {
  font-size: 28px;
  font-weight: 800;
  color: #2563eb;
  margin: 0;
  line-height: 1.2;
  letter-spacing: -0.5px;
}

.brand-subtitle {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
  margin-top: 2px;
}

/* === INLINE NAVIGATION === */
.inline-nav {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin: 0 32px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 18px;
  border-radius: 8px;
  color: #64748b;
  font-size: 15px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s ease;
  position: relative;
  white-space: nowrap;
}

.nav-item:hover {
  background: #f8fafc;
  color: #1e293b;
}

.nav-item.active {
  background: #eff6ff;
  color: #2563eb;
  font-weight: 600;
}

.nav-item.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 16px;
  right: 16px;
  height: 2px;
  background: #2563eb;
  border-radius: 1px;
}

.nav-icon {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  fill: currentColor;
}

/* === NAV ACTIONS === */
.nav-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.primary-action {
  background: #2563eb;
  color: white;
  box-shadow: 0 1px 3px rgba(37, 99, 235, 0.3);
}

.primary-action:hover {
  background: #1d4ed8;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.4);
}

.action-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  fill: currentColor;
}

/* === USER MENU === */
.user-menu {
  position: relative;
}

/* User Dropdown */
.user-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  width: 200px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 1000;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  background: transparent;
  border: none;
  text-decoration: none;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.dropdown-item:hover {
  background: #f8fafc;
}

.logout-item {
  color: #dc2626;
}

.logout-item:hover {
  background: #fef2f2;
}

.dropdown-icon-small {
  width: 18px;
  height: 18px;
  color: currentColor;
  fill: currentColor;
}

.dropdown-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 4px 0;
}

/* === RESPONSIVE DESIGN === */
@media (max-width: 1200px) {
  .header-content,
  .utility-bar-content {
    width: 95%;
  }

  .inline-nav {
    margin: 0 16px;
    gap: 2px;
  }

  .nav-item {
    padding: 10px 12px;
    font-size: 13px;
  }
}

@media (max-width: 768px) {
  .header-content,
  .utility-bar-content {
    width: 95%;
  }

  .header-content {
    flex-wrap: wrap;
    gap: 16px;
  }

  .brand-section {
    order: 1;
    flex: 0 0 auto;
  }

  .inline-nav {
    order: 3;
    flex: 1 1 100%;
    margin: 0;
    justify-content: flex-start;
    flex-wrap: wrap;
    gap: 8px;
  }

  .nav-actions {
    order: 2;
    flex: 0 0 auto;
  }

  .brand-title {
    font-size: 24px;
  }

  .brand-subtitle {
    font-size: 12px;
  }

  .nav-item span {
    display: none;
  }

  .nav-item {
    padding: 10px;
  }

  .action-btn span {
    display: none;
  }

  .utility-links {
    font-size: 12px;
  }

  .utility-link {
    padding: 0 6px;
  }
}

@media (max-width: 480px) {
  .header-content,
  .utility-bar-content {
    width: 95%;
  }

  .main-header {
    padding: 0;
  }

  .header-content {
    padding: 0.75rem 0;
  }

  .utility-bar {
    height: 32px;
  }

  .utility-bar-content {
    height: 100%;
  }

  .header-content {
    gap: 12px;
  }

  .logo {
    width: 48px;
    height: 48px;
  }

  .logo-img {
    width: 100%;
    height: 100%;
  }

  .brand-title {
    font-size: 20px;
  }

  .nav-item {
    padding: 8px;
  }

  .utility-links {
    font-size: 11px;
  }

  .utility-link {
    padding: 0 4px;
  }
}

/* Color Variables */
:root {
  --primary-color: #2563eb;
  --primary-dark: #1d4ed8;
  --primary-light: #eff6ff;
  --secondary-color: #64748b;
  --text-color: #1e293b;
  --text-light: #64748b;
  --bg-color: #ffffff;
  --bg-light: #f8fafc;
  --border-color: #e2e8f0;
}
</style>
