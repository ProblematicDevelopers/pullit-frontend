import { defineStore } from 'pinia'

export const useLayoutStore = defineStore('layout', {
  state: () => ({
    headerTitle: '대시보드',
    footerText: '© 2025 중학교 문제은행 시스템. All Rights Reserved.',
    userName: '김선생',
    userRole: '교사',
    schoolName: '서울중학교',
    isAuthenticated: true,
    currentSchoolYear: 2025,
    currentSemester: 1
  }),
  
  getters: {
    fullUserName: (state) => {
      if (state.userRole && state.schoolName) {
        return `${state.schoolName} ${state.userName} ${state.userRole}`
      }
      return state.userName
    },
    
    currentPeriod: (state) => {
      return `${state.currentSchoolYear}학년도 ${state.currentSemester}학기`
    }
  },
  
  actions: {
    setHeaderTitle(title) {
      this.headerTitle = title
    },
    
    setUserName(name) {
      this.userName = name
    },
    
    setUserRole(role) {
      this.userRole = role
    },
    
    setSchoolInfo(schoolName, year, semester) {
      this.schoolName = schoolName
      this.currentSchoolYear = year
      this.currentSemester = semester
    },
    
    setAuthenticationStatus(isAuthenticated) {
      this.isAuthenticated = isAuthenticated
    },
    
    // 사용자 정보 초기화 (로그아웃 시 사용)
    clearUserInfo() {
      this.userName = 'Guest'
      this.userRole = ''
      this.schoolName = ''
      this.isAuthenticated = false
      this.headerTitle = '대시보드'
    },
    
    // 페이지별 헤더 제목 자동 설정
    setPageTitle(routeName) {
      const pageTitles = {
        'home': '대시보드',
        'test-bank': '문제은행 관리',
        'exam-management': '시험 관리', 
        'student-report': '성적 분석',
        'settings': '시스템 설정',
        'help': '도움말',
        'profile': '사용자 정보'
      }
      
      this.headerTitle = pageTitles[routeName] || '시스템 관리'
    }
  }
})
