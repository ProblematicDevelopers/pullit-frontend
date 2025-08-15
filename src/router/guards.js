import authService from '@/services/auth'

/**
 * 인증이 필요한 라우트 가드
 */
export const requireAuth = (to, from, next) => {
  if (!authService.isAuthenticated()) {
    // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  } else {
    next()
  }
}

/**
 * 역할 기반 라우트 가드
 * @param {string[]} allowedRoles - 허용된 역할 배열
 */
export const requireRole = (allowedRoles) => {
  return (to, from, next) => {
    const user = authService.getCurrentUser()
    
    if (!user) {
      next('/login')
      return
    }
    
    if (allowedRoles.includes(user.role)) {
      next()
    } else {
      // 권한이 없는 경우 403 페이지 또는 홈으로 리다이렉트
      next('/403')
    }
  }
}

/**
 * 이미 로그인한 사용자의 로그인 페이지 접근 방지
 */
export const preventAuthenticated = (to, from, next) => {
  if (authService.isAuthenticated()) {
    const user = authService.getCurrentUser()
    
    // 역할에 따라 대시보드로 리다이렉트
    if (user?.role === 'ADMIN') {
      next('/class-management')
    } else if (user?.role === 'TEACHER') {
      next('/class-management')
    } else if (user?.role === 'STUDENT') {
      next('/student/main')
    } else {
      next('/')
    }
  } else {
    next()
  }
}