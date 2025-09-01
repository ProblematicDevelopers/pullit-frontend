<template>
  <nav class="navigation-menu">
    <div class="nav-container">
      <!-- Role Selector -->
      <div class="role-selector">
        <button
          class="role-btn"
          :class="{ active: currentRole === 'teacher' }"
          @click="setRole('teacher')"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" class="role-icon">
            <path d="M12 3L1 9L12 15L21 9.18V17H23V9L12 3M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z"/>
          </svg>
          선생님
        </button>
        <button
          class="role-btn"
          :class="{ active: currentRole === 'student' }"
          @click="setRole('student')"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" class="role-icon">
            <path d="M12 14Q10.35 14 9.175 12.825Q8 11.65 8 10Q8 8.35 9.175 7.175Q10.35 6 12 6Q13.65 6 14.825 7.175Q16 8.35 16 10Q16 11.65 14.825 12.825Q13.65 14 12 14ZM6 22V19.5Q6 18.275 6.688 17.388Q7.375 16.5 8.4 16.1Q10.55 15.25 12.75 15.25Q14.95 15.25 17.1 16.1Q18.125 16.5 18.813 17.388Q19.5 18.275 19.5 19.5V22Z"/>
          </svg>
          학생
        </button>
      </div>

      <!-- Main Navigation Menu -->
      <div class="nav-menu">
        <router-link
          to="/"
          class="nav-item"
          :class="{ 'active': isCurrentRoute('/') }"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" class="nav-icon">
            <path d="M10 20V14H14V20H19V12H22L12 3L2 12H5V20H10Z"/>
          </svg>
          <span>홈</span>
        </router-link>

        <router-link
          to="/test-bank"
          class="nav-item"
          :class="{ 'active': isCurrentRoute('/test-bank') }"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" class="nav-icon">
            <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2M18 20H6V4H13V9H18V20Z"/>
          </svg>
          <span>문제은행</span>
        </router-link>

        <router-link
          to="/exam-management"
          class="nav-item"
          :class="{ 'active': isCurrentRoute('/exam-management') }"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" class="nav-icon">
            <path d="M19 3H18V1H16V3H8V1H6V3H5C3.89 3 3.01 3.9 3.01 5L3 19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3M19 19H5V8H19V19M7 10H12V15H7"/>
          </svg>
          <span>시험관리</span>
        </router-link>

        <router-link
          to="/student/report"
          class="nav-item"
          :class="{ 'active': isCurrentRoute('/student/report') }"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" class="nav-icon">
            <path d="M3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V9C21 7.89 20.1 7 19 7H13L11 5H5C3.89 5 3 5.89 3 5M7 18V9H9L11 11H17V18H7Z"/>
          </svg>
          <span>성적분석</span>
        </router-link>

        <router-link
          to="/resources"
          class="nav-item"
          :class="{ 'active': isCurrentRoute('/resources') }"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" class="nav-icon">
            <path d="M12 2L3 7L12 12L21 7L12 2M3 17L12 22L21 17M3 12L12 17L21 12"/>
          </svg>
          <span>학습자료</span>
        </router-link>

        <router-link
          to="/analytics"
          class="nav-item"
          :class="{ 'active': isCurrentRoute('/analytics') }"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" class="nav-icon">
            <path d="M16 6L18.29 8.29L13.41 13.17L9.41 9.17L2 16.59L3.41 18L9.41 12L13.41 16L19.71 9.71L22 12V6"/>
          </svg>
          <span>분석리포트</span>
        </router-link>
      </div>

      <!-- Quick Actions -->
      <div class="nav-actions">
        <button
          class="action-btn primary-action"
          @click="createNewTest"
          title="새 시험지 만들기"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" class="action-icon">
            <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
          </svg>
          <span>시험지 생성</span>
        </button>
      </div>
    </div>
  </nav>
</template>

<script>
import { useRoute, useRouter } from 'vue-router'
import { ref } from 'vue'

export default {
  name: 'NavMenu',
  emits: ['roleChange'],
  setup(props, { emit }) {
    const route = useRoute()
    const router = useRouter()

    // State
    const currentRole = ref('teacher')

    // Methods
    const isCurrentRoute = (path) => {
      if (path === '/') {
        return route.path === '/'
      }
      return route.path.startsWith(path)
    }

    const setRole = (role) => {
      currentRole.value = role
      emit('roleChange', role)
    }

    const createNewTest = () => {
      router.push('/exam/wizard')
    }

    return {
      currentRole,
      isCurrentRoute,
      setRole,
      createNewTest
    }
  }
}
</script>

<style scoped>
/* Navigation Menu Styles */
.navigation-menu {
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  position: relative;
}

.nav-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  gap: 32px;
}

/* Role Selector */
.role-selector {
  display: flex;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 3px;
  flex-shrink: 0;
}

.role-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 5px;
  color: #64748b;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.role-btn:hover {
  background: #e2e8f0;
  color: #1e293b;
}

.role-btn.active {
  background: #2563eb;
  color: white;
  box-shadow: 0 1px 3px rgba(37, 99, 235, 0.3);
}

.role-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* Navigation Menu */
.nav-menu {
  display: flex;
  align-items: center;
  flex: 1;
  justify-content: center;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  color: #64748b;
  font-size: 14px;
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
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

/* Quick Actions */
.nav-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
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
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .nav-container {
    padding: 0 16px;
    gap: 24px;
  }
}

@media (max-width: 768px) {
  .nav-container {
    flex-direction: column;
    height: auto;
    padding: 16px;
    gap: 16px;
  }

  .nav-menu {
    order: 1;
    flex-wrap: wrap;
    gap: 8px;
  }

  .role-selector {
    order: 0;
    align-self: stretch;
    justify-content: center;
  }

  .nav-actions {
    order: 2;
    align-self: stretch;
    justify-content: center;
  }

  .nav-item span {
    display: none;
  }

  .nav-item {
    padding: 10px;
  }
}

@media (max-width: 480px) {
  .action-btn span {
    display: none;
  }

  .nav-item {
    padding: 8px;
  }
}
</style>
